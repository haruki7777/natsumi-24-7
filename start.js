import { spawn } from "node:child_process";
import fs from "node:fs";

const preferred = process.env.START_ENTRYPOINT || process.env.MAIN_FILE;
const entry = preferred || (fs.existsSync("./server.ts") ? "server.ts" : fs.existsSync("./bot-with-web.ts") ? "bot-with-web.ts" : "bot.ts");

console.log(`[Start] Launching ${entry} with tsx...`);

const child = spawn("npx", ["tsx", entry], {
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code, signal) => {
  if (signal) console.log(`[Start] Child exited by signal ${signal}`);
  process.exit(code ?? 0);
});

child.on("error", (error) => {
  console.error(`[Start] Failed to launch: ${error.message}`);
  process.exit(1);
});
