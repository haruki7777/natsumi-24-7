# Deployment and sync

## Recommended flow

1. Edit in AI Studio or locally.
2. Keep this repository connected to GitHub.
3. Run the bot on a 24/7 machine, VPS, NAS, Raspberry Pi, or hosting provider.
4. Use the same `MONGOOSE` connection string everywhere to sync bot data.

AI Studio is good for building and editing the app, but the Discord bot should run from a long-lived runtime. A machine behind your router works if it stays powered on and has stable internet.

## 24/7 with PM2

Install and start:

```bash
npm install
npm install -g pm2
npm run build
pm2 start ecosystem.config.cjs
pm2 save
```

Windows startup:

```powershell
pm2 startup
pm2 save
```

Linux startup:

```bash
pm2 startup
pm2 save
```

## Router access

For same-router dashboard access:

```env
HOST="0.0.0.0"
PORT="3000"
```

Then open:

```text
http://YOUR_PC_LAN_IP:3000
```

For access from outside your home network, use port forwarding from your router to `YOUR_PC_LAN_IP:3000`. Add authentication, VPN, or a reverse proxy before exposing the dashboard publicly.

## High Discord ping on AI Studio / Cloud Run

Use these runtime settings when the bot is deployed from AI Studio to Cloud Run:

```text
Minimum instances: 1
Maximum instances: 1
CPU allocation: always allocated
Concurrency: 1-10
Memory: 512 MiB or higher
```

Environment variables:

```env
NODE_ENV="production"
HOST="0.0.0.0"
PORT="3000"
LOG_PINGS="false"
CACHE_SWEEP_INTERVAL_MS="600000"
```

Open `/api/status` and check:

- `ping`: Discord websocket latency
- `eventLoopLagMs`: Node.js event loop pressure
- `memoryMb`: process memory usage

If `eventLoopLagMs` climbs above 100ms while ping climbs, the process is CPU-blocked. If `eventLoopLagMs` stays low but ping climbs, the hosting region/network or Cloud Run CPU allocation is more likely.

## Auto commit to GitHub

Windows:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\auto-commit.ps1
```

Linux/macOS:

```bash
bash ./scripts/auto-commit.sh
```

The script commits only when files changed, pulls with rebase, then pushes to the current branch. It refuses to commit `.env` files.

To run it every 10 minutes on Windows Task Scheduler, create a task that runs:

```text
powershell.exe -ExecutionPolicy Bypass -File "C:\path\to\natsumi-24-7\scripts\auto-commit.ps1"
```

To run it every 10 minutes on Linux cron:

```cron
*/10 * * * * cd /path/to/natsumi-24-7 && bash ./scripts/auto-commit.sh >> auto-commit.log 2>&1
```
