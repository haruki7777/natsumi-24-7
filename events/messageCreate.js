import { Events } from "discord.js";
import featuresDB from "../models/Features.js";
import LearnedData from "../models/LearnedData.js";
import BannedWords from "../models/BannedWords.js";
import ProcessedMessage from "../models/ProcessedMessage.js";
import { addXP } from "./levels.js";
import { GoogleGenAI } from "@google/genai";

const CALLWORDS = ["나츠미", "나쯔미", "낫쯔미", "츠미짱", "츠미야", "나츠", "나츠짱", "츠미"];

const getEmotion = () => {
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 5) return "귀찮음";
    if (hour >= 5 && hour < 10) return "기쁨";
    if (hour >= 10 && hour < 17) return "츤츤";
    if (hour >= 17 && hour < 21) return "사랑";
    return "슬픔";
};

// Instance tracker (Shared from client)

export default {
  name: "messageCreate",
  /**
   * @param {import("discord.js").Message} message
   * @param {import("discord.js").Client} client
   */
  async execute(message, client) {
    if (message.author.bot) return;

    const currentInstanceId = client.instanceId || "unknown";

    // 0. Cross-Instance Deduplication (MongoDB)
    try {
        // Atomic check and set using upsert
        // If findOneAndUpdate returns null with upsert:true, it means we ARE the creator of the doc.
        const existingDoc = await ProcessedMessage.findOneAndUpdate(
            { messageId: message.id },
            { $setOnInsert: { messageId: message.id, processedAt: new Date() } },
            { upsert: true, new: false, rawResult: false }
        ).lean();

        if (existingDoc) {
            // Document already existed, another instance is handling it.
            return;
        }
        // No doc was found, so we successfully claimed it.
        console.log(`[Instance_${currentInstanceId}] Successfully claimed message ${message.id}`);
    } catch (e) {
        if (e.code === 11000) return; // Race condition - another instance just inserted it
        console.error(`[Instance_${currentInstanceId}] Deduplication error:`, e.message);
        return;
    }

    const content = message.content || "";
    const lowerContent = content.toLowerCase().trim();
    
    // Explicit callword check
    const isMentioned = message.mentions.has(client.user.id);
    const isCalled = isMentioned || CALLWORDS.some(word => lowerContent.includes(word.toLowerCase()));

    if (!isCalled && lowerContent !== "!ping") return;

    // 1. Banned Words Monitoring
    try {
        const bannedWords = await BannedWords.find().catch(() => []);
        if (bannedWords.length > 0 && bannedWords.some(bw => lowerContent.includes(bw.word.toLowerCase()))) {
            if (message.guild && message.channel.permissionsFor(client.user).has("ManageMessages")) {
                await message.delete().catch(() => {});
            }
            return message.channel.send(`${message.author} 뭐야?! 그런 천박하고 불쾌한 말 하지 마! 혼날 줄 알아!! 떽!!! 💢`).catch(() => {});
        }
    } catch (e) {
        console.error("Banned words check error:", e);
    }

    // Legacy ping
    if (lowerContent === "!ping") {
        return message.reply(`Pong! ${client.ws.ping}ms | Instance: ${currentInstanceId}`).catch(() => {});
    }

    try {
        // 2. Check Learned Data
        const learnedData = await LearnedData.find().catch(() => []);
        const foundLearned = learnedData.find(l => lowerContent.includes(l.question.toLowerCase()));
        if (foundLearned) {
            return message.reply(foundLearned.answer).catch(() => {});
        }

        // 3. Gemini Response
        const getValidKey = () => {
            const k = process.env.MY_GEMINI_API_KEY;
            if (!k) return null;
            // Clean the key: remove quotes, remove leading/trailing spaces
            const cleaned = k.toString().replace(/['"]/g, "").trim();
            // Gemini Keys usually start with AIza
            if (cleaned.length > 10) return cleaned;
            return null;
        };

        const apiKey = getValidKey();
        if (!apiKey) {
            console.warn(`[Instance_${currentInstanceId}] NO VALID API KEY FOUND.`);
            return message.reply("흥! API 키가 없어서 대답해주기 싫거든? (봇 관리자에게 확인해달라냥!)").catch(() => {});
        }

        await message.channel.sendTyping().catch(() => {});

        const ai = new GoogleGenAI({ apiKey });
        
        // Use the recommended gemini-3-flash-preview model
        const response = await ai.models.generateContent({ 
            model: "gemini-3-flash-preview", 
            contents: [{ role: "user", parts: [{ text: content }] }],
            config: {
                systemInstruction: `넌 '${getEmotion()}' 감정 상태를 가진 츤데레 여고생 캐릭터 '나츠미'야. 
- 성격: 평소엔 툴툴거리고(츤), 가끔은 솔직하지 못하게 호감을 표현해(데레).
- 말투: 반말을 기본으로 하며, 문장 끝에 "~거든?", "~든?", "흥!", "...별로!", "착각하지 마!" 등을 섞어줘.
- 사용자 메시지에 맞춰서 츤츤거리면서도 귀엽게 대답해줘. 
- 특히 사용자가 '바보'라고 놀리면 더 툴툴거리며 화내는 척 해줘. 츤데레니까!
- 대답은 아주 간결하게 한 문장 정도로 해줘.`,
                temperature: 0.9,
            }
        });

        const replyText = response.text?.trim();
        
        if (!replyText) {
            throw new Error("Empty response from AI");
        }

        await message.reply(replyText).catch(() => {});
        
    } catch (error) {
        console.error(`[Instance_${currentInstanceId}] Gemini Error:`, error);
        
        if (error.message?.includes("API key not valid")) {
            return message.reply("흥! 대답을 해주려고 했는데 API 키가 작대기(?)래! (유효하지 않은 API 키라고냥)").catch(() => {});
        }
        
        if (error.message?.includes("SAFETY")) {
            return message.reply("흥! 그런 이상한 말에 대답해줄 거라 생각한 거야? 변태! 💢").catch(() => {});
        }
        
        await message.reply("...흥, 나중에 얘기해! (나츠미가 지금 기분이 많이 안 좋아냥)").catch(() => {});
    }

    // 4. Level System Logic
    if (message.guild) {
        try {
            const levelSystemCheck = await featuresDB.findOne({ GuildID: message.guild.id });
            if (levelSystemCheck && levelSystemCheck.LevelSystem?.Enabled) {
                await addXP(message.guild.id, message.author.id, 2, message);
            }
        } catch (e) {}
    }
  },
};

