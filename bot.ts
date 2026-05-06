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

const discordToken = process.env.TOKEN?.replace(/['"]/g, "").trim();
const geminiKey = process.env.MY_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
const clientId = process.env.ID?.replace(/['"]/g, "").trim();
const mongoUri = process.env.MONGOOSE?.replace(/['"]/g, "").trim();
const instanceId = Math.random().toString(36).substring(2, 8);
const logs: string[] = [];

let client: ExtendedClient | null = null;
let commandsJsonCache: any[] = [];
let highLatencySamples = 0;
let lastLatencyReconnectAt = 0;
let reconnectingDiscord = false;
let mongoConnecting = false;

const addLog = (msg: string) => {
  const entry = `[${new Date().toLocaleTimeString()}] ${msg}`;
  logs.push(entry);
  if (logs.length > LOG_LIMIT) logs.shift();
  console.log(entry);
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

  const c = new Client({
    intents,
    partials: [Partials.Channel, Partials.Message, Partials.User],
    rest: { offset: 0, timeout: 60000, retries: 5 },
    makeCache: Options.cacheWithLimits({
      MessageManager: 8,
      ThreadManager: 3,
      PresenceManager: 0,
      ReactionManager: 0,
      GuildMemberManager: 25,
      UserManager: 35,
      VoiceStateManager: 8,
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

const reconnectDiscordGateway = async (reason: string) => {
  if (!discordToken || !client || reconnectingDiscord) return;
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

const start = async () => {
  if (!discordToken) {
    addLog("[Boot] Missing TOKEN.");
    process.exitCode = 1;
    return;
  }

  addLog(geminiKey ? "[Boot] Gemini key found." : "[Boot] Gemini key missing; AI features may fail.");

  process.on("unhandledRejection", (reason) => addLog(`[Fatal] Unhandled rejection: ${reason}`));
  process.on("uncaughtException", (err) => addLog(`[Fatal] Uncaught exception: ${err.message}`));

  await connectMongo();
  mongoose.connection.on("error", (err) => addLog(`[MongoDB] Runtime error: ${err.message}`));
  mongoose.connection.on("disconnected", () => {
    addLog("[MongoDB] Disconnected; reconnecting...");
    setTimeout(connectMongo, 5000);
  });

  client = createClient();
  await loadBotResources(client);
  await client.login(discordToken);

  setInterval(() => {
    if (!client?.isReady()) return;
    client.guilds.cache.forEach((guild: any) => {
      guild.messages?.cache?.clear?.();
      guild.voiceStates?.cache?.clear?.();
    });
    resetRuntimeLag();
    import("./utils/cache.js").then((m) => m.clearCache()).catch(() => {});
    if (global.gc) global.gc();
  }, CACHE_SWEEP_INTERVAL_MS);

  setInterval(() => {
    if (!client?.isReady()) return;
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

start();
