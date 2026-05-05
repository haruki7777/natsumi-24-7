import { Events } from "discord.js";
import featuresDB from "../models/Features.js";
import LearnedData from "../models/LearnedData.js";
import BannedWords from "../models/BannedWords.js";
import ProcessedMessage from "../models/ProcessedMessage.js";
import { addXP } from "./levels.js";
import { generateDistributedContent, getEmotion } from "../utils/ai.js";

const CALLWORDS = ["나츠미", "나쯔미", "낫쯔미", "츠미짱", "츠미야", "나츠", "나츠짱", "츠미"];

let bannedWordsCache = null;
let learnedDataCache = null;
const levelFeatureCache = new Map();
const CACHE_TTL = 300000; // 5 minutes

let lastBannedWordsUpdate = 0;
let lastLearnedDataUpdate = 0;

async function getBannedWords() {
    if (bannedWordsCache && (Date.now() - lastBannedWordsUpdate < CACHE_TTL)) {
        return bannedWordsCache;
    }
    try {
        bannedWordsCache = await BannedWords.find().lean();
        lastBannedWordsUpdate = Date.now();
        return bannedWordsCache || [];
    } catch (e) {
        return bannedWordsCache || [];
    }
}

async function getLearnedData() {
    if (learnedDataCache && (Date.now() - lastLearnedDataUpdate < CACHE_TTL)) {
        return learnedDataCache;
    }
    try {
        learnedDataCache = await LearnedData.find().lean();
        lastLearnedDataUpdate = Date.now();
        return learnedDataCache || [];
    } catch (e) {
        return learnedDataCache || [];
    }
}

async function isLevelSystemEnabled(guildId) {
    const cached = levelFeatureCache.get(guildId);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
        return cached.enabled;
    }

    try {
        const feature = await featuresDB.findOne({ GuildID: guildId }).select("LevelSystem.Enabled").lean();
        const enabled = Boolean(feature?.LevelSystem?.Enabled);
        levelFeatureCache.set(guildId, { enabled, timestamp: Date.now() });
        return enabled;
    } catch (e) {
        return cached?.enabled || false;
    }
}

// In-memory cache for message deduplication (LRU style)
const localProcessedCache = new Set();
const MAX_CACHE_SIZE = 500;

let aiInstance = null;
let currentApiKey = null;

export default {
  name: "messageCreate",
  /**
   * @param {import("discord.js").Message} message
   * @param {import("discord.js").Client} client
   */
  async execute(message, client) {
    if (message.author.bot) return;

    const content = (message.content || "").trim();
    const lowerContent = content.toLowerCase();
    
    // Debug log for troubleshooting (can be seen in dashboard)
    // console.log(`[MessageLog] From: ${message.author.username} | Content: ${content.substring(0, 20)}${content.length > 20 ? '...' : ''}`);

    const isMentioned = message.mentions.has(client.user.id);
    const isCalled = isMentioned || (content.length > 0 && CALLWORDS.some(word => lowerContent.includes(word.toLowerCase())));

    // 4. Level System Logic (Move to top so all messages get XP)
    if (message.guild) {
        isLevelSystemEnabled(message.guild.id).then(enabled => {
            if (enabled) {
                addXP(message.guild.id, message.author.id, 2, message).catch(() => {});
            }
        }).catch(() => {});
    }

    // Optimization: Return early if the bot doesn't need to process this message for AI response
    if (!isMentioned && !isCalled && lowerContent !== "!ping") return;

    // 0. Intent Check (If mentioned but content is empty)
    if (isMentioned && content.length === 0) {
        return message.reply({
            content: "흥! 멘션만 하면 어쩌라는 거야? 내가 네 머릿속을 읽을 수 있을 줄 알아?\n\n> **도움말:** 나츠미가 단어(츠미야 등)만으로 응답하게 하려면 Discord Developer Portal에서 **Message Content Intent**를 활성화해야 한다냥!",
        }).catch(() => {});
    }

    // 0. Deduplication (Local first - High Speed)
    if (localProcessedCache.has(message.id)) return;
    localProcessedCache.add(message.id);
    if (localProcessedCache.size > MAX_CACHE_SIZE) {
        const first = localProcessedCache.values().next().value;
        localProcessedCache.delete(first);
    }
    
    try {
        // Fast path for DB deduplication
        const existingDoc = await ProcessedMessage.findOneAndUpdate(
            { messageId: message.id },
            { $setOnInsert: { messageId: message.id, processedAt: new Date() } },
            { upsert: true, new: false }
        ).lean();
        
        if (existingDoc && existingDoc.messageId) return;
    } catch (e) {
        if (e.code === 11000) return; // Duplicate key error
    }

    // 1. Banned Words Monitoring
    try {
        const bannedWords = await getBannedWords();
        if (bannedWords.length > 0 && bannedWords.some(bw => lowerContent.includes(bw.word.toLowerCase()))) {
            if (message.guild && message.channel.permissionsFor(client.user).has("ManageMessages")) {
                await message.delete().catch(() => {});
            }
            await message.channel.send(`${message.author} 뭐야?! 그런 천박하고 불쾌한 말 하지 마! 혼날 줄 알아!! 떽!!! 💢`).catch(() => {});
            return;
        }
    } catch (e) {}

    // Legacy ping
    if (lowerContent === "!ping") {
        const instId = client.instanceId || "unknown";
        return message.reply(`Pong! ${client.ws.ping}ms | ID: ${instId}`).catch(() => {});
    }

    try {
        // 2. Check Learned Data
        const learnedData = await getLearnedData();
        const foundLearned = learnedData.find(l => lowerContent.includes(l.question.toLowerCase()));
        if (foundLearned) {
            return message.reply(foundLearned.answer).catch(() => {});
        }

        // 3. Gemini Response
        await message.channel.sendTyping().catch(() => {});

        const response = await generateDistributedContent({ 
            contents: [{ role: "user", parts: [{ text: content }] }],
            config: {
                systemInstruction: `넌 '${getEmotion()}' 감정 상태를 가진 츤데레 여고생 캐릭터 '나츠미'야. 
- 성격: 평소엔 툴툴거리고(츤), 가끔은 솔직하지 못하게 호감을 표현해(데레).
- 말투: 반말을 기본으로 하며, 문장 끝에 "~거든?", "~든?", "흥!", "...별로!", "착각하지 마!" 등을 섞어줘.
- 대답은 반드시 '두 문장' 정도의 분량으로 츤데레 특성을 아주 강하게 담아서 대답해줘.`,
                temperature: 0.9,
            }
        }).catch(err => {
            if (err.message.includes("429") || err.message === "ALL_MODELS_QUOTA_EXCEEDED") {
                throw new Error("QUOTA_EXCEEDED");
            } else if (err.message.includes("SAFETY")) {
                throw new Error("SAFETY_BLOCK");
            }
            throw err;
        });

        const replyText = response.text?.trim();
        if (replyText) await message.reply(replyText).catch(() => {});
        
    } catch (error) {
        if (error.message === "QUOTA_EXCEEDED") {
            await message.reply("지금은 좀 바쁘거든?! 나중에 다시 말 걸어! (API 사용량이 초과됐다냥, 잠시 후 다시 시도해달라냥!)").catch(() => {});
        } else if (error.message === "SAFETY_BLOCK") {
            await message.reply("변태! 그런 이상한 말에 내가 대답해줄 줄 알아?! (AI 안전 필터에 의해 차단된 문장이다냥!)").catch(() => {});
        } else {
            console.error(`[GeminiError]`, error);
            await message.reply("...흥, 나중에 얘기해!").catch(() => {});
        }
    }
  },
};

