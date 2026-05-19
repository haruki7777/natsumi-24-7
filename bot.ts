import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import mongoose from "mongoose";
import {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  IntentsBitField,
  Options,
  Partials,
  REST,
  Routes,
} from "discord.js";
import {
  recordRuntimeSample,
  resetRuntimeLag,
} from "./utils/runtimeHealth.js";
import { startPremiumHeartCleanup } from "./utils/premiumHeart.js";
import { startKoreanbotsGuildCountSync } from "./utils/koreanbotsStats.js";

dotenv.config();

interface ExtendedClient extends Client {
  commands: Collection<string, any>;
  buttons: Collection<string, any>;
  instanceId?: string;
}

const LOG_LIMIT = Number(process.env.LOG_LIMIT || 80);
const HEALTH_SAMPLE_INTERVAL_MS = Number(process.env.HEALTH_SAMPLE_INTERVAL_MS || 60000);
const CACHE_SWEEP_INTERVAL_MS = Number(process.env.CACHE_SWEEP_INTERVAL_MS || 300000);
const LATENCY_WATCHDOG_ENABLED = process.env.LATENCY_WATCHDOG_ENABLED !== "false";
const LATENCY_RECONNECT_PING_MS = Number(process.env.LATENCY_RECONNECT_PING_MS || 3000);
const LATENCY_RECONNECT_CONSECUTIVE = Number(process.env.LATENCY_RECONNECT_CONSECUTIVE || 2);
const LATENCY_RECONNECT_COOLDOWN_MS = Number(process.env.LATENCY_RECONNECT_COOLDOWN_MS || 600000);
const FAILOVER_ENABLED = process.env.BOT_FAILOVER_ENABLED === "true";
const FAILOVER_ROLE = (process.env.BOT_FAILOVER_ROLE || "primary").toLowerCase();
const FAILOVER_LOCK_ID = process.env.BOT_FAILOVER_LOCK_ID || "natsumi-discord-session";
const FAILOVER_LEASE_MS = Number(process.env.BOT_FAILOVER_LEASE_MS || 90000);
const FAILOVER_HEARTBEAT_MS = Number(process.env.BOT_FAILOVER_HEARTBEAT_MS || 30000);
const FAILOVER_STANDBY_POLL_MS = Number(process.env.BOT_FAILOVER_STANDBY_POLL_MS || 15000);
const MEMBER_EVENTS_ENABLED = process.env.MEMBER_EVENTS_ENABLED === "true" || process.env.GUILD_MEMBERS_INTENT === "true";

