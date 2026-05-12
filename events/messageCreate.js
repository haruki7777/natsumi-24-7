import { Events, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import featuresDB from "../models/Features.js";
import LearnedData from "../models/LearnedData.js";
import BannedWords from "../models/BannedWords.js";
import ProcessedMessage from "../models/ProcessedMessage.js";
import NatsumiGuildSetup from "../models/NatsumiGuildSetup.js";
import { addXP } from "./levels.js";
import { generateDistributedContent, getEmotion } from "../utils/ai.js";

const CALLWORDS = ["나츠미", "나쯔미", "낫쯔미", "츠미짱", "츠미야", "나츠", "나츠짱", "츠미"];
const TEMP_NOTICE_DELETE_MS = Number(process.env.NATSUMI_TEMP_NOTICE_DELETE_MS || 8000);
const CACHE_TTL = 300000;
const MAX_CACHE_SIZE = 500;

let bannedWordsCache = null;
let learnedDataCache = null;
let lastBannedWordsUpdate = 0;
let lastLearnedDataUpdate = 0;
const localProcessedCache = new Set();
const noticeCache = new Set();

const cacheAdd = (set, key) => {
  if (set.has(key)) return false;
  set.add(key);
  if (set.size > MAX_CACHE_SIZE) set.delete(set.values().next().value);
  return true;
};

const compact = (value) => String(value || "").replace(/\s+/g, "").toLowerCase();

async function getBannedWords() {
  if (bannedWordsCache && Date.now() - lastBannedWordsUpdate < CACHE_TTL) return bannedWordsCache;
  try {
    bannedWordsCache = await BannedWords.find().lean();
    lastBannedWordsUpdate = Date.now();
    return bannedWordsCache || [];
  } catch {
    return bannedWordsCache || [];
  }
}

async function getLearnedData() {
  if (learnedDataCache && Date.now() - lastLearnedDataUpdate < CACHE_TTL) return learnedDataCache;
  try {
    learnedDataCache = await LearnedData.find().lean();
    lastLearnedDataUpdate = Date.now();
    return learnedDataCache || [];
  } catch {
    return learnedDataCache || [];
  }
}

const markProcessed = async (message) => {
  await ProcessedMessage.findOneAndUpdate(
    { messageId: message.id },
    { $setOnInsert: { messageId: message.id, processedAt: new Date() } },
    { upsert: true, new: false }
  ).catch(() => {});
};

const claimProcessed = async (message) => {
  try {
    await ProcessedMessage.create({ messageId: message.id });
    return true;
  } catch (error) {
    return error?.code !== 11000 ? false : false;
  }
};

const isAlreadyProcessedInDb = async (message) => {
  try {
    const existingDoc = await ProcessedMessage.findOneAndUpdate(
      { messageId: message.id },
      { $setOnInsert: { messageId: message.id, processedAt: new Date() } },
      { upsert: true, new: false }
    ).lean();
    return Boolean(existingDoc?.messageId);
  } catch (error) {
    return error?.code === 11000;
  }
};

const sendTemporaryReply = async (message, content, ms = TEMP_NOTICE_DELETE_MS) => {
  const key = `${message.id}:${content.slice(0, 32)}`;
  if (!cacheAdd(noticeCache, key)) return null;

  const reply = await message.reply({ content, allowedMentions: { repliedUser: true } }).catch(() => null);
  if (reply && ms > 0) setTimeout(() => reply.delete().catch(() => {}), ms);
  return reply;
};

const loadNatsumiSetup = async (guildId) => {
  if (!guildId) return null;
  return NatsumiGuildSetup.findOne({ guildId }).lean().catch(() => null);
};

const getFeatureOnlyChannelIds = (setup) => {
  const channels = setup?.featureChannels || {};
  return [channels.emoji, channels.secret, channels.anonymous, channels.aiImage, channels.tts].filter(Boolean);
};

const hasManageGuild = (member) => Boolean(
  member?.permissions?.has(PermissionFlagsBits.ManageGuild) ||
  member?.permissions?.has(PermissionFlagsBits.Administrator)
);

const hasManageChannels = (member) => Boolean(
  member?.permissions?.has(PermissionFlagsBits.ManageChannels) ||
  member?.permissions?.has(PermissionFlagsBits.Administrator)
);

const parseSlowmodeSeconds = (value) => {
  const text = String(value || "").toLowerCase();
  const patterns = [
    { re: /(\d{1,6})\s*(?:밀리초|ms|msec|millisecond|milliseconds)\b/i, factor: 0.001 },
    { re: /(\d{1,5})\s*(?:초|sec|secs|second|seconds|s)\b/i, factor: 1 },
    { re: /(\d{1,4})\s*(?:분|min|mins|minute|minutes|m)\b/i, factor: 60 },
    { re: /(\d{1,3})\s*(?:시간|hour|hours|h)\b/i, factor: 3600 },
  ];

  for (const { re, factor } of patterns) {
    const match = text.match(re);
    if (match) return Math.ceil(Number(match[1]) * factor);
  }

  const fallback = text.match(/\d{1,5}/);
  return fallback ? Number(fallback[0]) : 0;
};

const findTargetChannel = (message, setup, raw) => {
  const mentioned = message.mentions.channels.first();
  if (mentioned) return mentioned;

  const feature = setup?.featureChannels || {};
  const candidates = [
    ["aiChat", ["ai채팅", "aichat", "에이아이채팅", "나츠미대화", "대화방"]],
    ["aiImage", ["ai그림", "그림", "이미지", "그림공방"]],
    ["emoji", ["이모지", "정제소"]],
    ["secret", ["비밀", "속삭임"]],
    ["anonymous", ["익명", "가면방"]],
    ["chat", ["잡담", "일반", "채팅", "여우찻집"]],
  ];

  for (const [key, names] of candidates) {
    const id = feature[key];
    if (id && names.some((name) => raw.includes(name))) return message.guild.channels.cache.get(id) || null;
  }
  return message.channel;
};

const handleNatsumiAdminMode = async (message, setup) => {
  const raw = compact(message.content);
  if (!raw.includes("관리자모드")) return false;

  if (raw.includes("일반채팅") || raw.includes("일반채널")) {
    if (!hasManageGuild(message.member)) {
      await markProcessed(message);
      await sendTemporaryReply(message, "관리자 권한이 있어야 설정을 바꿀 수 있어. 아무나 만지면 곤란하거든 😤");
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
    await sendTemporaryReply(message, enable
      ? "✅ 일반 채널에서도 나츠미 호출어를 사용할 수 있게 켰어. 그래도 너무 막 부르진 마 😤"
      : "✅ 일반 채널 호출어를 껐어. 이제 AI채팅 채널에서만 부를 수 있어 😼"
    );
    return true;
  }

  if (raw.includes("슬로우모드") || raw.includes("슬로우")) {
    if (!hasManageChannels(message.member)) {
      await markProcessed(message);
      await sendTemporaryReply(message, "채널 관리 권한이 있어야 슬로우모드를 바꿀 수 있어 😤");
      return true;
    }

    const seconds = parseSlowmodeSeconds(message.content);
    const safeSeconds = Math.max(0, Math.min(seconds, 21600));
    const target = findTargetChannel(message, setup, raw);

    if (!target?.isTextBased?.() || !target.setRateLimitPerUser) {
      await markProcessed(message);
      await sendTemporaryReply(message, "슬로우모드를 바꿀 텍스트 채널을 못 찾았어. 채널을 멘션해서 다시 말해줘 😭");
      return true;
    }

    await target.setRateLimitPerUser(safeSeconds, `Natsumi admin mode by ${message.author.tag}`).catch(async () => {
      await sendTemporaryReply(message, "슬로우모드 변경에 실패했어. 내 권한을 확인해줘 😭");
    });

    await markProcessed(message);
    await sendTemporaryReply(message, `✅ ${target} 슬로우모드를 ${safeSeconds}초로 바꿨어. 흥, 이 정도는 쉽거든 😤`);
    return true;
  }

  if (raw.includes("채널잠금") || raw.includes("잠가") || raw.includes("잠금") || raw.includes("채널열기") || raw.includes("풀어")) {
    if (!hasManageChannels(message.member)) {
      await markProcessed(message);
      await sendTemporaryReply(message, "채널 관리 권한이 있어야 잠금 설정을 바꿀 수 있어 😤");
      return true;
    }

    const target = findTargetChannel(message, setup, raw);
    if (!target?.permissionOverwrites?.edit) return false;

    const lock = raw.includes("잠가") || raw.includes("잠금") || raw.includes("채널잠금");
    await target.permissionOverwrites.edit(message.guild.roles.everyone.id, { SendMessages: !lock }).catch(async () => {
      await sendTemporaryReply(message, "채널 잠금 변경에 실패했어. 내 권한을 확인해줘 😭");
    });

    await markProcessed(message);
    await sendTemporaryReply(message, lock ? `🔒 ${target} 채널을 잠갔어.` : `🔓 ${target} 채널을 다시 열었어.`);
    return true;
  }

  return false;
};

const shouldBlockAiCall = (message, setup, isCalled) => {
  if (!message.guild || !isCalled) return false;
  if (!setup) return true;

  const aiChannels = setup.aiChannelIds || [];
  if (setup.aiGlobalEnabled === true) return false;
  if (aiChannels.length === 0) return true;
  return !aiChannels.includes(message.channel.id);
};

const replyAiBlocked = async (message, setup) => {
  const aiChannels = setup?.aiChannelIds || [];
  const aiMention = aiChannels.length ? aiChannels.map((id) => `<#${id}>`).join(", ") : "아직 미설정";
  const guide = aiChannels.length
    ? `나츠미 호출은 ${aiMention} 에서만 가능해. 일반 채널에서도 쓰고 싶으면 \`/나츠미서버셋업 일반채팅 켜기\`를 사용해줘 😤`
    : "아직 AI채팅 채널이 설정되지 않았어. `/나츠미서버셋업 자동셋업`으로 먼저 만들어줘 😤";
  return sendTemporaryReply(message, guide);
};

export default {
  name: Events.MessageCreate,
  async execute(message, client) {
    if (message.author.bot) return;

    const content = (message.content || "").trim();
    const lowerContent = content.toLowerCase();
    const isMentioned = message.mentions.has(client.user.id);
    const isCalled = isMentioned || (content.length > 0 && CALLWORDS.some((word) => lowerContent.includes(word.toLowerCase())));

    const natsumiSetup = message.guild ? await loadNatsumiSetup(message.guild.id) : null;
    let dbProcessed = false;

    if (message.guild && natsumiSetup) {
      const featureOnlyChannels = getFeatureOnlyChannelIds(natsumiSetup);
      if (featureOnlyChannels.includes(message.channel.id)) return;
    }

    if (message.guild && isCalled) {
      if (!cacheAdd(localProcessedCache, message.id)) return;
      if (!(await claimProcessed(message))) return;
      dbProcessed = true;

      const adminHandled = await handleNatsumiAdminMode(message, natsumiSetup);
      if (adminHandled) return;

      if (shouldBlockAiCall(message, natsumiSetup, isCalled)) return replyAiBlocked(message, natsumiSetup);
    } else {
      if (!cacheAdd(localProcessedCache, message.id)) return;
    }

    if (message.guild) {
      featuresDB.findOne({ GuildID: message.guild.id }).lean().then((levelSystemCheck) => {
        if (levelSystemCheck?.LevelSystem?.Enabled) addXP(message.guild.id, message.author.id, null, message).catch(() => {});
      }).catch(() => {});
    }

    if (!isMentioned && !isCalled && lowerContent !== "!핑" && lowerContent !== "!ping") return;

    if (isMentioned && content.length === 0) {
      return sendTemporaryReply(message, "츤! 멘션만 덜렁 보내면 어쩌라는 거야? AI채팅 채널에서 제대로 불러줘 😤");
    }

    if (!dbProcessed && await isAlreadyProcessedInDb(message)) return;

    try {
      const bannedWords = await getBannedWords();
      if (bannedWords.length > 0 && bannedWords.some((bw) => lowerContent.includes(bw.word.toLowerCase()))) {
        if (message.guild && message.channel.permissionsFor(client.user).has("ManageMessages")) await message.delete().catch(() => {});
        await message.channel.send(`${message.author} 뭐야?! 그런 천박하고 불쾌한 말 하지 마! 혼날 줄 알아!! 떽!!! 💢`).catch(() => {});
        return;
      }
    } catch {}

    if (lowerContent === "!핑" || lowerContent === "!ping") {
      const os = await import("os");
      const totalMem = (os.totalmem() / (1024 ** 3)).toFixed(1);
      const freeMem = (os.freemem() / (1024 ** 3)).toFixed(1);
      const usedMem = (totalMem - freeMem).toFixed(1);
      const cpuModel = os.cpus()[0]?.model || "알 수 없음";
      const gatewayPing = client.ws.ping;
      const uptime = Math.round(client.readyTimestamp / 1000);
      const embed = new EmbedBuilder()
        .setTitle("🦊 나츠미의 여우령 시스템 점검")
        .setColor("#FF8C00")
        .setThumbnail(client.user.displayAvatarURL())
        .addFields(
          { name: "🍃 실행 환경", value: `**운영체제:** ${os.type()}\n**업타임:** <t:${uptime}:R>`, inline: true },
          { name: "⚙️ 하드웨어", value: `**CPU:** ${cpuModel.split(" ")[0]}\n**메모리:** ${usedMem}G / ${totalMem}G`, inline: true },
          { name: "📡 통신 상태", value: `**게이트웨이:** ${gatewayPing}ms`, inline: true }
        )
        .setTimestamp();
      return message.reply({ embeds: [embed] }).catch(() => {});
    }

    try {
      const learnedData = await getLearnedData();
      const foundLearned = learnedData.find((l) => lowerContent.includes(l.question.toLowerCase()));
      if (foundLearned) return message.reply(foundLearned.answer).catch(() => {});

      await message.channel.sendTyping().catch(() => {});
      const response = await generateDistributedContent({
        contents: [{ role: "user", parts: [{ text: content }] }],
        config: {
          systemInstruction: `넌 '${getEmotion()}' 감정 상태를 가진 츤데레 여고생 캐릭터 '나츠미'야. 가끔은 신비로운 '여우'의 모습을 보이기도 해.
- 성격: 평소엔 툴툴거리며(츤) 솔직하지 못하지만, 가끔은 여우처럼 요염하고 영악하게(데레) 너를 챙겨줘.
- 말투: 반말을 기본으로 하며, 문장 끝에 "~거든?", "~든?", "콘콘!", "흥!", "...별로!", "착각하지 마!" 등을 섞어줘.
- 대답은 반드시 '두 문장' 정도의 분량으로 츤데레와 여우의 특성을 아주 강하게 담아서 대답해줘.`,
          temperature: 0.9,
        },
      });

      const replyText = response.text?.trim();
      if (replyText) await message.reply(replyText).catch(() => {});
    } catch (error) {
      if (error.message === "QUOTA_EXCEEDED") {
        await message.reply("지금은 좀 바쁘거든?! 나중에 다시 말 걸어! 영력이 다 떨어졌어!").catch(() => {});
      } else if (error.message === "SAFETY_BLOCK") {
        await message.reply("변태! 그런 이상한 말에 내가 대답해줄 줄 알아?! 말조심해!").catch(() => {});
      } else {
        console.error(`[GeminiError]`, error);
        await message.reply("...흥, 나중에 얘기해!").catch(() => {});
      }
    }
  },
};
