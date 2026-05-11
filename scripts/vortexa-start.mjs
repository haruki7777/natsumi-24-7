import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const branch = process.env.BRANCH || process.env.GIT_BRANCH || "main";
const shouldUpdate = process.env.VORTEXA_AUTO_UPDATE !== "false";
const shouldInstall = process.env.VORTEXA_NPM_INSTALL !== "false";
const quiet = process.env.VORTEXA_QUIET !== "false";

const log = (message) => console.log(`[Vortexa] ${message}`);

const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    env: {
      ...process.env,
      npm_config_audit: "false",
      npm_config_fund: "false",
      npm_config_loglevel: quiet ? "error" : "notice",
    },
    stdio: quiet ? "pipe" : "inherit",
    ...options,
  });

  if (result.status !== 0) {
    const output = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
    if (output) console.error(output.split("\n").slice(-30).join("\n"));
    throw new Error(`${command} ${args.join(" ")} failed with code ${result.status}`);
  }

  return result;
};

const remove = (target) => {
  const full = path.join(root, target);
  if (!fs.existsSync(full)) return;
  fs.rmSync(full, { recursive: true, force: true });
  log(`removed ${target}`);
};

const cleanOldCache = () => {
  log("cleaning old cache and stale files...");

  const targets = [
    ".cache",
    ".vite",
    "dist",
    "build",
    "tmp",
    "temp",
    "logs",
    "node_modules/.cache",
    "commands/nsfw",
    "commands/nsfw2.js",
  ];

  for (const target of targets) remove(target);
};

const syncLatestGit = () => {
  if (!shouldUpdate || !fs.existsSync(path.join(root, ".git"))) {
    log("git sync skipped");
    return;
  }

  log(`syncing latest origin/${branch}...`);
  run("git", ["config", "--global", "--add", "safe.directory", "*"]);
  run("git", ["fetch", "--prune", "origin", branch]);
  run("git", ["reset", "--hard", `origin/${branch}`]);
  run("git", ["clean", "-fd", "--exclude=node_modules", "--exclude=.env", "--exclude=startup.log"]);
};

const installDeps = () => {
  if (!shouldInstall) {
    log("npm install skipped");
    return;
  }

  log("refreshing dependencies quietly...");
  run("npm", ["install", "--no-audit", "--no-fund", "--prefer-offline"]);
};

const startBot = () => {
  log("starting NATSUMI bot...");
  const result = spawnSync("npx", ["tsx", "bot.ts"], {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });

  process.exit(result.status ?? 0);
};

try {
  cleanOldCache();
  syncLatestGit();
  cleanOldCache();
  installDeps();
  startBot();
} catch (error) {
  console.error(`[Vortexa] startup failed: ${error.message}`);
  process.exit(1);
}
