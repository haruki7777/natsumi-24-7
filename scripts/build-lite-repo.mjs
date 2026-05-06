import fs from "fs";
import path from "path";

const root = process.cwd();
const outDir = path.resolve(process.argv[2] || "lite-build");

const copyEntries = [
  "bot.ts",
  "commands",
  "events",
  "models",
  "utils",
  "Buttons",
  "fonts",
  "tsconfig.json",
  ".env.example",
  "docs/free-bot-hosting.md",
  "docs/two-bot-setup.md",
];

const packageJson = {
  name: "natsumi-bot-24-7",
  version: "1.0.0",
  description: "Lightweight 24/7 hosting build for Natsumi Discord bot",
  type: "module",
  main: "bot.ts",
  scripts: {
    start: "tsx bot.ts",
    "start:lite": "tsx bot.ts",
    check: "node --check bot.ts",
  },
  dependencies: {
    "@google/generative-ai": "^0.24.1",
    "@napi-rs/canvas": "^1.0.0",
    axios: "^1.15.2",
    "discord-html-transcripts": "^3.1.4",
    "discord.js": "^14.9.0",
    dotenv: "^16.0.3",
    mongoose: "^7.0.3",
    "node-fetch": "^2.6.9",
    tsx: "^4.21.0",
    typescript: "^6.0.3",
  },
  engines: {
    node: ">=20",
  },
};

const readme = `# natsumi-bot-24-7

Lightweight hosting build generated from [haruki7777/natsumi-24-7](https://github.com/haruki7777/natsumi-24-7).

Use this repository for 512MB Discord bot hosts.

## Start command

\`\`\`bash
npm install
npm run start:lite
\`\`\`

If the host installs dependencies separately:

\`\`\`bash
npm run start:lite
\`\`\`

## Required environment variables

\`\`\`env
BOT_NAME="Natsumi"
BOT_ENV="production"
TOKEN=""
ID=""
MONGOOSE=""
MY_GEMINI_API_KEY=""
\`\`\`

## Recommended 512MB settings

\`\`\`env
NODE_ENV="production"
LOG_LIMIT="60"
MONGO_MAX_POOL_SIZE="5"
DISABLED_COMMAND_CATEGORIES="NSFW"
LATENCY_WATCHDOG_ENABLED="true"
LATENCY_RECONNECT_PING_MS="3000"
LATENCY_RECONNECT_CONSECUTIVE="2"
LATENCY_RECONNECT_COOLDOWN_MS="600000"
\`\`\`

This repo is auto-generated. Make source changes in \`natsumi-24-7\`.
`;

const gitignore = `node_modules/
.env
.env.*
!.env.example
*.log
dist/
build/
coverage/
`;

const removeIfExists = (target) => {
  if (fs.existsSync(target)) {
    fs.rmSync(target, { recursive: true, force: true });
  }
};

const copyRecursive = (from, to) => {
  if (!fs.existsSync(from)) return;
  const stat = fs.statSync(from);
  if (stat.isDirectory()) {
    fs.mkdirSync(to, { recursive: true });
    for (const entry of fs.readdirSync(from)) {
      copyRecursive(path.join(from, entry), path.join(to, entry));
    }
    return;
  }
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
};

removeIfExists(outDir);
fs.mkdirSync(outDir, { recursive: true });

for (const entry of copyEntries) {
  copyRecursive(path.join(root, entry), path.join(outDir, entry));
}

fs.writeFileSync(path.join(outDir, "package.json"), JSON.stringify(packageJson, null, 2) + "\n");
fs.writeFileSync(path.join(outDir, "README.md"), readme);
fs.writeFileSync(path.join(outDir, ".gitignore"), gitignore);

console.log(`Lite repo generated at ${outDir}`);
