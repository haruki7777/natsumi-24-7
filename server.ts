import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";
import { Client, GatewayIntentBits, Events } from "discord.js";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // --- Discord Bot Logic ---
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

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

  // Heartbeat to prove it's alive
  setInterval(() => {
    if (client.isReady()) {
      botPing = client.ws.ping;
    }
  }, 30000);

  client.on(Events.ClientReady, (c) => {
    botStatus = "Online";
    botPing = c.ws.ping;
    botUptime = Date.now();
    addLog(`Logged in as ${c.user.tag}! Bot is ready.`);
  });

  client.on(Events.Error, (error) => {
    botStatus = "Error";
    lastError = error.message;
    addLog(`Discord Client Error: ${error.message}`);
  });

  client.on(Events.ShardDisconnect, () => {
    botStatus = "Disconnected";
    addLog("Shard disconnected. Attempting to reconnect...");
  });

  client.on(Events.ShardReconnecting, () => {
    botStatus = "Reconnecting";
    addLog("Shard is reconnecting...");
  });

  client.on(Events.ShardResume, () => {
    botStatus = "Online";
    addLog("Shard connection resumed.");
  });

  client.on(Events.Warn, (warn) => {
    addLog(`Discord Client Warning: ${warn}`);
  });

  client.on(Events.MessageCreate, (message) => {
    if (message.author.bot) return;
    messageCount++;

    if (message.content === "!ping") {
      message.reply(`Pong! Latency is ${client.ws.ping}ms.`);
      addLog(`Responded to !ping from ${message.author.tag}`);
    }

    if (message.content === "!help") {
      message.reply("Commands: !ping, !echo [text], !stats");
      addLog(`Help requested by ${message.author.tag}`);
    }

    if (message.content === "!stats") {
      const uptimeSec = Math.floor((Date.now() - (botUptime || Date.now())) / 1000);
      message.reply(`System Status: ${botStatus}\nUptime: ${uptimeSec}s\nMessages Handled: ${messageCount}`);
      addLog(`Stats requested by ${message.author.tag}`);
    }
    
    // Echo command as a test
    if (message.content.startsWith("!echo ")) {
      const content = message.content.slice(6);
      message.reply(content);
      addLog(`Echoed message for ${message.author.tag}`);
    }
  });

  // Keep-alive/Reconnect logic is built into discord.js v14
  // but we can add manual check if needed.

  const discordToken = process.env.DISCORD_TOKEN;

  if (discordToken) {
    client.login(discordToken).catch((err) => {
      botStatus = "Login Failed";
      lastError = err.message;
      addLog(`Failed to login: ${err.message}`);
    });
  } else {
    botStatus = "No Token";
    addLog("No DISCORD_TOKEN found in environment variables.");
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
