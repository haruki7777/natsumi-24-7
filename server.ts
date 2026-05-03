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
  const app = express();
  const PORT = 3000;

  // --- Discord Bot Initialization ---
  // Using bitmask to exclude privileged intents (Ignore causing errors)
  const safeIntents = new IntentsBitField(32767); 
  safeIntents.remove(
    IntentsBitField.Flags.GuildPresences, 
    IntentsBitField.Flags.GuildMembers, 
    IntentsBitField.Flags.MessageContent
  );

  const client = new Client({
    intents: safeIntents,
    partials: [Partials.Channel, Partials.Message, Partials.User],
    // REST Optimization for stability
    rest: {
      offset: 0,
      timeout: 15000,
      retries: 3,
    },
    // Absolute Minimum Cache: Disable almost everything
    makeCache: Options.cacheWithLimits({
      MessageManager: 0,
      ThreadManager: 0,
      PresenceManager: 0,
      ReactionManager: 0,
      GuildMemberManager: 0,
      UserManager: 0,
      VoiceStateManager: 0,
    }),
    sweepers: {
      messages: {
        interval: 300, // 5 minutes
        lifetime: 1,   // Extreme cleanup
      },
      users: {
        interval: 300,
        filter: () => (user: any) => user.id !== client.user?.id,
      }
    },
  }) as any; 

  // Global Error Handling to prevent crashes
  process.on("unhandledRejection", (reason, promise) => {
    console.error("[Anti-Crash] Unhandled Rejection at:", promise, "reason:", reason);
  });

  process.on("uncaughtException", (err, origin) => {
    console.error("[Anti-Crash] Uncaught Exception:", err, "at:", origin);
  });

  // Faster GC and System Sweep (Every 2 minutes)
  setInterval(() => {
    try {
      if (client.isReady()) {
        client.guilds.cache.forEach((guild: any) => {
           guild.members.cache.clear(); 
           guild.messages.cache.clear();
           guild.voiceStates.cache.clear();
           guild.presences.cache.clear();
        });
        client.users.cache.clear();
        client.channels.cache.clear();
        import("./utils/cache.js").then(m => m.clearCache()).catch(() => {});
      }
      if (global.gc) global.gc();
    } catch (e: any) {}
  }, 120000); 

  const instanceId = Math.random().toString(36).substring(2, 8);
  client.instanceId = instanceId;
  client.commands = new Collection();
  client.buttons = new Collection();

  let botStatus = "Offline";
  let botPing = -1;
  let botUptime = 0;
  let lastError = "";
  let messageCount = 0;
  const logs: string[] = [];

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const entry = `[${timestamp}] ${msg}`;
    logs.push(entry);
    if (logs.length > 50) logs.shift();
    console.log(entry);
  };

  const discordToken = process.env.TOKEN?.replace(/['"]/g, "").trim();
  const geminiKey = process.env.MY_GEMINI_API_KEY;
  const clientId = process.env.ID?.replace(/['"]/g, "").trim();
  const mongoUri = process.env.MONGOOSE?.replace(/['"]/g, "").trim();

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

  // --- Dynamic Loader: Commands ---
  const commandsJson: any[] = [];
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
            // Use pathToFileURL for robust ESM imports on all platforms
            const moduleUrl = new URL(`file://${modulePath}`);
            const moduleExports = await import(moduleUrl.href);
            const command = moduleExports.default || moduleExports;

            if (command && command.data && typeof command.execute === 'function') {
              const commandName = command.data.name;
              if (client.commands.has(commandName)) {
                addLog(`CRITICAL: Duplicate command name detected: ${commandName} in ${file}`);
              }
              client.commands.set(commandName, command);
              
              const json = typeof command.data.toJSON === 'function' ? command.data.toJSON() : command.data;
              commandsJson.push(json);
              addLog(`Loaded command [${category}]: ${commandName}`);
            }
          } catch (e: any) {
            addLog(`Error loading command ${file}: ${e.message}`);
          }
        }
      }
    }
  }

  // --- Dynamic Loader: Events ---
  const eventsPath = path.join(process.cwd(), "events");
  if (fs.existsSync(eventsPath)) {
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith(".js") || file.endsWith(".ts"));
    for (const file of eventFiles) {
      try {
        const modulePath = path.resolve(eventsPath, file);
        const moduleUrl = new URL(`file://${modulePath}`);
        const moduleExports = await import(moduleUrl.href);
        const event = moduleExports.default || moduleExports;

        if (event && event.name && typeof event.execute === 'function') {
          if (event.once) {
            client.once(event.name, (...args) => event.execute(...args, client));
          } else {
            client.on(event.name, (...args) => event.execute(...args, client));
          }
          addLog(`Loaded event: ${event.name}`);
        }
      } catch (e: any) {
        addLog(`Error loading event ${file}: ${e.message}`);
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
        const moduleExports = await import(moduleUrl.href);
        const button = moduleExports.default || moduleExports;
        if (button && button.name) {
          client.buttons.set(button.name, button);
          addLog(`Loaded button: ${button.name}`);
        }
      } catch (e: any) {
        addLog(`Error loading button ${file}: ${e.message}`);
      }
    }
  }

  // --- Slash Command Registration ---
  if (discordToken && clientId && commandsJson.length > 0) {
    const rest = new REST({ version: "10" }).setToken(discordToken);
    try {
      addLog(`Refreshing ${commandsJson.length} commands.`);
      await rest.put(Routes.applicationCommands(clientId), { body: commandsJson });
      addLog("Successfully reloaded commands.");
    } catch (error: any) {
      addLog(`REST Error: ${error.message}`);
    }
  }

  // --- Discord Built-in Events ---
  client.on(Events.ClientReady, (c) => {
    botStatus = "Online";
    botPing = c.ws.ping;
    botUptime = Date.now();
    addLog(`Logged in as ${c.user.tag}!`);
  });

  client.on(Events.Error, e => {
    botStatus = "Error";
    lastError = e.message;
    addLog(`DJS Error: ${e.message}`);
  });

  if (discordToken) {
    addLog("Attempting to login...");
    client.login(discordToken).catch(e => {
      botStatus = "Login Failed";
      lastError = e.message;
      addLog(`FATAL LOGIN ERROR: ${e.message}`);
      if (e.message.includes("intents") || e.message.includes("privileged")) {
        addLog("CRITICAL: 인텐트 오류 발생! Discord Developer Portal에서 'Message Content Intent'와 'Server Members Intent'를 활성화해주세요.");
        addLog("방법: Discord Dev Portal -> Bot -> Privileged Gateway Intents 하위의 버튼 3개를 모두 켬.");
      }
    });
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
      ping: client.ws.ping || -1,
      uptime: botUptime ? Math.floor((Date.now() - botUptime) / 1000) : 0,
      messageCount,
      lastError,
      logs: logs.slice().reverse(),
      tag: client.user?.tag || "N/A",
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
