import axios from "axios";

const cleanEnv = (value) => value?.replace?.(/['"]/g, "").trim();
const DEFAULT_INTERVAL_MS = 30 * 60 * 1000;

let statsTimer = null;
let lastPostedGuildCount = null;
let posting = false;

export const getKoreanbotsStatsConfig = () => {
  const botId = cleanEnv(process.env.KOREANBOTS_BOT_ID) || cleanEnv(process.env.ID);
  const token = cleanEnv(process.env.KOREANBOTS_TOKEN);
  return {
    botId,
    token,
    enabled: process.env.KOREANBOTS_STATS_ENABLED !== "false",
    intervalMs: Math.max(Number(process.env.KOREANBOTS_STATS_INTERVAL_MS || DEFAULT_INTERVAL_MS), 5 * 60 * 1000),
    timeoutMs: Math.max(Number(process.env.KOREANBOTS_STATS_TIMEOUT_MS || 5000), 1000),
  };
};

export const postKoreanbotsGuildCount = async (client, logger = console.log, options = {}) => {
  const config = getKoreanbotsStatsConfig();
  if (!config.enabled) return { ok: true, skipped: "disabled" };
  if (!config.botId || !config.token) return { ok: false, skipped: "not_configured" };
  if (!client?.isReady?.()) return { ok: false, skipped: "client_not_ready" };
  if (posting) return { ok: true, skipped: "in_progress" };

  let servers = client.guilds.cache.size;
  try {
    const fetched = await client.guilds.fetch();
    servers = fetched?.size || servers;
  } catch (error) {
    logger(`[KoreanBots] Using cached guild count: ${servers} (${error.message})`);
  }

  if (!options.force && lastPostedGuildCount === servers) return { ok: true, skipped: "unchanged", servers };

  posting = true;
  try {
    await axios.post(
      `https://koreanbots.dev/api/v2/bots/${config.botId}/stats`,
      { servers },
      {
        timeout: config.timeoutMs,
        headers: {
          Authorization: config.token,
          "Content-Type": "application/json",
          "User-Agent": "NatsumiBot/6.0",
        },
      }
    );
    lastPostedGuildCount = servers;
    logger(`[KoreanBots] Synced guild count: ${servers}`);
    return { ok: true, servers };
  } catch (error) {
    logger(`[KoreanBots] Guild count sync failed: ${error.response?.status || error.message}`);
    return { ok: false, error };
  } finally {
    posting = false;
  }
};

export const startKoreanbotsGuildCountSync = (client, logger = console.log) => {
  const config = getKoreanbotsStatsConfig();
  if (!config.enabled || statsTimer) return statsTimer;

  postKoreanbotsGuildCount(client, logger, { force: true }).catch(() => {});
  statsTimer = setInterval(() => {
    postKoreanbotsGuildCount(client, logger).catch(() => {});
  }, config.intervalMs);

  client.on("guildCreate", () => postKoreanbotsGuildCount(client, logger, { force: true }).catch(() => {}));
  client.on("guildDelete", () => postKoreanbotsGuildCount(client, logger, { force: true }).catch(() => {}));
  client.on("ready", () => postKoreanbotsGuildCount(client, logger, { force: true }).catch(() => {}));
  return statsTimer;
};
