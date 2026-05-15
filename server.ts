import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import fetch from "node-fetch";
import mongoose from "mongoose";
import {
  getRuntimeHealth,
  recordRuntimeSample,
  resetRuntimeLag,
} from "./utils/runtimeHealth.js";
import { 
  Client, 
  GatewayIntentBits, 
  Events, 
  Collection, 
  REST, 
  Routes, 
  Partials,
  Options,
  IntentsBitField
} from "discord.js";

dotenv.config();

// Custom Client Type to support collections
interface ExtendedClient extends Client {
  commands: Collection<string, any>;
  buttons: Collection<string, any>;
}

async function startServer() {
  console.log(">>> [BOOT] starting startServer() function...");
  const app = express();
  const PORT = Number(process.env.PORT || process.env.WEB_PORT || 3000);

  const instanceId = Math.random().toString(36).substring(2, 8);
  let botStatus = "Offline";
  let botPing = -1;
  let botUptime = 0;
  let lastError = "";
  let messageCount = 0;
  const logs: string[] = [];
  let isCooling = false;
  let lastCoolingAt = 0;

  const discordToken = process.env.TOKEN?.replace(/['"]/g, "").trim();
  const geminiKey = process.env.MY_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  const clientId = process.env.ID?.replace(/['"]/g, "").trim();
  const mongoUri = process.env.MONGOOSE?.replace(/['"]/g, "").trim();

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const entry = `[${timestamp}] ${msg}`;
    logs.push(entry);
    if (logs.length > 100) logs.shift(); 
    console.log(entry);
  };

  const isPlaceholder = (val?: string) => {
    if (!val) return false;
    return val.includes("토큰") || val.includes("클라이언트 ID") || val.includes("URI") || val.includes("MY_APP_URL");
  };

  // --- Discord Bot Initialization ---
  let currentIntents = new IntentsBitField();
  currentIntents.add(
    GatewayIntentBits.Guilds,           // 필수
    GatewayIntentBits.GuildMessages,    // 필수
    GatewayIntentBits.MessageContent    // "통과된" 유일한 Privileged Intent
  );
  
  // VoiceStates는 기능 유지를 위해 시도하되, 큰 부담은 없음
  try {
    currentIntents.add(GatewayIntentBits.GuildVoiceStates);
  } catch (e) {}

  let client: ExtendedClient | null = null;

  // Resource Loading Cache to prevent duplicate logs/registration
  let resourcesLoaded = false;
  let commandsJsonCache: any[] = [];

  const loadBotResources = async (c: ExtendedClient) => {
    if (resourcesLoaded && c.commands.size > 0) return;
    
    addLog("--- Resource Loading Started ---");
    c.commands = new Collection();
    c.buttons = new Collection();
    const commandsJson: any[] = [];

    // --- Dynamic Loader: Commands ---
    const commandsPath = path.join(process.cwd(), "commands");
    if (fs.existsSync(commandsPath)) {
      const categories = fs.readdirSync(commandsPath);
      for (const category of categories) {
        const categoryPath = path.join(commandsPath, category);
        if (fs.statSync(categoryPath).isDirectory()) {
          const commandFiles = fs.readdirSync(categoryPath).filter(file => file.endsWith(".js") || file.endsWith(".ts"));
          for (const file of commandFiles) {
            try {
              const modulePath = path.resolve(categoryPath, file);
              const moduleUrl = new URL(`file://${modulePath}`);
              const moduleExports = await import(moduleUrl.href + "?v=" + Date.now()); 
              const command = moduleExports.default || moduleExports;

              if (command && command.data && typeof command.execute === 'function') {
                const commandName = command.data.name;
                if (!commandName) {
                    addLog(`[Warning] Command in ${file} missing name.`);
                    continue;
                }
                
                const json = typeof command.data.toJSON === 'function' ? command.data.toJSON() : command.data;
                
                if (!json.name) {
                    addLog(`[Warning] Command in ${file} missing name.`);
                    continue;
                }

                const isSlash = !json.type || json.type === 1;
                if (isSlash && !json.description) {
                    addLog(`[Warning] Slash Command ${json.name} in ${file} missing description.`);
                }
                
                addLog(`[Loader] Loaded ${isSlash ? 'Slash' : 'Context'} Command: ${json.name} (Type: ${json.type || 1}) from ${file}`);

                command.category = category;

                if (commandsJson.some(c => c.name === json.name && (c.type || 1) === (json.type || 1))) {
                    addLog(`[Warning] Duplicate detected: ${json.name}. Skipping JSON entry.`);
                } else {
                    commandsJson.push(json);
                }
                
                c.commands.set(commandName, command);
              }
            } catch (e: any) {
              addLog(`[Error] Command ${file}: ${e.message}`);
            }
          }
        }
      }
    }
    commandsJsonCache = commandsJson;

    // --- Dynamic Loader: Events ---
    const eventsPath = path.join(process.cwd(), "events");
    if (fs.existsSync(eventsPath)) {
      const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith(".js") || file.endsWith(".ts"));
      for (const file of eventFiles) {
        try {
          const modulePath = path.resolve(eventsPath, file);
          const moduleUrl = new URL(`file://${modulePath}`);
          const moduleExports = await import(moduleUrl.href + "?v=" + Date.now());
          const event = moduleExports.default || moduleExports;

          if (event && event.name && typeof event.execute === 'function') {
            if (event.once) {
              c.once(event.name, (...args: any[]) => event.execute(...args, c));
            } else {
              c.on(event.name, (...args: any[]) => event.execute(...args, c));
            }
          }
        } catch (e: any) {
          addLog(`[Error] Event ${file}: ${e.message}`);
        }
      }
    }

    // --- Dynamic Loader: Buttons ---
    const buttonsPath = path.join(process.cwd(), "Buttons");
    if (fs.existsSync(buttonsPath)) {
      const buttonFiles = fs.readdirSync(buttonsPath).filter(file => file.endsWith(".js") || file.endsWith(".ts"));
      for (const file of buttonFiles) {
        try {
          const modulePath = path.resolve(buttonsPath, file);
          const moduleUrl = new URL(`file://${modulePath}`);
          const moduleExports = await import(moduleUrl.href + "?v=" + Date.now());
          const button = moduleExports.default || moduleExports;
          if (button && button.name) {
            c.buttons.set(button.name, button);
          }
        } catch (e: any) {
          addLog(`[Error] Button ${file}: ${e.message}`);
        }
      }
    }
    
    addLog(`Resources loaded: ${c.commands.size} Cmds, ${c.buttons.size} Buttons.`);
    resourcesLoaded = true;
  };

  const registerSlashCommands = async () => {
    if (discordToken && clientId && commandsJsonCache.length > 0) {
      const rest = new REST({ version: "10" }).setToken(discordToken);
      try {
        const commandNames = commandsJsonCache.map(c => `${c.name}(${c.type || 1})`).join(', ');
        addLog(`[Discord] Registering ${commandsJsonCache.length} commands: ${commandNames}`);
        await rest.put(Routes.applicationCommands(clientId), { body: commandsJsonCache });
        addLog(`[Discord] Successfully registered commands.`);
      } catch (error: any) {
        let errMsg = error.message;
        const details = error.errors || (error.rawError && error.rawError.errors);
        if (details) {
            errMsg += " | Details: " + JSON.stringify(details, null, 1);
        }
        addLog(`[REST Error] ${errMsg}`);
      }
    }
  };

  const setupClientHandlers = (c: ExtendedClient) => {
    c.on(Events.ClientReady, async (readyClient) => {
      botStatus = "Online";
      botPing = readyClient.ws.ping;
      botUptime = Date.now();
      addLog(`[System] Natsumi v6.3.1 Ultimate | Ready as ${readyClient.user.tag}`);
      addLog(`[Config] 100+ Guilds Optimized | Fishing Content Expansion (120+ Items)`);

      await registerSlashCommands();

      try {
        startRuntimeIntervals();
      } catch (e: any) {
        addLog(`[Runtime] Failed to start intervals: ${e.message}`);
      }
    });

    c.on(Events.InteractionCreate, async (interaction) => {
      if (interaction.isChatInputCommand()) {
        const command = c.commands.get(interaction.commandName);
        if (!command) return;
        try {
          await command.execute(interaction, c);
        } catch (error: any) {
          addLog(`[Cmd Error] ${interaction.commandName}: ${error.message}`);
          const payload = { content: "명령어 실행 중 오류가 발생했어!", ephemeral: true };
          if (interaction.deferred || interaction.replied) await interaction.editReply(payload).catch(() => {});
          else await interaction.reply(payload).catch(() => {});
        }
      }

      if (interaction.isButton()) {
        const customId = interaction.customId;
        const button = c.buttons.get(customId) || c.buttons.find((b: any, key: string) => customId.startsWith(key));
        if (!button) return;
        try {
          await button.execute(interaction, c);
        } catch (error: any) {
          addLog(`[Btn Error] ${customId}: ${error.message}`);
        }
      }
    });

    c.on(Events.MessageCreate, async (message) => {
      if (message.author.bot) return;
      messageCount++;
    });
  };

  const connectMongo = async () => {
    if (!mongoUri || isPlaceholder(mongoUri)) {
      addLog("[MongoDB] MONGOOSE is missing or placeholder.");
      return false;
    }
    try {
      await mongoose.connect(mongoUri, {
        maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE || 10),
      });
      addLog("[MongoDB] Connected.");
      return true;
    } catch (e: any) {
      addLog(`[MongoDB] Connection failed: ${e.message}`);
      return false;
    }
  };

  const startRuntimeIntervals = () => {
    setInterval(() => {
      if (client && client.isReady && client.isReady()) {
        const sample = recordRuntimeSample(client);
        if (sample.gatewayPing >= 500 || sample.eventLoopLagMs >= 100 || sample.eventLoopMaxMs >= 1000) {
          addLog(`[Health] WS=${sample.gatewayPing}ms lag=${sample.eventLoopLagMs}/${sample.eventLoopMaxMs}ms memory=${sample.memoryRssMb}MB`);
        }
      }
    }, 60000);
  };

  const startDiscord = async () => {
    if (!discordToken || !clientId || isPlaceholder(discordToken) || isPlaceholder(clientId)) {
      addLog("[Discord] TOKEN or ID missing/placeholder. Bot not started.");
      return;
    }

    client = new Client({
      intents: currentIntents,
      partials: [Partials.Channel, Partials.Message, Partials.User],
      makeCache: Options.cacheWithLimits({
        MessageManager: 20,
        PresenceManager: 0,
        GuildMemberManager: 20,
      }),
    }) as ExtendedClient;

    await loadBotResources(client);
    setupClientHandlers(client);

    try {
      await client.login(discordToken);
    } catch (e: any) {
      addLog(`[Discord] Login failed: ${e.message}`);
    }
  };

  // --- API Routes ---
  app.get("/ping", (req, res) => res.send("pong"));
  app.get("/api/status", (req, res) => {
    const health = getRuntimeHealth();
    res.json({
      status: botStatus,
      ping: client?.ws.ping ?? botPing,
      uptime: botUptime ? Math.floor((Date.now() - botUptime) / 1000) : 0,
      guilds: client?.guilds.cache.size || 0,
      messages: messageCount,
      lastError,
      logs,
      runtime: health,
      memoryMb: health.memoryRssMb,
      isCooling: isCooling || (Date.now() - lastCoolingAt < 30000), // 30s cooling window after event
      engine: "v6.4.0 Damping Core",
    });
  });

  app.post("/api/flush", (req, res) => {
    try {
      import("./utils/cache.js").then(m => m.clearCache());
      if (global.gc) global.gc();
      resetRuntimeLag();
      addLog("[System] Manual cache flush and GC triggered.");
      res.json({ success: true, message: "Cache flushed" });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  setInterval(() => {
    if (client && client.isReady && client.isReady()) {
      const sample = recordRuntimeSample(client);
      if (sample.gatewayPing >= 500 || sample.eventLoopLagMs >= 100 || sample.eventLoopMaxMs >= 1000) {
        addLog(`[Health] WS=${sample.gatewayPing}ms lag=${sample.eventLoopLagMs}/${sample.eventLoopMaxMs}ms memory=${sample.memoryRssMb}MB`);
      }
    }
  }, 60000);

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  console.log(`[Server] Starting instance: ${instanceId}`);

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`[${instanceId}] Server running on http://localhost:${PORT}`);
    
    // --- Self-Ping Mechanism (Keep Alive) ---
    setInterval(async () => {
      try {
        const response = await fetch(`http://localhost:${PORT}/ping`);
        const text = await response.text();
        addLog(`Self-ping successful: ${text}`);
      } catch (e: any) {
        addLog(`Self-ping failed: ${e.message}`);
      }
    }, 300000); 
  });

  server.on("error", (e: any) => {
    if (e.code === "EADDRINUSE") {
      console.error(`[${instanceId}] Port ${PORT} is already in use. EXITING to prevent duplicates.`);
      process.exit(1);
    }
  });
}

startServer();