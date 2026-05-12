import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
} from "discord.js";
import { GoogleGenAI, Modality } from "@google/genai";
import { createCanvas, loadImage } from "@napi-rs/canvas";

let googleImageClient = null;
let googleImageKey = null;

const cleanEnv = (value) => value?.replace?.(/[\"']/g, "").trim();

const getGoogleImageKey = () => {
  return cleanEnv(process.env.NATSUMI_IMAGE_API_KEY)
    || cleanEnv(process.env.GOOGLE_API_KEY)
    || cleanEnv(process.env.MY_GEMINI_API_KEY)
    || cleanEnv(process.env.GEMINI_API_KEY);
};

const getGoogleImageClient = () => {
  const key = getGoogleImageKey();
  if (!key) return null;

  if (!googleImageClient || googleImageKey !== key) {
    googleImageClient = new GoogleGenAI({ apiKey: key });
    googleImageKey = key;
  }

  return googleImageClient;
};

const getImageModelName = () => {
  const configured = cleanEnv(process.env.NATSUMI_IMAGE_MODEL);
  if (!configured || configured === "gemini-2.5-flash-image-preview") return "gemini-2.5-flash-image";
  return configured;
};

const numberEnv = (name, fallback, { min = 1, max = Number.MAX_SAFE_INTEGER } = {}) => {
  const value = Number(process.env[name] || fallback);
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
};

const MAX_INLINE_IMAGE_SIDE = numberEnv("NATSUMI_IMAGE_INPUT_MAX_SIDE", 448, { min: 128, max: 1024 });
const MAX_INLINE_IMAGE_BYTES = numberEnv("NATSUMI_IMAGE_INPUT_MAX_BYTES", 350_000, { min: 80_000, max: 1_500_000 });
const IMAGE_MODEL_TIMEOUT_MS = numberEnv("NATSUMI_IMAGE_MODEL_TIMEOUT_MS", 30_000, { min: 10_000, max: 100_000 });
const IMAGE_SLOW_NOTICE_MS = numberEnv("NATSUMI_IMAGE_SLOW_NOTICE_MS", 8_000, { min: 3_000, max: 30_000 });
const IMAGE_TARGET_COUNT = numberEnv("NATSUMI_IMAGE_MAX_COUNT", 5, { min: 1, max: 5 });

const getRequestedCount = (text = "") => {
  const source = String(text || "");
  if (source.includes("5개") || source.includes("5장") || source.includes("다섯")) return Math.min(5, IMAGE_TARGET_COUNT);
  if (source.includes("4개") || source.includes("4장") || source.includes("네")) return Math.min(4, IMAGE_TARGET_COUNT);
  if (source.includes("3개") || source.includes("3장") || source.includes("세")) return Math.min(3, IMAGE_TARGET_COUNT);
  if (source.includes("2개") || source.includes("2장") || source.includes("두")) return Math.min(2, IMAGE_TARGET_COUNT);
  return 1;
};

const summarizeError = (error) => {
  const status = error?.status || error?.code || "unknown";
  const message = String(error?.message || error || "unknown error").split("\n")[0].slice(0, 180);
  return `${status}: ${message}`;
};

export const buildAiImageActionRows = (messageId) => [
  new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`NatsumiImage_convert_${messageId}`).setLabel("AI그림으로 변환").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`NatsumiImage_custom_${messageId}`).setLabel("AI그림 사용자 지정").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`NatsumiImage_cancel_${messageId}`).setLabel("취소").setStyle(ButtonStyle.Danger)
  ),
  new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`NatsumiImage_resolution_768_${messageId}`).setLabel("빠른 768p").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`NatsumiImage_resolution_1080_${messageId}`).setLabel("고화질 1080p").setStyle(ButtonStyle.Secondary)
  ),
];

export const buildImagePrompt = ({ prompt = "", negative = "", similarity = "", resolution = "" } = {}) => {
  const parts = [
    prompt.trim() || "Convert the attached image into a polished anime-style image while preserving the main subject.",
    "Generate one complete image for this request.",
    "Prefer a clean composition, sharp face details, stable hands, and a finished anime illustration look.",
  ];
  if (similarity) parts.push(`Keep about ${similarity}% similarity to the source image.`);
  if (resolution) parts.push(`Target long side around ${resolution}px, but prioritize finishing quickly.`);
  if (negative.trim()) parts.push(`Avoid these negative keywords: ${negative.trim()}.`);
  return parts.join("\n");
};

