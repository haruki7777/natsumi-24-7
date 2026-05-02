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
  Partials 
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
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildIntegrations,
      GatewayIntentBits.GuildInvites,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.DirectMessages,
      GatewayIntentBits.GuildMessageReactions,
    ],
    partials: [Partials.Channel, Partials.Message, Partials.User],
  }) as any; // Using any for simplicity with attached properties

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

  const discordToken = process.env.TOKEN;
  const geminiKey = process.env.MY_GEMINI_API_KEY;
  const clientId = process.env.ID;
  const mongoUri = process.env.MONGOOSE;

  if (geminiKey) {
      addLog(`MY_GEMINI_API_KEY found (Length: ${geminiKey.length})`);
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
    // Do not exit process, stay alive
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
            const modulePath = path.join(categoryPath, file);
            const moduleExports = await import(`file://${modulePath}`);
            const command = moduleExports.default || moduleExports;

            if (command && command.data && typeof command.execute === 'function') {
              const commandName = command.data.name;
              if (client.commands.has(commandName)) {
                addLog(`CRITICAL: Duplicate command name detected: ${commandName} in ${file}`);
              }
              client.commands.set(commandName, command);
              
              // Ensure toJSON exists (standard for SlashCommandBuilder)
              const json = typeof command.data.toJSON === 'function' ? command.data.toJSON() : command.data;
              commandsJson.push(json);
              addLog(`Loaded command [${category}]: ${commandName}`);
            } else {
              addLog(`Skipped invalid command file: ${file} (missing data or execute)`);
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
        const modulePath = path.join(eventsPath, file);
        const moduleExports = await import(`file://${modulePath}`);
        const event = moduleExports.default || moduleExports;

        console.log(`[EventLoader] Checking file: ${file}, name: ${event?.name}`);

        if (event && event.name && typeof event.execute === 'function') {
          if (client.listeners(event.name).length > 0 && !event.once) {
             console.log(`[EventLoader] Event ${event.name} already has listeners. Skipping ${file} to avoid duplicates.`);
             continue;
          }
          console.log(`[EventLoader] Loading event: ${event.name} from ${file}`);
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
        const modulePath = path.join(buttonsPath, file);
        const moduleExports = await import(`file://${modulePath}`);
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
  if (!clientId) {
    addLog("WARNING: ID (Client ID) environment variable is missing. Slash commands will NOT be registered.");
  }

  if (discordToken && clientId && commandsJson.length > 0) {
    const rest = new REST({ version: "10" }).setToken(discordToken);
    try {
      addLog(`Started refreshing ${commandsJson.length} application (/) commands.`);
      // Log command names for debugging
      const names = commandsJson.map(c => c.name);
      addLog(`Commands to register: ${names.join(", ")}`);
      
      if (!names.includes("나츠미")) {
        addLog("CRITICAL: Command '나츠미' is MISSING from the registration list!");
      }
      
      await rest.put(Routes.applicationCommands(clientId), { body: commandsJson });
      addLog("Successfully reloaded application (/) commands.");
    } catch (error: any) {
      addLog(`REST Error: ${error.message}`);
      if (error.rawError && error.rawError.errors) {
        addLog(`Detailed Errors: ${JSON.stringify(error.rawError.errors)}`);
      }
    }
  }

  // --- (Handlers are now entirely managed by files in /events folder) ---

  // --- System Monitoring ---
  setInterval(() => {
    try {
      if (client.isReady()) {
        botPing = client.ws.ping;
      } else if (botStatus === "Online") {
        botStatus = "Reconnecting";
        addLog("SYSTEM: Connection lost. Discord.js will attempt auto-recovery.");
      }
    } catch (e: any) {
      addLog(`Monitor Error: ${e.message}`);
    }
  }, 60000);

  let heartbeatStarted = false;
  let statsSyncStarted = false;

  // --- Discord Built-in Events ---
  client.on(Events.ClientReady, (c) => {
    botStatus = "Online";
    botPing = c.ws.ping;
    botUptime = Date.now();
    addLog(`Logged in as ${c.user.tag}! System core operational.`);

    // --- Heartbeat Logger (Only start once) ---
    if (!heartbeatStarted) {
      heartbeatStarted = true;
      setInterval(() => {
        const now = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
        console.log(`[Heartbeat] Bot is alive - ${now} | Memory: ${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`);
      }, 60000); 
    }

    // --- KoreanBots Stats Sync (Only start once) ---
    if (!statsSyncStarted) {
      statsSyncStarted = true;
      setInterval(async () => {
        try {
          const kBotToken = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjkwNTM1NTQ5MTcwODkwMzQ4NSIsImlhdCI6MTY3MTY5MzI4Mn0.PLZUpymiTlFDpRXcUH_bH-4KGwiSPQJsBNhq_bN796sTOMuPOLyaQvrme0ZeuYgtnRZk1r9vgUAx9Q27P7j0NEkR5bTYy1vFptDs2QvtaHZAyHcfPVwF_jiXHWwbtRqbCPof6neLCq6rktnm5VULIQqo076QE5-kPgJ2ZkqH9IU";
          await fetch(`https://koreanbots.dev/api/v2/bots/905355491708903485/stats`, {
            method: 'POST',
            headers: { 
              'Authorization': kBotToken,
              'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ 
              "servers": client.guilds.cache.size, 
              "shards": client.shard?.count || 1 
            })
          });
        } catch (e) {}
      }, 600000);
    }
  });

  client.on(Events.Error, e => {
    botStatus = "Error";
    lastError = e.message;
    addLog(`DJS Error: ${e.message}`);
  });

  if (discordToken) {
    client.login(discordToken).catch(e => {
      botStatus = "Login Failed";
      addLog(`Login Error: ${e.message}`);
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
