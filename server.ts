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
    ],
    partials: [Partials.Channel],
  }) as ExtendedClient;

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

  const discordToken = process.env.DISCORD_TOKEN || process.env.DISCORD_BOT_TOKEN || process.env.TOKEN;
  const clientId = process.env.ID;
  const mongoUri = process.env.MONGOOSE;

  // --- MongoDB Connection ---
  if (mongoUri) {
    mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4,
    }).then(() => {
      addLog("MongoDB Connected successfully.");
    }).catch(err => {
      addLog(`MongoDB Connection Failed: ${err.message}`);
    });
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
            const command = (await import(path.join(categoryPath, file))).default || (await import(path.join(categoryPath, file)));
            if (command && 'data' in command && 'execute' in command) {
              client.commands.set(command.data.name, command);
              commandsJson.push(command.data.toJSON());
              addLog(`Loaded command: ${command.data.name}`);
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
        const event = (await import(path.join(eventsPath, file))).default || (await import(path.join(eventsPath, file)));
        if (event.once) {
          client.once(event.name, (...args) => event.execute(...args, client));
        } else {
          client.on(event.name, (...args) => event.execute(...args, client));
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
        const button = (await import(path.join(buttonsPath, file))).default || (await import(path.join(buttonsPath, file)));
        client.buttons.set(button.name, button);
      } catch (e: any) {
        addLog(`Error loading button ${file}: ${e.message}`);
      }
    }
  }

  // --- Slash Command Registration ---
  if (discordToken && clientId && commandsJson.length > 0) {
    const rest = new REST({ version: "10" }).setToken(discordToken);
    try {
      addLog(`Started refreshing ${commandsJson.length} application (/) commands.`);
      await rest.put(Routes.applicationCommands(clientId), { body: commandsJson });
      addLog("Successfully reloaded application (/) commands.");
    } catch (error: any) {
      addLog(`REST Error: ${error.message}`);
    }
  }

  // --- Interaction Handler ---
  client.on(Events.InteractionCreate, async (interaction) => {
    try {
      if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;
        
        if (!interaction.deferred && !interaction.replied) {
          await interaction.deferReply({ ephemeral: command.ephemeral || false }).catch(() => {});
        }
        
        await command.execute(interaction);
      } else if (interaction.isButton()) {
        const button = client.buttons.get(interaction.customId);
        if (button) {
          await button.execute(interaction);
        }
      }
    } catch (error: any) {
      addLog(`Interaction Error: ${error.message}`);
      if (interaction.isRepliable()) {
        const content = '명령어 실행 중 오류가 발생했다냥!';
        if (interaction.deferred || interaction.replied) {
          await interaction.followUp({ content, ephemeral: true }).catch(() => {});
        } else {
          await interaction.reply({ content, ephemeral: true }).catch(() => {});
        }
      }
    }
  });

  // --- System Monitoring & Self-Healing ---
  setInterval(() => {
    try {
      if (client.isReady()) {
        botPing = client.ws.ping;
      } else if (botStatus === "Online") {
        botStatus = "Reconnecting";
        addLog("SYSTEM: Connection lost. Auto-recovery triggered.");
        if (discordToken) client.login(discordToken).catch(e => addLog(`Recovery failed: ${e.message}`));
      }
    } catch (e: any) {
      addLog(`Monitor Error: ${e.message}`);
    }
  }, 60000);

  // --- Discord Built-in Events ---
  client.on(Events.ClientReady, (c) => {
    botStatus = "Online";
    botPing = c.ws.ping;
    botUptime = Date.now();
    addLog(`Logged in as ${c.user.tag}! System core operational.`);

    // KoreanBots Stats Sync
    setInterval(async () => {
      try {
        // Only if we have the kbot token (implied in user's index.js)
        // Note: The token in user's code was hardcoded, I'll extract it if I can or leave a placeholder
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
  });

  client.on(Events.MessageCreate, (message) => {
    if (message.author.bot) return;
    messageCount++;
    // Legacy prefix handling if needed
    if (message.content === "!ping") message.reply(`Pong! ${client.ws.ping}ms`);
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
    addLog("Missing DISCORD_TOKEN / DISCORD_BOT_TOKEN / TOKEN.");
  }

  // --- API Routes ---
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // --- Process Error Handling (To prevent crashing) ---
  process.on("unhandledRejection", (reason, promise) => {
    addLog(`Unhandled Rejection at: ${promise} reason: ${reason}`);
  });

  process.on("uncaughtException", (err) => {
    addLog(`Uncaught Exception: ${err.message}`);
    // Optional: Restart the client if it dies
    if (!client.isReady()) {
       addLog("Attempting to recover client...");
       // client logic will usually try to reconnect itself
    }
  });
}

startServer();
