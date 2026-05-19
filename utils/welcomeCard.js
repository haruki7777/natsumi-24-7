import { AttachmentBuilder } from "discord.js";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { ensureKoreanFont } from "./fonts.js";

const withTimeout = (promise, ms, fallback = null) =>
  Promise.race([
    promise.catch(() => fallback),
    new Promise((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function fitText(ctx, text, x, y, maxWidth) {
  let value = String(text || "");
  while (value.length > 2 && ctx.measureText(value).width > maxWidth) {
    value = `${value.slice(0, -2)}...`;
  }
  ctx.fillText(value, x, y);
}

export async function buildMemberCard(member, type = "welcome") {
  await withTimeout(ensureKoreanFont(), 1000);
  const isLeave = type === "leave";
  const canvas = createCanvas(920, 320);
  const ctx = canvas.getContext("2d");

  const gradient = ctx.createLinearGradient(0, 0, 920, 320);
  gradient.addColorStop(0, isLeave ? "#1f2937" : "#24113a");
  gradient.addColorStop(0.55, isLeave ? "#334155" : "#db2777");
  gradient.addColorStop(1, isLeave ? "#64748b" : "#ff8f3d");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 920, 320);

  ctx.globalAlpha = 0.2;
  for (let x = -40; x < 960; x += 36) {
    ctx.fillStyle = x % 72 === 0 ? "#fff7ad" : "#ffffff";
    ctx.fillRect(x, 0, 14, 320);
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = "rgba(9, 6, 17, 0.76)";
  roundRect(ctx, 28, 28, 864, 264, 28);
  ctx.fill();
  ctx.strokeStyle = "#ffe8a3";
  ctx.lineWidth = 5;
  ctx.stroke();

  const avatar = await withTimeout(loadImage(member.user.displayAvatarURL({ extension: "png", size: 256 })), 1800);
  ctx.save();
  roundRect(ctx, 62, 76, 168, 168, 30);
  ctx.clip();
  if (avatar) ctx.drawImage(avatar, 62, 76, 168, 168);
  else {
    ctx.fillStyle = "#ff7ab6";
    ctx.fillRect(62, 76, 168, 168);
  }
  ctx.restore();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 5;
  roundRect(ctx, 62, 76, 168, 168, 30);
  ctx.stroke();

  ctx.fillStyle = "#ffd1e7";
  ctx.font = "bold 22px NanumGothic";
  ctx.fillText(isLeave ? "GOODBYE" : "WELCOME", 270, 92);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 42px NanumGothic";
  fitText(ctx, member.user.globalName || member.user.username, 270, 145, 520);
  ctx.fillStyle = "#ffe8a3";
  ctx.font = "bold 22px NanumGothic";
  fitText(ctx, member.guild.name, 270, 190, 520);
  ctx.fillStyle = "#d8deea";
  ctx.font = "18px NanumGothic";
  ctx.fillText(isLeave ? "서버를 떠났어. 기록 카드를 남겨둘게." : "프로필 카드와 함께 환영 메시지를 보냈어.", 270, 230);

  return new AttachmentBuilder(await canvas.encode("png"), {
    name: `${type}-${member.id}.png`,
  });
}