export const buildImageResultActionRow = (ownerId) => [
  new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`NatsumiImage_result_${ownerId}`)
      .setPlaceholder("이 그림으로 할 작업 선택")
      .addOptions(
        { label: "이 그림 저장", value: "save", description: "이미지 링크를 개인 안내로 받아요." },
        { label: "이 그림 삭제", value: "delete", description: "결과 메시지와 이미지를 채널에서 지워요." }
      )
  ),
];

const fetchImageArrayBuffer = async (url) => {
  const signal = AbortSignal.timeout?.(numberEnv("NATSUMI_IMAGE_FETCH_TIMEOUT_MS", 12_000, { min: 3_000, max: 30_000 }));
  const response = await fetch(url, signal ? { signal } : undefined);
  if (!response.ok) throw new Error(`source image fetch failed ${response.status}`);
  return response.arrayBuffer();
};

const downscaleImageForAi = async (arrayBuffer, image) => {
  const source = Buffer.from(arrayBuffer);
  const width = Number(image?.width || 0);
  const height = Number(image?.height || 0);
  const maxSide = Math.max(width, height);

  if (source.byteLength <= MAX_INLINE_IMAGE_BYTES && (!maxSide || maxSide <= MAX_INLINE_IMAGE_SIDE)) {
    return { data: source.toString("base64"), mimeType: image.contentType || "image/png" };
  }

  const loaded = await loadImage(source);
  const scale = Math.min(1, MAX_INLINE_IMAGE_SIDE / Math.max(loaded.width, loaded.height));
  const targetWidth = Math.max(1, Math.round(loaded.width * scale));
  const targetHeight = Math.max(1, Math.round(loaded.height * scale));
  const canvas = createCanvas(targetWidth, targetHeight);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(loaded, 0, 0, targetWidth, targetHeight);
  const buffer = canvas.toBuffer("image/jpeg", 82);
  return { data: buffer.toString("base64"), mimeType: "image/jpeg" };
};

const imageUrlToInlineData = async (image) => {
  if (!image?.url) return null;
  const arrayBuffer = await fetchImageArrayBuffer(image.url);
  const { data, mimeType } = await downscaleImageForAi(arrayBuffer, image);
  return { inlineData: { mimeType, data } };
};

export const createNanoBananaImage = async ({ prompt, image, index = 1, total = 1 }) => {
  const ai = getGoogleImageClient();
  if (!ai) return null;

  const model = getImageModelName();
  const finalPrompt = [
    "You are Natsumi's fast image generation worker.",
    "Return one complete safe anime-style image as quickly as possible.",
    `This is variation ${index} of ${total}. Make it visually distinct but keep the same prompt.`,
    prompt || "Create a cute polished anime-style image.",
  ].join("\n");

  const parts = [{ text: finalPrompt }];
  const imagePart = await imageUrlToInlineData(image);
  if (imagePart) parts.push(imagePart);

  const response = await Promise.race([
    ai.models.generateContent({ model, contents: [{ role: "user", parts }], config: { responseModalities: [Modality.TEXT, Modality.IMAGE] } }),
    new Promise((_, reject) => setTimeout(() => reject(new Error("IMAGE_MODEL_TIMEOUT")), IMAGE_MODEL_TIMEOUT_MS)),
  ]);

  const responseParts = response?.candidates?.[0]?.content?.parts || response?.parts || [];
  const text = responseParts.find((part) => part.text)?.text || "이미지가 완성됐어요.";
  const imageData = responseParts.find((part) => part.inlineData?.data)?.inlineData;
  if (!imageData?.data) return { text, attachment: null };

  const extension = imageData.mimeType?.includes("jpeg") ? "jpg" : "png";
  const buffer = Buffer.from(imageData.data, "base64");
  return { text, attachment: new AttachmentBuilder(buffer, { name: `natsumi-image-${Date.now()}-${index}.${extension}` }) };
};

const requestImageGenerationFallback = async ({ prompt, imageUrl, userId, channelId, count }) => {
  const endpoint = cleanEnv(process.env.NATSUMI_IMAGE_API_URL);
  if (!endpoint) return null;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(process.env.NATSUMI_IMAGE_API_TOKEN ? { Authorization: `Bearer ${process.env.NATSUMI_IMAGE_API_TOKEN}` } : {}) },
    body: JSON.stringify({ prompt, imageUrl, userId, channelId, count, timeoutMs: IMAGE_MODEL_TIMEOUT_MS }),
  });
  if (!response.ok) throw new Error(`image api ${response.status}`);
  return response.json();
};

