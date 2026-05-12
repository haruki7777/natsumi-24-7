import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { createCanvas, loadImage } from "@napi-rs/canvas";

export const getFirstEmojiImage = (message) => {
  return message.attachments.find((file) => {
    const type = file.contentType || "";
    const name = file.name || "";
    return type.startsWith("image/") || /\.(png|jpe?g|webp|gif)$/i.test(name);
  });
};

export const sanitizeEmojiName = (value) => {
  const cleaned = String(value || "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 32);

  return cleaned || `natsumi_${Date.now().toString(36)}`;
};

export const buildEmojiChoiceRow = (messageId) => [
  new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`NatsumiEmoji_crop_${messageId}`)
      .setLabel("긴 부분 자르기")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`NatsumiEmoji_pad_${messageId}`)
      .setLabel("빈 공간을 투명하게 채우기")
      .setStyle(ButtonStyle.Secondary)
  ),
  new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`NatsumiEmoji_raw_${messageId}`)
      .setLabel("GIF 그대로 추가")
      .setStyle(ButtonStyle.Success)
  ),
];

const loadImageMeta = async (url) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`image fetch failed ${response.status}`);

  const arrayBuffer = await response.arrayBuffer();
  const image = await loadImage(Buffer.from(arrayBuffer));
  return image;
};

export const shouldAskEmojiResize = async (image) => {
  if (!image?.url) return false;
  if ((image.contentType || "").includes("gif")) return true;

  const loaded = await loadImageMeta(image.url);
  const ratio = loaded.width / Math.max(loaded.height, 1);
  return ratio < 0.92 || ratio > 1.08;
};

export const buildEmojiBuffer = async (url, mode = "crop") => {
  const image = await loadImageMeta(url);
  const size = 128;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, size, size);

  const scale = mode === "pad"
    ? Math.min(size / image.width, size / image.height)
    : Math.max(size / image.width, size / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  const x = (size - width) / 2;
  const y = (size - height) / 2;

  ctx.drawImage(image, x, y, width, height);
  return canvas.toBuffer("image/png");
};

export const createEmojiFromMessage = async ({ message, mode = "crop", actorTag = null }) => {
  const image = getFirstEmojiImage(message);
  if (!image) throw new Error("missing image");

  const emojiName = sanitizeEmojiName(message.content);
  let attachment;

  if (mode === "raw" && ((image.contentType || "").includes("gif") || /\.gif$/i.test(image.name || ""))) {
    attachment = image.url;
  } else {
    attachment = await buildEmojiBuffer(image.url, mode);
  }

  return message.guild.emojis.create({
    attachment,
    name: emojiName,
    reason: `Natsumi emoji request: ${actorTag || message.author?.tag || "unknown"}`,
  });
};
