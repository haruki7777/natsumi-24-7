import { Events, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import featuresDB from "../models/Features.js";
import LearnedData from "../models/LearnedData.js";
import BannedWords from "../models/BannedWords.js";
import ProcessedMessage from "../models/ProcessedMessage.js";
import NatsumiGuildSetup from "../models/NatsumiGuildSetup.js";
import { addXP } from "./levels.js";
import { generateDistributedContent, getEmotion } from "../utils/ai.js";

const CALLWORDS = ["나츠미", "나쯔미", "낫쯔미", "츠미짱", "츠미야", "나츠", "나츠짱", "츠미"];

let bannedWordsCache = null;
let learnedDataCache = null;
const CACHE_TTL = 300000;

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

const localProcessedCache = new Set();
const MAX_CACHE_SIZE = 500;

const loadNatsumiSetup = async (guildId) => {
    if (!guildId) return null;
    return NatsumiGuildSetup.findOne({ guildId }).lean().catch(() => null);
};

const getFeatureOnlyChannelIds = (setup) => {
    const channels = setup?.featureChannels || {};
    return [channels.emoji, channels.secret, channels.anonymous, channels.aiImage].filter(Boolean);
};

const markProcessed = async (message) => {
    await ProcessedMessage.findOneAndUpdate(
        { messageId: message.id },
        { $setOnInsert: { messageId: message.id, processedAt: new Date() } },
        { upsert: true, new: false }
    ).catch(() => {});
};

const hasManageGuild = (member) => {
    return Boolean(
        member?.permissions?.has(PermissionFlagsBits.ManageGuild) ||
        member?.permissions?.has(PermissionFlagsBits.Administrator)
    );
};

const handleNatsumiAdminMode = async (message) => {
    const raw = (message.content || "").replace(/\s+/g, "");
    const isAdminMode = raw.includes("관리자모드") || raw.includes("관리자모드로");
    const isGlobalChat = raw.includes("일반채팅") || raw.includes("일반채널");
    if (!isAdminMode || !isGlobalChat) return false;

    if (!hasManageGuild(message.member)) {
        await markProcessed(message);
        await message.reply({
            content: "관리자 권한이 있어야 설정을 바꿀 수 있어. 아무나 만지면 곤란하거든 😤",
            allowedMentions: { repliedUser: false },
        }).catch(() => {});
        return true;
    }

    const enable = raw.includes("켜") || raw.includes("활성화") || raw.includes("사용");
    const disable = raw.includes("꺼") || raw.includes("비활성화") || raw.includes("막아") || raw.includes("차단");
    if (!enable && !disable) return false;

    await NatsumiGuildSetup.findOneAndUpdate(
        { guildId: message.guild.id },
        { guildId: message.guild.id, aiGlobalEnabled: enable },
        { upsert: true, new: true }
    );

    await markProcessed(message);
    await message.reply({
        content: enable
            ? "✅ 일반 채널에서도 나츠미 호출어를 사용할 수 있게 켰어. 그래도 너무 막 부르진 마 😤"
            : "✅ 일반 채널 호출어를 껐어. 이제 AI채팅 채널에서만 부를 수 있어 😼",
        allowedMentions: { repliedUser: false },
    }).catch(() => {});
    return true;
};

export default {
  name: "messageCreate",
  async execute(message, client) {
    if (message.author.bot) return;

    const content = (message.content || "").trim();
    const lowerContent = content.toLowerCase();

    const isMentioned = message.mentions.has(client.user.id);
    const isCalled = isMentioned || (content.length > 0 && CALLWORDS.some(word => lowerContent.includes(word.toLowerCase())));

    const natsumiSetup = message.guild ? await loadNatsumiSetup(message.guild.id) : null;

    if (message.guild && natsumiSetup) {
        const featureOnlyChannels = getFeatureOnlyChannelIds(natsumiSetup);
        if (featureOnlyChannels.includes(message.channel.id)) {
            return;
        }

        if (isCalled) {
            const adminHandled = await handleNatsumiAdminMode(message);
            if (adminHandled) return;

            const aiChannels = natsumiSetup.aiChannelIds || [];
            const aiGlobalEnabled = natsumiSetup.aiGlobalEnabled === true;
            if (aiChannels.length > 0 && !aiGlobalEnabled && !aiChannels.includes(message.channel.id)) {
                await markProcessed(message);
                const aiMention = aiChannels.map((id) => `<#${id}>`).join(", ");
                return message.reply({
                    content: `나츠미 호출은 ${aiMention} 에서만 가능해. 일반 채널에서도 쓰고 싶으면 \`/나츠미 일반채팅 켜기\`를 사용해줘 😤`,
                    allowedMentions: { repliedUser: false },
                }).catch(() => {});
            }
        }
    }

    if (localProcessedCache.has(message.id)) return;
    localProcessedCache.add(message.id);
    if (localProcessedCache.size > MAX_CACHE_SIZE) {
        const first = localProcessedCache.values().next().value;
        localProcessedCache.delete(first);
    }

    if (message.guild) {
        featuresDB.findOne({ GuildID: message.guild.id }).lean().then(levelSystemCheck => {
            if (levelSystemCheck && levelSystemCheck.LevelSystem?.Enabled) {
                addXP(message.guild.id, message.author.id, null, message).catch(() => {});
            }
        }).catch(() => {});
    }

    if (!isMentioned && !isCalled && lowerContent !== "!핑" && lowerContent !== "!ping") return;

    if (isMentioned && content.length === 0) {
        return message.reply({
            content: "츤! 멘션만 덜렁 보내면 어쩌라는 거야? 내가 네 속마음이라도 꿰뚫어 볼 수 있는 여우인 줄 알아? ♥(⸝⸝⸝ᵒ̴̶̷̥́ ᵕ ก̀⸝⸝⸝)ෆ\n\n> **도움말:** 나츠미가 단어(츠미야 등)만으로 응답하게 하려면 Discord Developer Portal에서 **Message Content Intent**를 활성화해야 한다구!",
        }).catch(() => {});
    }

    try {
        const existingDoc = await ProcessedMessage.findOneAndUpdate(
            { messageId: message.id },
            { $setOnInsert: { messageId: message.id, processedAt: new Date() } },
            { upsert: true, new: false }
        ).lean();
        if (existingDoc && existingDoc.messageId) return;
    } catch (e) {
        if (e.code === 11000) return;
    }

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

    if (lowerContent === "!핑" || lowerContent === "!ping") {
        const os = await import("os");
        const totalMem = (os.totalmem() / (1024 ** 3)).toFixed(1);
        const freeMem = (os.freemem() / (1024 ** 3)).toFixed(1);
        const usedMem = (totalMem - freeMem).toFixed(1);
        const cpuModel = os.cpus()[0]?.model || "알 수 없음";
        const gatewayPing = client.ws.ping;
        const gatewayStatus = gatewayPing < 150 ? "🟢" : (gatewayPing < 300 ? "🟠" : "🔴");
        const apiLatency = Date.now() - message.createdTimestamp;
        const apiStatus = apiLatency < 300 ? "🟢" : (apiLatency < 600 ? "🟠" : "🔴");
        const uptime = Math.round(client.readyTimestamp / 1000);

        const embed = new EmbedBuilder()
            .setTitle("🦊 나츠미의 여우령 시스템 점검")
            .setDescription(`콘콘~! 별로 네가 걱정돼서 보여주는 건 아니거든? \n그냥 내 시스템이 얼마나 완벽한지 자랑하고 싶을 뿐이야!`)
            .setColor("#FF8C00")
            .setThumbnail(client.user.displayAvatarURL())
            .addFields(
                { name: "🏮 핵심 데이터", value: `\`\`\`yml\n이름: ${client.user.username}\n상태: 매우 쌩쌩함\`\`\``, inline: false },
                { name: "🍃 실행 환경", value: `**운영체제:** ${os.type()}\n**업타임:** <t:${uptime}:R>`, inline: true },
                { name: "⚙️ 하드웨어", value: `**CPU:** ${cpuModel.split(' ')[0]}\n**메모리:** ${usedMem}G / ${totalMem}G`, inline: true },
                { name: "📡 통신 상태", value: `**게이트웨이:** ${gatewayStatus} (${gatewayPing}ms)\n**응답 속도:** ${apiStatus} (${apiLatency}ms)`, inline: true }
            )
            .setFooter({ text: "나츠미의 꼬리가 서버의 열기를 식히고 있다구! 🦊" })
            .setTimestamp();

        return message.reply({ embeds: [embed] }).catch(() => {});
    }

    try {
        const learnedData = await getLearnedData();
        const foundLearned = learnedData.find(l => lowerContent.includes(l.question.toLowerCase()));
        if (foundLearned) {
            return message.reply(foundLearned.answer).catch(() => {});
        }

        await message.channel.sendTyping().catch(() => {});

        const response = await generateDistributedContent({ 
            contents: [{ role: "user", parts: [{ text: content }] }],
            config: {
                systemInstruction: `넌 '${getEmotion()}' 감정 상태를 가진 츤데레 여고생 캐릭터 '나츠미'야. 가끔은 신비로운 '여우'의 모습을 보이기도 해.
- 성격: 평소엔 툴툴거리며(츤) 솔직하지 못하지만, 가끔은 여우처럼 요염하고 영악하게(데레) 너를 챙겨줘.
- 말투: 반말을 기본으로 하며, 문장 끝에 "~거든?", "~든?", "콘콘!", "흥!", "...별로!", "착각하지 마!" 등을 섞어줘.
- 대답은 반드시 '두 문장' 정도의 분량으로 츤데레와 여우의 특성을 아주 강하게 담아서 대답해줘.`,
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
            await message.reply("지금은 좀 바쁘거든?! 나중에 다시 말 걸어! (영력이 다 떨어졌어! 잠시 후에 다시 시도해!)").catch(() => {});
        } else if (error.message === "SAFETY_BLOCK") {
            await message.reply("변태! 그런 이상한 말에 내가 대답해줄 줄 알아?! (불쾌한 기운이 감돌고 있어! 말조심해!)").catch(() => {});
        } else {
            console.error(`[GeminiError]`, error);
            await message.reply("...흥, 나중에 얘기해!").catch(() => {});
        }
    }
  },
};
