import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const logDir = path.join(root, "logs");
const errorLogPath = path.join(logDir, "error.log");
const command = process.env.NATSUFIX_BOT_COMMAND || "npx";
const args = process.env.NATSUFIX_BOT_ARGS
  ? process.env.NATSUFIX_BOT_ARGS.split(" ").filter(Boolean)
  : ["tsx", "bot.ts"];
const maxRestarts = Number(process.env.NATSUFIX_MAX_RESTARTS || 5);
const restartDelayMs = Number(process.env.NATSUFIX_RESTART_DELAY_MS || 5000);

fs.mkdirSync(logDir, { recursive: true });

const mask = (text) =>
  String(text)
    .replace(/(TOKEN|API_KEY|KEY|SECRET|PASSWORD|MONGOOSE|MONGODB_URI)\s*=\s*[^\s]+/gi, "$1=[MASKED]")
    .replace(/Bot\s+[A-Za-z0-9._-]+/g, "Bot [MASKED]")
    .replace(/[A-Za-z0-9_-]{24}\.[A-Za-z0-9_-]{6}\.[A-Za-z0-9_-]{27,}/g, "[MASKED_DISCORD_TOKEN]");

const appendError = (source, chunk) => {
  const text = mask(chunk.toString());
  if (!text.trim()) return;
  fs.appendFileSync(errorLogPath, `${new Date().toISOString()} [${source}] ${text}\n`, "utf-8");
};

let restarts = 0;
let child = null;
let stopping = false;

const start = () => {
  console.log(`[NatsuFix] starting bot: ${command} ${args.join(" ")}`);
  child = spawn(command, args, { cwd: root, env: process.env, stdio: ["inherit", "pipe", "pipe"] });

  child.stdout.on("data", (data) => {
    const text = data.toString();
    process.stdout.write(text);
    if (/\b(error|fatal|exception|unhandled|failed)\b/i.test(text)) appendError("stdout", text);
  });

  child.stderr.on("data", (data) => {
    process.stderr.write(data);
    appendError("stderr", data);
  });

  child.on("exit", (code, signal) => {
    appendError("exit", `bot exited with code=${code} signal=${signal}`);
    if (stopping) return;
    if (restarts >= maxRestarts) {
      console.error(`[NatsuFix] max restarts reached (${maxRestarts}). Stop.`);
      process.exit(code || 1);
    }
    restarts += 1;
    console.log(`[NatsuFix] restarting in ${restartDelayMs}ms... (${restarts}/${maxRestarts})`);
    setTimeout(start, restartDelayMs);
  });
};

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    stopping = true;
    child?.kill(signal);
    process.exit(0);
  });
}

start();
