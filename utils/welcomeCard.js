import { AttachmentBuilder } from "discord.js";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { ensureKoreanFont } from "./fonts.js";

const defaultBackground = "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=1000&auto=format&fit=crop";
const imageCache = new Map();
const CACHE_TTL = 1000 * 60 * 30;

const drawRoundedRect = (ctx, x, y, width, height, radius) => {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
};

const loadCachedImage = async (url) => {
  const cached = imageCache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) return cached.image;

  const image = await Promise.race([
    loadImage(url),
    new Promise((_, reject) => setTimeout(() => reject(new Error("Image load timeout")), 3500)),
  ]);
  imageCache.set(url, { image, timestamp: Date.now() });
  return image;
};

const fillTextFit = (ctx, text, x, y, maxWidth, baseSize, weight = "bold") => {
  let size = baseSize;
  do {
    ctx.font = `${weight} ${size}px NanumGothic`;
    if (ctx.measureText(text).width <= maxWidth || size <= 18) break;
    size -= 2;
  } while (size > 18);
  ctx.fillText(text, x, y);
};

const formatMessage = (template, member) => {
  return String(template || "{user}님, {server}에 온 걸 환영해요!")
    .replaceAll("{user}", member.user.username)
    .replaceAll("{mention}", `<@${member.id}>`)
    .replaceAll("{server}", member.guild.name)
    .replaceAll("{count}", member.guild.memberCount.toLocaleString("ko-KR"));
};

export const buildWelcomeContent = (template, member) => {
  return formatMessage(template, member);
};

export const createWelcomeCard = async (member, template) => {
  await ensureKoreanFont();

  const canvas = createCanvas(900, 300);
  const ctx = canvas.getContext("2d");

  let background = null;
  try {
    background = await loadCachedImage(defaultBackground);
  } catch {
    background = null;
  }

  if (background) {
    const scale = Math.max(canvas.width / background.width, canvas.height / background.height);
    const x = (canvas.width - background.width * scale) / 2;
    const y = (canvas.height - background.height * scale) / 2;
    ctx.drawImage(background, x, y, background.width * scale, background.height * scale);
  } else {
    ctx.fillStyle = "#202431";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.fillStyle = "rgba(0, 0, 0, 0.66)";
  drawRoundedRect(ctx, 22, 22, 856, 256, 18);
  ctx.fill();

  ctx.fillStyle = "rgba(255, 143, 61, 0.16)";
  drawRoundedRect(ctx, 42, 42, 816, 216, 14);
  ctx.fill();

  const avatarUrl = member.user.displayAvatarURL({ extension: "png", size: 256 });
  const avatar = await loadImage(avatarUrl).catch(() => null);

  ctx.save();
  ctx.beginPath();
  ctx.arc(130, 150, 72, 0, Math.PI * 2);
  ctx.clip();
  if (avatar) {
    ctx.drawImage(avatar, 58, 78, 144, 144);
  } else {
    ctx.fillStyle = "#ff8f3d";
    ctx.fill();
  }
  ctx.restore();

  ctx.lineWidth = 5;
  ctx.strokeStyle = "#ffb05c";
  ctx.beginPath();
  ctx.arc(130, 150, 74, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  fillTextFit(ctx, member.user.username, 235, 94, 575, 36);

  ctx.fillStyle = "#ffb05c";
  ctx.font = "bold 24px NanumGothic";
  ctx.fillText("WELCOME", 235, 132);

  ctx.fillStyle = "#ffffff";
  fillTextFit(ctx, formatMessage(template, member).replaceAll(`<@${member.id}>`, member.user.username), 235, 180, 585, 24, "normal");

  ctx.fillStyle = "#d8deea";
  ctx.font = "18px NanumGothic";
  ctx.fillText(`${member.guild.name} · ${member.guild.memberCount.toLocaleString("ko-KR")}번째 멤버`, 235, 226);

  return new AttachmentBuilder(await canvas.encode("png"), { name: `welcome-${member.id}.png` });
};
