import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { spawn } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import ffmpegPath from "ffmpeg-static";

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

  const loaded = await loadImageMeta(image.url);
  const ratio = loaded.width / Math.max(loaded.height, 1);
  return ratio < 0.92 || ratio > 1.08;
};

export const isGifEmojiImage = (image) => {
  return (image?.contentType || "").includes("gif") || /\.gif$/i.test(image?.name || "");
};

const fetchImageBuffer = async (url) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`image fetch failed ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
};

const runFfmpeg = (args) => new Promise((resolve, reject) => {
  if (!ffmpegPath) return reject(new Error("ffmpeg is not available"));

  const child = spawn(ffmpegPath, args, { windowsHide: true });
  let stderr = "";
  child.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });
  child.once("error", reject);
  child.once("close", (code) => {
    if (code === 0) resolve();
    else reject(new Error(stderr || `ffmpeg exited with ${code}`));
  });
});

const buildAnimatedEmojiBuffer = async (url, mode = "crop") => {
  const workDir = path.join(tmpdir(), `natsumi-emoji-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  await mkdir(workDir, { recursive: true });

  const input = path.join(workDir, "input.gif");
  const palette = path.join(workDir, "palette.png");
  const output = path.join(workDir, "output.gif");
  const fps = Math.max(5, Math.min(Number(process.env.NATSUMI_EMOJI_GIF_FPS || 12), 20));
  const resizeFilter = mode === "pad"
    ? "scale=128:128:force_original_aspect_ratio=decrease,pad=128:128:(ow-iw)/2:(oh-ih)/2:color=0x00000000"
    : "scale=128:128:force_original_aspect_ratio=increase,crop=128:128";
  const filter = `fps=${fps},${resizeFilter}`;

  try {
    await writeFile(input, await fetchImageBuffer(url));
    await runFfmpeg(["-y", "-i", input, "-vf", `${filter},palettegen=reserve_transparent=on`, palette]);
    await runFfmpeg(["-y", "-i", input, "-i", palette, "-filter_complex", `${filter} [x]; [x][1:v] paletteuse=alpha_threshold=128`, "-loop", "0", output]);
    return await readFile(output);
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
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

  if (isGifEmojiImage(image) && mode === "raw") {
    attachment = image.url;
  } else if (isGifEmojiImage(image)) {
    attachment = await buildAnimatedEmojiBuffer(image.url, mode);
  } else {
    attachment = await buildEmojiBuffer(image.url, mode);
  }

  return message.guild.emojis.create({
    attachment,
    name: emojiName,
    reason: `Natsumi emoji request: ${actorTag || message.author?.tag || "unknown"}`,
  });
};