export const requestFastPublicImageFallback = async ({ prompt, index = 1 }) => {
  const fallbackPrompt = [prompt || "cute polished anime-style illustration", `variation ${index}`, "clean composition, no text, no watermark"].join(", ").slice(0, 1200);
  const url = new URL(`https://image.pollinations.ai/prompt/${encodeURIComponent(fallbackPrompt)}`);
  url.searchParams.set("width", "768");
  url.searchParams.set("height", "768");
  url.searchParams.set("nologo", "true");
  url.searchParams.set("enhance", "true");
  url.searchParams.set("safe", "true");
  url.searchParams.set("seed", `${Date.now() + index}`);

  const signal = AbortSignal.timeout?.(numberEnv("NATSUMI_IMAGE_PUBLIC_FALLBACK_TIMEOUT_MS", 45_000, { min: 10_000, max: 90_000 }));
  const response = await fetch(url, signal ? { signal } : undefined);
  if (!response.ok) throw new Error(`public image fallback ${response.status}`);
  const contentType = response.headers.get("content-type") || "image/jpeg";
  if (!contentType.startsWith("image/")) throw new Error("public image fallback did not return image");
  const buffer = Buffer.from(await response.arrayBuffer());
  const extension = contentType.includes("png") ? "png" : "jpg";
  return { text: "대체 이미지 생성 경로로 완성했어요.", attachment: new AttachmentBuilder(buffer, { name: `natsumi-fast-image-${Date.now()}-${index}.${extension}` }) };
};

const editProgress = async (waitMessage, content) => {
  if (!waitMessage) return;
  await waitMessage.edit({ content, components: [] }).catch(() => {});
};

const fallbackUrls = (fallback) => {
  if (!fallback) return [];
  if (Array.isArray(fallback.images)) return fallback.images.map((item) => item.imageUrl || item.url || item).filter(Boolean);
  if (Array.isArray(fallback.imageUrls)) return fallback.imageUrls.filter(Boolean);
  if (fallback.imageUrl) return [fallback.imageUrl];
  return [];
};

export const runNatsumiImageGeneration = async ({ message, prompt, image, statusMessage = null }) => {
  const targetCount = getRequestedCount(prompt || message.content || "");
  const startedAt = Date.now();
  const waitMessage = statusMessage || await message.reply({ content: `그림 생성 시작: 0/${targetCount}장`, allowedMentions: { repliedUser: false } }).catch(() => null);
  const files = [];
  const notes = [];

  for (let index = 1; index <= targetCount; index += 1) {
    await editProgress(waitMessage, `그림 생성 중: ${index - 1}/${targetCount}장\n${index}번째 그림을 만들고 있어.`);
    let result = null;
    try {
      result = await createNanoBananaImage({ prompt, image, index, total: targetCount });
    } catch (error) {
      if (error.message !== "IMAGE_MODEL_TIMEOUT") console.warn("[NatsumiImage] nano failed:", summarizeError(error));
    }
    if (!result?.attachment) {
      result = await requestFastPublicImageFallback({ prompt, index }).catch((error) => {
        console.warn("[NatsumiImage] public fallback failed:", summarizeError(error));
        return null;
      });
    }
    if (result?.attachment) {
      files.push(result.attachment);
      if (result.text) notes.push(result.text.slice(0, 120));
    }
  }

  if (files.length === 0) {
    const fallback = await requestImageGenerationFallback({ prompt, imageUrl: image?.url || null, userId: message.author.id, channelId: message.channel.id, count: targetCount }).catch((error) => {
      console.warn("[NatsumiImage] fallback failed:", summarizeError(error));
      return null;
    });
    const urls = fallbackUrls(fallback).slice(0, targetCount);
    if (urls.length > 0) return waitMessage?.edit({ content: [`그림 생성 완료: ${urls.length}/${targetCount}장`, ...urls].join("\n"), components: buildImageResultActionRow(message.author.id) });
  }

  const elapsed = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
  if (files.length > 0) {
    return waitMessage?.edit({ content: [`그림 생성 완료: ${files.length}/${targetCount}장`, `걸린 시간: ${elapsed}초`, notes[0] || "완성됐어요."].join("\n"), files, components: buildImageResultActionRow(message.author.id) });
  }

  return waitMessage?.edit({ content: "이미지를 만들지 못했어요. API 키, 모델명, 안전 필터를 확인해주세요.", components: [] });
};
