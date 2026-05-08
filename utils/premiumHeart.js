import axios from "axios";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";

const positiveCache = new Map();
const negativeCache = new Map();

const cleanEnv = (value) => value?.replace?.(/['"]/g, "").trim();

export const getPremiumHeartConfig = () => {
  const botId = cleanEnv(process.env.KOREANBOTS_BOT_ID) || cleanEnv(process.env.ID);
  const token = cleanEnv(process.env.KOREANBOTS_TOKEN);
  const pageUrl = cleanEnv(process.env.KOREANBOTS_BOT_PAGE_URL) || (botId ? `https://koreanbots.dev/bots/${botId}` : null);
  const enabled = process.env.PREMIUM_HEART_ENABLED !== "false";

  return {
    botId,
    token,
    pageUrl,
    enabled,
    positiveCacheMs: Number(process.env.PREMIUM_HEART_CACHE_MS || 12 * 60 * 60 * 1000),
    negativeCacheMs: Number(process.env.PREMIUM_HEART_NEGATIVE_CACHE_MS || 30 * 1000),
  };
};

const readCached = (cache, userId) => {
  const entry = cache.get(userId);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    cache.delete(userId);
    return null;
  }
  return entry.value;
};

const writeCached = (cache, userId, value, ttlMs) => {
  cache.set(userId, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
};

export const clearPremiumHeartCache = (userId) => {
  positiveCache.delete(userId);
  negativeCache.delete(userId);
};

export const checkPremiumHeart = async (userId, options = {}) => {
  const config = getPremiumHeartConfig();

  if (!config.enabled) {
    return { ok: true, voted: true, reason: "disabled" };
  }

  if (!config.botId || !config.token) {
    return { ok: false, voted: false, reason: "not_configured", pageUrl: config.pageUrl };
  }

  if (!options.force) {
    const positive = readCached(positiveCache, userId);
    if (positive) return positive;

    const negative = readCached(negativeCache, userId);
    if (negative) return negative;
  }

  try {
    const url = `https://koreanbots.dev/api/v2/bots/${config.botId}/vote`;
    const response = await axios.get(url, {
      timeout: Number(process.env.PREMIUM_HEART_TIMEOUT_MS || 3000),
      headers: {
        Authorization: config.token,
        "User-Agent": "NatsumiBot/5.9.5",
      },
      params: { userID: userId },
    });

    const data = response.data?.data || response.data;
    const voted = Boolean(data?.voted);
    const result = {
      ok: voted,
      voted,
      reason: voted ? "voted" : "not_voted",
      lastVote: data?.lastVote,
      pageUrl: config.pageUrl,
    };

    writeCached(voted ? positiveCache : negativeCache, userId, result, voted ? config.positiveCacheMs : config.negativeCacheMs);
    return result;
  } catch (error) {
    const status = error.response?.status;
    return {
      ok: false,
      voted: false,
      reason: "api_error",
      status,
      pageUrl: config.pageUrl,
    };
  }
};

export const buildPremiumHeartPrompt = (userId, checkResult = {}) => {
  const config = getPremiumHeartConfig();
  const pageUrl = checkResult.pageUrl || config.pageUrl || "https://koreanbots.dev";

  const embed = new EmbedBuilder()
    .setTitle("프리미엄 하트가 필요해")
    .setDescription(
      "NSFW 커맨드는 한디리 하트를 눌러준 유저만 사용할 수 있어.\n" +
      "아래 버튼으로 하트를 누른 다음, `하트 확인`을 눌러줘."
    )
    .setColor("#ff4f8b")
    .setTimestamp();

  if (checkResult.reason === "not_configured") {
    embed.setDescription(
      "프리미엄 하트 확인 설정이 아직 안 됐어.\n" +
      "호스팅 환경변수에 `KOREANBOTS_TOKEN`과 `KOREANBOTS_BOT_ID`를 넣어줘."
    );
  } else if (checkResult.reason === "api_error") {
    embed.addFields({
      name: "확인 상태",
      value: "한디리 API 확인이 잠깐 실패했어. 하트를 눌렀다면 잠시 뒤 다시 확인해줘.",
    });
  }

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel("❤️ 프리미엄 하트 건네기")
      .setStyle(ButtonStyle.Link)
      .setURL(pageUrl),
    new ButtonBuilder()
      .setCustomId(`PremiumHeartCheck_${userId}`)
      .setLabel("✅ 하트 확인하기")
      .setStyle(ButtonStyle.Success)
  );

  return { embeds: [embed], components: [row], ephemeral: true };
};
