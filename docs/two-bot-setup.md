# Two bot setup

Use two Discord applications:

- Production bot: real servers, 24/7 host, `natsumi-bot-24-7`
- Development bot: AI Studio/local testing, `natsumi-24-7`

## Repositories

Source/development:

```text
https://github.com/haruki7777/natsumi-24-7
```

Lightweight production mirror:

```text
https://github.com/haruki7777/natsumi-bot-24-7
```

Do not edit `natsumi-bot-24-7` by hand. It is generated automatically from `natsumi-24-7` whenever `main` is pushed.

## Production host variables

Use these on Vortexa-style 512MB hosting:

```env
BOT_NAME="Natsumi"
BOT_ENV="production"
TOKEN="production bot token"
ID="production client id"
MONGOOSE="production MongoDB URI"
MY_GEMINI_API_KEY="Gemini API key"
KOREANBOTS_TOKEN="Koreanbots API token"
KOREANBOTS_BOT_ID="production client id"
KOREANBOTS_BOT_PAGE_URL="https://koreanbots.dev/bots/production-client-id"
PREMIUM_HEART_ENABLED="true"
BOT_FAILOVER_ENABLED="true"
BOT_FAILOVER_ROLE="primary"
BOT_FAILOVER_LOCK_ID="natsumi-discord-session"
NODE_ENV="production"
LOG_LIMIT="60"
MONGO_MAX_POOL_SIZE="5"
DISABLED_COMMAND_CATEGORIES=""
LATENCY_WATCHDOG_ENABLED="true"
LATENCY_RECONNECT_PING_MS="3000"
LATENCY_RECONNECT_CONSECUTIVE="2"
LATENCY_RECONNECT_COOLDOWN_MS="600000"
```

Start command:

```bash
npm install
npm run start:lite
```

If install and start are separate in the panel:

```bash
npm install
```

```bash
npm run start:lite
```

## Development variables

Use a separate Discord application for development:

```env
BOT_NAME="Natsumi Dev"
BOT_ENV="development"
TOKEN="development bot token"
ID="development client id"
MONGOOSE="development MongoDB URI"
MY_GEMINI_API_KEY="Gemini API key"
NODE_ENV="development"
```

Recommended: keep production and development MongoDB databases separate. Do not share economy, level, ticket, or moderation data between prod and dev.

## Discord Developer Portal

Create two applications:

```text
Natsumi
Natsumi Dev
```

Each application needs its own bot token and client ID.

Invite the dev bot only to a private test server. Invite the production bot to real servers.

## Workflow

1. Develop in `natsumi-24-7`.
2. Test with the development bot.
3. Push to `main`.
4. GitHub Actions generates and pushes `natsumi-bot-24-7`.
5. Restart or redeploy the production host from `natsumi-bot-24-7`.

Run `/diagnostics` to confirm which bot is responding. It shows `BOT_NAME` and `BOT_ENV`.

For a backup host, use the same production token and database but set:

```env
BOT_ENV="backup"
BOT_NAME="Natsumi Backup"
BOT_FAILOVER_ENABLED="true"
BOT_FAILOVER_ROLE="backup"
LOG_LIMIT="20"
MONGO_MAX_POOL_SIZE="1"
DISABLED_COMMANDS="랭크"
```

The backup process stays online in standby mode and logs in only after the primary lease expires.
