import axios from "axios";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";
import PremiumHeartPass from "../models/PremiumHeartPass.js";

const positiveCache = new Map();
const negativeCache = new Map();
const cleanEnv = (value) => value?.replace?.(/['"]/g, "").trim();
const PASS_MS = Number(process.env.PREMIUM_HEART_PASS_MS || 12 * 60 * 60 * 1000);

export const getPremiumHeartConfig = () => {
  const botId = cleanEnv(process.env.KOREANBOTS_BOT_ID) || cleanEnv(process.env.ID);
  const token = cleanEnv(process.env.KOREANBOTS_TOKEN);
  const pageUrl = cleanEnv(process.env.KOREANBOTS_BOT_PAGE_URL) || (botId ? `https://koreanbots.dev/bots/${botId}` : null);
  return {
    botId,
    token,
    pageUrl,
    enabled: process.env.PREMIUM_HEART_ENABLED !== "false",
    positiveCacheMs: PASS_MS,
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
  cache.set(userId, { value, expiresAt: Date.now() + ttlMs });
};

export const clearPremiumHeartCache = (userId) => {
  positiveCache.delete(userId);
  negativeCache.delete(userId);
};

const readStoredPass = async (userId) => {
  const pass = await PremiumHeartPass.findOne({ userId }).lean();
  if (!pass) return null;
  const expiresAt = new Date(pass.expiresAt);
  if (expiresAt.getTime() <= Date.now()) {
    await PremiumHeartPass.deleteOne({ userId });
    return null;
  }
  return { ok: true, voted: true, reason: "stored_pass", expiresAt };
};

const saveStoredPass = async (userId) => {
  const expiresAt = new Date(Date.now() + PASS_MS);
  await PremiumHeartPass.findOneAndUpdate(
    { userId },
    { userId, lastVerifiedAt: new Date(), expiresAt, source: "koreanbots" },
    { upsert: true, new: true }
  );
  return expiresAt;
};

export const checkPremiumHeart = async (userId, options = {}) => {
  const config = getPremiumHeartConfig();
  if (!config.enabled) return { ok: true, voted: true, reason: "disabled" };
  if (!config.botId || !config.token) return { ok: false, voted: false, reason: "not_configured", pageUrl: config.pageUrl };

  if (!options.force) {
    const stored = await readStoredPass(userId);
    if (stored) return stored;
    const positive = readCached(positiveCache, userId);
    if (positive) return positive;
    const negative = readCached(negativeCache, userId);
    if (negative) return negative;
  }

  try {
    const response = await axios.get(`https://koreanbots.dev/api/v2/bots/${config.botId}/vote`, {
      timeout: Number(process.env.PREMIUM_HEART_TIMEOUT_MS || 3000),
      headers: { Authorization: config.token, "User-Agent": "NatsumiBot/5.9.5" },
      params: { userID: userId },
    });

    const data = response.data?.data || response.data;
    const voted = Boolean(data?.voted);
    const expiresAt = voted ? await saveStoredPass(userId) : null;
    const result = { ok: voted, voted, reason: voted ? "voted" : "not_voted", lastVote: data?.lastVote, expiresAt, pageUrl: config.pageUrl };
    writeCached(voted ? positiveCache : negativeCache, userId, result, voted ? config.positiveCacheMs : config.negativeCacheMs);
    return result;
  } catch (error) {
    return { ok: false, voted: false, reason: "api_error", status: error.response?.status, pageUrl: config.pageUrl };
  }
};

export const buildPremiumHeartPrompt = (userId, checkResult = {}) => {
  const config = getPremiumHeartConfig();
  const pageUrl = checkResult.pageUrl || config.pageUrl || "https://koreanbots.dev";
  const embed = new EmbedBuilder()
    .setTitle("프리미엄 하트가 필요해")
    .setDescription("한디리 하트 인증은 유저별로 12시간 동안 유지돼. 시간이 지나면 다시 잠겨 😼")
    .setColor("#ff4f8b")
    .setTimestamp();

  if (checkResult.reason === "not_configured") {
    embed.setDescription("프리미엄 하트 확인 설정이 아직 안 됐어. 환경변수에 `KOREANBOTS_TOKEN`과 `KOREANBOTS_BOT_ID`를 넣어줘.");
  } else if (checkResult.reason === "api_error") {
    embed.addFields({ name: "확인 상태", value: "한디리 API 확인이 잠깐 실패했어. 잠시 뒤 다시 확인해줘." });
  } else if (checkResult.expiresAt) {
    embed.addFields({ name: "인증 만료", value: `<t:${Math.floor(new Date(checkResult.expiresAt).getTime() / 1000)}:R>` });
  }

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setLabel("❤️ 프리미엄 하트 건네기").setStyle(ButtonStyle.Link).setURL(pageUrl),
    new ButtonBuilder().setCustomId(`PremiumHeartCheck_${userId}`).setLabel("✅ 하트 확인하기").setStyle(ButtonStyle.Success)
  );

  return { embeds: [embed], components: [row], ephemeral: true };
};