const discordToken = process.env.TOKEN?.replace(/['"]/g, "").trim();
const geminiKey = process.env.MY_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
const clientId = process.env.ID?.replace(/['"]/g, "").trim();
const mongoUri = process.env.MONGOOSE?.replace(/['"]/g, "").trim();
const botEnv = process.env.BOT_ENV || process.env.NODE_ENV || "production";
const botName = process.env.BOT_NAME || "Natsumi";
const shutdownNotifyUserId = process.env.SERVER_DOWN_NOTIFY_USER_ID || process.env.NATSUMI_OWNER_ID || "1293232804745838733";
const instanceId = Math.random().toString(36).substring(2, 8);
const logs: string[] = [];

let client: ExtendedClient | null = null;
let commandsJsonCache: any[] = [];
let highLatencySamples = 0;
let lastLatencyReconnectAt = 0;
let reconnectingDiscord = false;
let mongoConnecting = false;
let discordActive = false;
let discordStarting = false;
let runtimeIntervalsStarted = false;
let failoverLeaseTimer: NodeJS.Timeout | null = null;
let shutdownAlertSent = false;

const addLog = (msg: string) => {
  const entry = `[${new Date().toLocaleTimeString()}] ${msg}`;
  logs.push(entry);
  if (logs.length > LOG_LIMIT) logs.shift();
  console.log(entry);
};

const notifyServerDown = async (reason: string) => {
  if (shutdownAlertSent || !shutdownNotifyUserId || !client?.isReady()) return;
  shutdownAlertSent = true;

  try {
    const user = await client.users.fetch(shutdownNotifyUserId);
    await user.send([
      "⚠️ 나츠미 서버가 곧 내려갈 것 같아.",
      `사유: ${reason}`,
      "5분 자동 감시가 Vortexa 패널을 확인해서 꺼져 있으면 다시 켜볼게.",
    ].join("\n"));
  } catch (error: any) {
    addLog(`[ShutdownNotify] Failed: ${error.message}`);
  }
};

const shutdownWithAlert = async (reason: string, code = 0) => {
  addLog(`[Shutdown] ${reason}`);
  await notifyServerDown(reason);
  process.exit(code);
};

const disabledCommands = new Set(
  (process.env.DISABLED_COMMANDS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
);

const disabledCategories = new Set(
  (process.env.DISABLED_COMMAND_CATEGORIES || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
);

const shouldSkipCommand = (category: string, commandName: string) => {
  return disabledCategories.has(category.toLowerCase()) || disabledCommands.has(commandName);
};

const loadBotResources = async (c: ExtendedClient) => {
  addLog("[Boot] Loading bot resources...");
  c.commands = new Collection();
  c.buttons = new Collection();
  const commandsJson: any[] = [];

  const commandsPath = path.join(process.cwd(), "commands");
  if (fs.existsSync(commandsPath)) {
    for (const category of fs.readdirSync(commandsPath)) {
      const categoryPath = path.join(commandsPath, category);
      if (!fs.statSync(categoryPath).isDirectory()) continue;

      for (const file of fs.readdirSync(categoryPath).filter((name) => name.endsWith(".js") || name.endsWith(".ts"))) {
        try {
          const modulePath = path.resolve(categoryPath, file);
          const moduleExports = await import(new URL(`file://${modulePath}`).href);
          const command = moduleExports.default || moduleExports;
          if (!command?.data || typeof command.execute !== "function") continue;

          const json = typeof command.data.toJSON === "function" ? command.data.toJSON() : command.data;
          const commandName = json.name || command.data.name;
          if (!commandName || shouldSkipCommand(category, commandName)) continue;

          command.category = category;
          c.commands.set(commandName, command);
          if (!commandsJson.some((item) => item.name === json.name && (item.type || 1) === (json.type || 1))) {
            commandsJson.push(json);
          }
        } catch (e: any) {
          addLog(`[Loader] Command ${category}/${file}: ${e.message}`);
        }
      }
    }
  }

  const eventsPath = path.join(process.cwd(), "events");
  if (fs.existsSync(eventsPath)) {
    for (const file of fs.readdirSync(eventsPath).filter((name) => name.endsWith(".js") || name.endsWith(".ts"))) {
      try {
        const modulePath = path.resolve(eventsPath, file);
        const moduleExports = await import(new URL(`file://${modulePath}`).href);
        const event = moduleExports.default || moduleExports;
        if (!event?.name || typeof event.execute !== "function") continue;

        if (event.once) {
          c.once(event.name, (...args: any[]) => event.execute(...args, c));
        } else {
          c.on(event.name, (...args: any[]) => event.execute(...args, c));
        }
      } catch (e: any) {
        addLog(`[Loader] Event ${file}: ${e.message}`);
      }
    }
  }

  const buttonsPath = path.join(process.cwd(), "Buttons");
  if (fs.existsSync(buttonsPath)) {
    for (const file of fs.readdirSync(buttonsPath).filter((name) => name.endsWith(".js") || name.endsWith(".ts"))) {
      try {
        const modulePath = path.resolve(buttonsPath, file);
        const moduleExports = await import(new URL(`file://${modulePath}`).href);
        const button = moduleExports.default || moduleExports;
        if (button?.name) c.buttons.set(button.name, button);
      } catch (e: any) {
        addLog(`[Loader] Button ${file}: ${e.message}`);
      }
    }
  }

  commandsJsonCache = commandsJson;
  addLog(`[Boot] Loaded ${c.commands.size} commands and ${c.buttons.size} buttons.`);
};

const registerSlashCommands = async () => {
  if (!discordToken || !clientId || commandsJsonCache.length === 0) return;

  try {
    const rest = new REST({ version: "10" }).setToken(discordToken);
    await rest.put(Routes.applicationCommands(clientId), { body: commandsJsonCache });
    addLog(`[Discord] Synced ${commandsJsonCache.length} application commands.`);
  } catch (e: any) {
    addLog(`[Discord] Command sync failed: ${e.message}`);
  }
};

const createClient = () => {
  const intents = new IntentsBitField();
  intents.add(
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  );
  if (MEMBER_EVENTS_ENABLED) intents.add(GatewayIntentBits.GuildMembers);

  const c = new Client({
    intents,
    partials: [Partials.Channel, Partials.Message, Partials.User],
    rest: { offset: 0, timeout: 60000, retries: 5 },
    makeCache: Options.cacheWithLimits({
      MessageManager: 8,
      ThreadManager: 3,
      PresenceManager: 0,
      ReactionManager: 0,
      GuildMemberManager: 100,
      UserManager: 100,
      VoiceStateManager: 100,
      BaseGuildEmojiManager: 0,
      GuildBanManager: 0,
      GuildInviteManager: 0,
      GuildStickerManager: 0,
      GuildScheduledEventManager: 0,
    }),
    sweepers: {
      ...Options.DefaultSweeperSettings,
      messages: { interval: 300, lifetime: 180 },
      users: {
        interval: 600,
        filter: () => (user: any) => user.id !== client?.user?.id,
      },
    },
  }) as ExtendedClient;

  c.commands = new Collection();
  c.buttons = new Collection();
  c.instanceId = instanceId;

  c.on(Events.ClientReady, async (readyClient) => {
    addLog(`[Discord] Ready as ${readyClient.user.tag} (${readyClient.guilds.cache.size} guilds).`);
    await registerSlashCommands();
    startKoreanbotsGuildCountSync(readyClient, addLog);
  });

  c.on(Events.Error, (e) => addLog(`[Discord] Error: ${e.message}`));
  c.on("shardDisconnect", (event, id) => addLog(`[Shard ${id}] Disconnected: ${event.reason || "unknown"}`));
  c.on("shardReconnecting", (id) => addLog(`[Shard ${id}] Reconnecting...`));
  c.on("shardResume", (id, replayedEvents) => addLog(`[Shard ${id}] Resumed (${replayedEvents} events).`));

  return c;
};

const connectMongo = async () => {
  if (!mongoUri || mongoConnecting || mongoose.connection.readyState === 1) return;
  mongoConnecting = true;
  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4,
      maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE || 5),
    });
    addLog("[MongoDB] Connected.");
  } catch (e: any) {
    addLog(`[MongoDB] Connection failed: ${e.message}`);
    setTimeout(connectMongo, 5000);
  } finally {
    mongoConnecting = false;
  }
};

const getFailoverLocks = () => mongoose.connection.collection("runtime_locks");

const claimFailoverLease = async () => {
  if (mongoose.connection.readyState !== 1) return false;

  const now = new Date();
  const expiresAt = new Date(now.getTime() + FAILOVER_LEASE_MS);
  const owner = `${FAILOVER_ROLE}:${instanceId}`;
  const locks = getFailoverLocks();

  const current = await locks.findOne({ _id: FAILOVER_LOCK_ID });
  const expired = !current?.expiresAt || new Date(current.expiresAt).getTime() <= now.getTime();
  const ownedByMe = current?.owner === owner;

  if (!current) {
    try {
      await locks.insertOne({
        _id: FAILOVER_LOCK_ID,
        owner,
        role: FAILOVER_ROLE,
        instanceId,
        botName,
        updatedAt: now,
        expiresAt,
      });
      return true;
    } catch {
      return false;
    }
  }

  if (!expired && !ownedByMe) return false;

  const result = await locks.updateOne(
    {
      _id: FAILOVER_LOCK_ID,
      owner: current.owner,
      expiresAt: current.expiresAt,
    },
    {
      $set: {
        owner,
        role: FAILOVER_ROLE,
        instanceId,
        botName,
        updatedAt: now,
        expiresAt,
      },
    }
  );

  return result.modifiedCount === 1 || result.matchedCount === 1;
};

const renewFailoverLease = async () => {
  if (!FAILOVER_ENABLED || mongoose.connection.readyState !== 1) return false;

  const now = new Date();
  const owner = `${FAILOVER_ROLE}:${instanceId}`;
  const result = await getFailoverLocks().updateOne(
    { _id: FAILOVER_LOCK_ID, owner },
    {
      $set: {
        updatedAt: now,
        expiresAt: new Date(now.getTime() + FAILOVER_LEASE_MS),
      },
    }
  );

  if (result.matchedCount !== 1) {
    addLog("[Failover] Lost active lease; disconnecting Discord to avoid token conflict.");
    if (client) client.destroy();
    discordActive = false;
    setTimeout(() => {
      runFailoverController().catch((e: any) => addLog(`[Failover] Restart failed: ${e.message}`));
    }, FAILOVER_STANDBY_POLL_MS);
    return false;
  }

  return true;
};

const startFailoverLeaseRenewal = () => {
  if (failoverLeaseTimer) clearInterval(failoverLeaseTimer);
  failoverLeaseTimer = setInterval(() => {
    renewFailoverLease().catch((e: any) => addLog(`[Failover] Lease renewal failed: ${e.message}`));
  }, FAILOVER_HEARTBEAT_MS);
};

const reconnectDiscordGateway = async (reason: string) => {
  if (!discordToken || !client || reconnectingDiscord || !discordActive) return;
  const now = Date.now();
  if (now - lastLatencyReconnectAt < LATENCY_RECONNECT_COOLDOWN_MS) return;

  reconnectingDiscord = true;
  lastLatencyReconnectAt = now;
  addLog(`[Watchdog] Reconnecting Discord gateway: ${reason}`);

  try {
    client.destroy();
    await new Promise((resolve) => setTimeout(resolve, 5000));
    await client.login(discordToken);
    highLatencySamples = 0;
  } catch (e: any) {
    addLog(`[Watchdog] Reconnect failed: ${e.message}`);
  } finally {
    reconnectingDiscord = false;
  }
};

const startDiscord = async () => {
  if (!discordToken || discordStarting || discordActive) return;
  discordStarting = true;
  try {
    addLog(`[Discord] Activating ${FAILOVER_ENABLED ? FAILOVER_ROLE : "single"} instance.`);
    if (client) {
      client.destroy();
      client = null;
    }
  client = createClient();
  await loadBotResources(client);
  await client.login(discordToken);
    discordActive = true;
    if (FAILOVER_ENABLED) startFailoverLeaseRenewal();
  } finally {
    discordStarting = false;
  }
};

const startRuntimeIntervals = () => {
  if (runtimeIntervalsStarted) return;
  runtimeIntervalsStarted = true;
  startPremiumHeartCleanup(addLog);

  setInterval(() => {
    if (!discordActive || !client?.isReady()) return;
    client.guilds.cache.forEach((guild: any) => {
      guild.messages?.cache?.clear?.();
    });
    resetRuntimeLag();
    import("./utils/cache.js").then((m) => m.clearCache()).catch(() => {});
    if (global.gc) global.gc();
  }, CACHE_SWEEP_INTERVAL_MS);

  setInterval(() => {
    if (!discordActive || !client?.isReady()) return;
    const sample = recordRuntimeSample(client);
    if (sample.gatewayPing >= 500 || sample.eventLoopLagMs >= 100 || sample.eventLoopMaxMs >= 1000) {
      addLog(`[Health] WS=${sample.gatewayPing}ms lag=${sample.eventLoopLagMs}/${sample.eventLoopMaxMs}ms memory=${sample.memoryRssMb}MB`);
    }

    if (!LATENCY_WATCHDOG_ENABLED) return;
    if (sample.gatewayPing >= LATENCY_RECONNECT_PING_MS && sample.eventLoopLagMs < 100) {
      highLatencySamples++;
    } else {
      highLatencySamples = 0;
    }

    if (highLatencySamples >= LATENCY_RECONNECT_CONSECUTIVE) {
      reconnectDiscordGateway(`WS ping ${sample.gatewayPing}ms for ${highLatencySamples} samples`).catch((e) => {
        addLog(`[Watchdog] Reconnect scheduling failed: ${e.message}`);
      });
    }
  }, HEALTH_SAMPLE_INTERVAL_MS);
};

const runFailoverController = async () => {
  addLog(`[Failover] Enabled role=${FAILOVER_ROLE} lock=${FAILOVER_LOCK_ID} lease=${FAILOVER_LEASE_MS}ms.`);

  while (true) {
    try {
      const acquired = await claimFailoverLease();
      if (acquired) {
        await startDiscord();
        return;
      }

      const lock = await getFailoverLocks().findOne({ _id: FAILOVER_LOCK_ID });
      const expiresIn = lock?.expiresAt ? Math.max(0, new Date(lock.expiresAt).getTime() - Date.now()) : 0;
      addLog(`[Failover] Standby; active=${lock?.role || "unknown"} expiresIn=${Math.round(expiresIn / 1000)}s.`);
    } catch (e: any) {
      addLog(`[Failover] Standby check failed: ${e.message}`);
    }

    await new Promise((resolve) => setTimeout(resolve, FAILOVER_STANDBY_POLL_MS));
  }
};

const start = async () => {
  if (!discordToken) {
    addLog("[Boot] Missing TOKEN.");
    process.exitCode = 1;
    return;
  }

  addLog(`[Boot] Starting ${botName} in ${botEnv} mode.`);
  addLog(geminiKey ? "[Boot] Gemini key found." : "[Boot] Gemini key missing; AI features may fail.");

  process.on("SIGTERM", () => {
    shutdownWithAlert("SIGTERM: 호스팅 서버가 프로세스 종료 신호를 보냄", 0).catch(() => process.exit(0));
  });
  process.on("SIGINT", () => {
    shutdownWithAlert("SIGINT: 서버가 수동 종료됨", 0).catch(() => process.exit(0));
  });
  process.on("unhandledRejection", (reason) => {
    addLog(`[Fatal] Unhandled rejection: ${reason}`);
    notifyServerDown(`Unhandled rejection: ${String(reason).slice(0, 300)}`).catch(() => {});
  });
  process.on("uncaughtException", (err) => {
    addLog(`[Fatal] Uncaught exception: ${err.message}`);
    shutdownWithAlert(`Uncaught exception: ${err.message}`, 1).catch(() => process.exit(1));
  });

  await connectMongo();
  mongoose.connection.on("error", (err) => addLog(`[MongoDB] Runtime error: ${err.message}`));
  mongoose.connection.on("disconnected", () => {
    addLog("[MongoDB] Disconnected; reconnecting...");
    setTimeout(connectMongo, 5000);
  });

  startRuntimeIntervals();

  if (FAILOVER_ENABLED && mongoose.connection.readyState === 1) {
    await runFailoverController();
    return;
  }

  await startDiscord();
};

start();
