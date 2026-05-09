# Free bot hosting mode

Use this mode for 512MB Discord bot hosts such as Vortexa-style or Pterodactyl-based free hosting.

## Startup command

```bash
npm install
npm run start:lite
```

If the host already runs install separately, use only:

```bash
npm run start:lite
```

## Environment variables

Required:

```env
BOT_NAME="Natsumi"
BOT_ENV="production"
TOKEN=""
ID=""
MONGOOSE=""
MY_GEMINI_API_KEY=""
KOREANBOTS_TOKEN=""
KOREANBOTS_BOT_ID=""
KOREANBOTS_BOT_PAGE_URL=""
PREMIUM_HEART_ENABLED="true"
BOT_FAILOVER_ENABLED="false"
BOT_FAILOVER_ROLE="primary"
BOT_FAILOVER_LOCK_ID="natsumi-discord-session"
```

Recommended for 512MB plans:

```env
NODE_ENV="production"
LOG_LIMIT="60"
MONGO_MAX_POOL_SIZE="5"
LATENCY_WATCHDOG_ENABLED="true"
LATENCY_RECONNECT_PING_MS="3000"
LATENCY_RECONNECT_CONSECUTIVE="2"
LATENCY_RECONNECT_COOLDOWN_MS="600000"
```

Optional memory savers:

```env
DISABLED_COMMAND_CATEGORIES=""
DISABLED_COMMANDS=""
```

Add command names to `DISABLED_COMMANDS` only if the host still hits memory limits.
Set `DISABLED_COMMAND_CATEGORIES="NSFW"` only if the host cannot handle NSFW image commands at all.

## Backup host mode

For active/passive failover, keep both hosts running but allow only one to log in to Discord.

Primary host:

```env
BOT_FAILOVER_ENABLED="true"
BOT_FAILOVER_ROLE="primary"
```

Backup host:

```env
BOT_FAILOVER_ENABLED="true"
BOT_FAILOVER_ROLE="backup"
LOG_LIMIT="20"
MONGO_MAX_POOL_SIZE="1"
DISABLED_COMMANDS="랭크"
```

Both hosts must share the same `MONGOOSE` value so they can coordinate the lease.

## GitHub update flow

Most free bot hosts do not auto-pull GitHub on every push. Use one of these:

- If the panel supports GitHub deploy: connect this repository and set the startup command to `npm run start:lite`.
- If the panel supports a console: run `git pull`, then restart the server.
- If the panel only supports file uploads: download the repository ZIP from GitHub and upload it after each update.

Never put `.env` or bot tokens in GitHub. Store secrets in the hosting panel's environment variables.
