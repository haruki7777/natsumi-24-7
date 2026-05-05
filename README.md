<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/ee0d109e-546e-40a1-9109-5739b5ce271b

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Router / LAN access

The Express dashboard listens on `HOST` and `PORT`.

- Same-router access: set `HOST="0.0.0.0"` and `PORT="3000"`, then open `http://YOUR_PC_LAN_IP:3000` from another device on the same router.
- External access: configure router port forwarding from an external port to `YOUR_PC_LAN_IP:3000`. Use a firewall allow rule for the chosen port.
- Sync: use the same `MONGOOSE` MongoDB connection string for every bot instance. That keeps economy, levels, tickets, learned data, and moderation settings shared.

Do not expose the dashboard to the public internet unless you add authentication or put it behind a trusted reverse proxy/VPN.
