import { spawn } from "node:child_process";
import http from "node:http";
import fs from "node:fs";

const preferred = process.env.START_ENTRYPOINT || process.env.MAIN_FILE;
const entry = preferred && preferred !== "start.js"
  ? preferred
  : (fs.existsSync("./server.ts") ? "server.ts" : fs.existsSync("./bot-with-web.ts") ? "bot-with-web.ts" : "bot.ts");

const port = Number(process.env.PORT || process.env.SERVER_PORT || process.env.WEB_PORT || 3000);
const fallbackEnabled = process.env.START_FALLBACK_WEB !== "false";

const fallbackHtml = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>NATSUMI Arcade</title><style>body{margin:0;min-height:100vh;background:linear-gradient(135deg,#090611,#1b102a 55%,#2a1018);color:#fff8ee;font-family:system-ui,Apple SD Gothic Neo,sans-serif;padding:18px}.btn{border:0;border-radius:999px;padding:13px 18px;background:linear-gradient(135deg,#ff8a2a,#ff4fa3);color:white;font-weight:900;text-decoration:none;display:inline-block}.card{background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.16);border-radius:26px;padding:22px;margin:14px 0;box-shadow:0 24px 80px rgba(0,0,0,.35)}h1{font-size:clamp(38px,10vw,78px);line-height:1.02}.fox{font-size:84px;animation:bounce 1.4s infinite}.row{display:flex;gap:12px;flex-wrap:wrap}.result{white-space:pre-wrap;border:1px dashed rgba(255,255,255,.18);border-radius:18px;padding:16px;background:rgba(0,0,0,.25);margin-top:12px}@keyframes bounce{50%{transform:translateY(-10px)}}@media(max-width:720px){body{padding:12px}.card{border-radius:20px;padding:16px}.fox{display:none}.row>*{width:100%;text-align:center}}</style></head><body><header class="row"><b>🦊 NATSUMI Arcade</b><a class="btn" href="https://qr.kakaopay.com/Fa7OA44AL" target="_blank">후원하기</a></header><section class="card"><div class="row"><div style="flex:1"><p>FOX GAME PORTAL</p><h1>나츠미 게임센터</h1><p>웹서버 연결 성공! 원본 repo에서 안전 fallback 페이지가 열렸어.</p><a class="btn" href="/ping">Ping 확인</a></div><div class="fox">🦊</div></div><div class="result">페이지 로드 완료</div></section></body></html>`;

let fallbackServer = null;
if (fallbackEnabled) {
  fallbackServer = http.createServer((req, res) => {
    if (req.url === "/ping") {
      res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
      res.end("pong");
      return;
    }
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(fallbackHtml);
  });
  fallbackServer.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.log(`[Start] Fallback web skipped because port ${port} is already in use.`);
      return;
    }
    console.error(`[Start] Fallback web error: ${error.message}`);
  });
  fallbackServer.listen(port, "0.0.0.0", () => console.log(`[Start] Fallback web running on ${port}`));
}

console.log(`[Start] Launching ${entry} with tsx...`);
const child = spawn("npx", ["tsx", entry], { stdio: "inherit", env: process.env });

child.on("exit", (code, signal) => {
  if (signal) console.log(`[Start] Child exited by signal ${signal}`);
  if (fallbackServer) fallbackServer.close(() => process.exit(code ?? 0));
  else process.exit(code ?? 0);
});

child.on("error", (error) => {
  console.error(`[Start] Failed to launch: ${error.message}`);
  if (fallbackServer) fallbackServer.close(() => process.exit(1));
  else process.exit(1);
});
