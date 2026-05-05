import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import fetch from "node-fetch";
import mongoose from "mongoose";
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
  const PORT = 3000;

  const instanceId = Math.random().toString(36).substring(2, 8);
  let botStatus = "Offline";
  let botPing = -1;
  let botUptime = 0;
  let lastError = "";
  let messageCount = 0;
  const logs: string[] = [];

  const discordToken = process.env.TOKEN?.replace(/['"]/g, "").trim();
  const geminiKey = process.env.MY_GEMINI_API_KEY;
  const clientId = process.env.ID?.replace(/['"]/g, "").trim();
  const mongoUri = process.env.MONGOOSE?.replace(/['"]/g, "").trim();

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const entry = `[${timestamp}] ${msg}`;
    logs.push(entry);
    if (logs.length > 100) logs.shift(); 
    console.log(entry);
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
      
      if (!currentIntents.has(GatewayIntentBits.MessageContent)) {
          addLog("!!! CRITICAL: Message Content Intent missing !!!");
      }
      
      try {
        await registerSlashCommands();
        addLog("[Discord] Slash Command Sync Complete.");
      } catch (err: any) {
        addLog(`[Discord] Sync Failed: ${err.message}`);
      }
    });

    c.on(Events.Error, (e) => {
      botStatus = "Error";
      lastError = e.message;
      addLog(`[DJS Error] ${e.message}`);
    });

    c.on("debug", (info) => {
      if (info.toLowerCase().includes("heartbeat") || info.toLowerCase().includes("latency")) return;
      if (info.toLowerCase().includes("session") || info.toLowerCase().includes("identif")) {
          addLog(`[DJS Debug] ${info}`);
      }
    });

    c.on("shardDisconnect", (event, id) => {
      addLog(`[Shard ${id}] Disconnected: ${event.reason || "Unknown reason"}`);
    });
  };

  const createClientInstance = (intents: IntentsBitField) => {
    const newClient = new Client({
      intents: intents,
      partials: [Partials.Channel, Partials.Message, Partials.User],
      rest: { offset: 0, timeout: 60000, retries: 10 },
      // 100+ Servers Aggressive Cache Strategy
      makeCache: Options.cacheWithLimits({
        MessageManager: 15,          // 최소한의 메시지만 보관
        ThreadManager: 5,
        PresenceManager: 0,          // 인텐트 미승인 대비 0 설정
        ReactionManager: 0,
        GuildMemberManager: 50,      // 메모리 절약을 위해 대폭 축소
        UserManager: 50,
        VoiceStateManager: 10,
        BaseGuildEmojiManager: 0,    // 이모지 캐시 완전 비활성화
        GuildBanManager: 0,
        GuildInviteManager: 0,
        GuildStickerManager: 0,
        GuildScheduledEventManager: 0,
      }),
      sweepers: {
        ...Options.DefaultSweeperSettings,
        messages: {
            interval: 300,           // 5분마다 메시지 완전 삭제
            lifetime: 300,
        },
        users: {
            interval: 600,
            filter: () => (user: any) => user.id !== client?.user?.id,
        }
      }
    }) as ExtendedClient;
    
    newClient.instanceId = instanceId;
    setupClientHandlers(newClient);
    return newClient;
  };

  const performLogin = async (token: string) => {
    try {
      addLog("Ultimate Core Engine 가동 중...");
      client = createClientInstance(currentIntents);
      await loadBotResources(client);
      
      addLog("디스코드 게이트웨이 연결 시도...");
      
      // Set a temporary timeout for login logging
      const loginTimeout = setTimeout(() => {
        if (botStatus === "Offline") {
          addLog("WARNING: Login is taking longer than expected. Check Discord Status or Intents.");
        }
      }, 15000);

      await client.login(token);
      clearTimeout(loginTimeout);
    } catch (e: any) {
      botStatus = "Login Failed";
      lastError = e.message;
      addLog(`[로그인 실패] ${e.message}`);
      
      if (e.message.includes("intents") || e.code === "DisallowedIntents") {
        addLog("CRITICAL: 인텐트 설정이 올바르지 않습니다!");
        addLog("디스코드 개발자 포털에서 'MESSAGE CONTENT', 'SERVER MEMBERS', 'PRESENCE' 인텐트가 모두 켜져있는지 확인해주세요.");
      } else {
        addLog("치명적 오류: 토큰이 올바른지, 혹은 네트워크 상태를 확인해주세요.");
      }
    }
  };

  if (geminiKey) {
      addLog(`MY_GEMINI_API_KEY found`);
  } else {
      addLog("WARNING: MY_GEMINI_API_KEY is missing!");
  }

  // --- Process Error Handling (To prevent crashing) ---
  process.on("unhandledRejection", (reason, promise) => {
    console.error(`[FATAL] Unhandled Rejection at: ${promise} reason: ${reason}`);
    addLog(`Unhandled Rejection: ${reason}`);
  });

  process.on("uncaughtException", (err) => {
    console.error(`[FATAL] Uncaught Exception: ${err.message}`);
    addLog(`Uncaught Exception: ${err.message}`);
  });

  // Balanced GC and System Sweep (Every 5 minutes)
  setInterval(() => {
    try {
      if (client && client.isReady && client.isReady()) {
        client.guilds.cache.forEach((guild: any) => {
           guild.messages.cache.clear();
           guild.voiceStates.cache.clear();
        });
        import("./utils/cache.js").then(m => m.clearCache()).catch(() => {});
      }
      if (global.gc) global.gc();
    } catch (e: any) {}
  }, 300000);

  // --- MongoDB Connection ---
  if (mongoUri) {
    const connectDB = async () => {
      try {
        await mongoose.connect(mongoUri, {
          serverSelectionTimeoutMS: 10000,
          socketTimeoutMS: 45000,
          family: 4,
        });
        addLog("MongoDB Connected successfully.");
      } catch (err: any) {
        addLog(`MongoDB Initial Connection Failed: ${err.message}`);
        setTimeout(connectDB, 5000); // Retry after 5s
      }
    };

    mongoose.connection.on("error", (err) => {
      addLog(`MongoDB Runtime Error: ${err.message}`);
    });

    mongoose.connection.on("disconnected", () => {
      addLog("MongoDB Disconnected. Attempting to reconnect...");
      connectDB();
    });

    connectDB();
  }

  if (discordToken) {
    performLogin(discordToken);
  } else {
    botStatus = "No Token";
    addLog("Missing TOKEN environment variable.");
  }

  // --- API Routes ---
  app.get("/ping", (req, res) => {
    console.log(`[Ping] Received ping from ${req.headers['x-forwarded-for'] || req.ip}`);
    res.status(200).send("Pong! I am awake.");
  });

  app.get("/api/status", (req, res) => {
    res.json({
      status: botStatus,
      ping: client?.ws?.ping ?? -1,
      uptime: botUptime ? Math.floor((Date.now() - botUptime) / 1000) : 0,
      messageCount,
      lastError,
      logs: logs.slice().reverse(),
      tag: client?.user?.tag || "N/A",
      engine: "v6.3.1 Ultimate Core",
    });
  });

  app.post("/api/flush", (req, res) => {
    try {
      import("./utils/cache.js").then(m => m.clearCache());
      if (global.gc) global.gc();
      addLog("[System] Manual cache flush and GC triggered.");
      res.json({ success: true, message: "Cache flushed" });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

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
