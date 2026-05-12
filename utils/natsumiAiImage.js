import { ActionRowBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { GoogleGenAI, Modality } from "@google/genai";

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

export const buildAiImageActionRows = (messageId) => [
  new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`NatsumiImage_convert_${messageId}`)
      .setLabel("AI그림으로 변환")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`NatsumiImage_custom_${messageId}`)
      .setLabel("AI그림 사용자 지정")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`NatsumiImage_cancel_${messageId}`)
      .setLabel("취소")
      .setStyle(ButtonStyle.Danger)
  ),
  new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`NatsumiImage_resolution_1080_${messageId}`)
      .setLabel("1080p")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`NatsumiImage_resolution_1440_${messageId}`)
      .setLabel("1440p")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`NatsumiImage_resolution_2160_${messageId}`)
      .setLabel("2160p")
      .setStyle(ButtonStyle.Secondary)
  ),
];

export const buildImagePrompt = ({
  prompt = "",
  negative = "",
  similarity = "",
  resolution = "",
} = {}) => {
  const parts = [
    prompt.trim() || "Convert the attached image into a polished anime-style image while preserving the main subject.",
  ];

  if (similarity) parts.push(`Similarity to original image: ${similarity}%.`);
  if (resolution) parts.push(`Target output resolution long side: ${resolution}p.`);
  if (negative.trim()) parts.push(`Negative prompt, avoid these keywords: ${negative.trim()}.`);
  return parts.join("\n");
};

const imageUrlToInlineData = async (image) => {
  if (!image?.url) return null;

  const response = await fetch(image.url);
  if (!response.ok) throw new Error(`source image fetch failed ${response.status}`);

  const arrayBuffer = await response.arrayBuffer();
  const data = Buffer.from(arrayBuffer).toString("base64");
  const mimeType = image.contentType || "image/png";
  return { inlineData: { mimeType, data } };
};

const createNanoBananaImage = async ({ prompt, image }) => {
  const ai = getGoogleImageClient();
  if (!ai) return null;

  const model = cleanEnv(process.env.NATSUMI_IMAGE_MODEL) || "gemini-2.5-flash-image-preview";
  const finalPrompt = [
    "You are Natsumi's image generation engine.",
    "Transform or generate a polished image from the user's prompt and attachment.",
    "Keep it safe and avoid sexual content involving minors or non-consensual themes.",
    prompt || "Convert the attached image into a cute anime-style illustration while preserving the main subject.",
  ].join("\n");

  const parts = [{ text: finalPrompt }];
  const imagePart = await imageUrlToInlineData(image);
  if (imagePart) parts.push(imagePart);

  const response = await ai.models.generateContent({
    model,
    contents: [{ role: "user", parts }],
    config: { responseModalities: [Modality.TEXT, Modality.IMAGE] },
  });

  const responseParts = response?.candidates?.[0]?.content?.parts || response?.parts || [];
  const text = responseParts.find((part) => part.text)?.text || "이미지가 완성됐어요.";
  const imageData = responseParts.find((part) => part.inlineData?.data)?.inlineData;

  if (!imageData?.data) return { text, attachment: null };

  const extension = imageData.mimeType?.includes("jpeg") ? "jpg" : "png";
  const buffer = Buffer.from(imageData.data, "base64");
  return {
    text,
    attachment: new AttachmentBuilder(buffer, { name: `natsumi-image.${extension}` }),
  };
};

const requestImageGenerationFallback = async ({ prompt, imageUrl, userId, channelId }) => {
  const endpoint = cleanEnv(process.env.NATSUMI_IMAGE_API_URL);
  if (!endpoint) return null;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.NATSUMI_IMAGE_API_TOKEN ? { Authorization: `Bearer ${process.env.NATSUMI_IMAGE_API_TOKEN}` } : {}),
    },
    body: JSON.stringify({ prompt, imageUrl, userId, channelId }),
  });

  if (!response.ok) throw new Error(`image api ${response.status}`);
  return response.json();
};

export const runNatsumiImageGeneration = async ({ message, prompt, image, statusMessage = null }) => {
  const waitMessage = statusMessage || await message.reply({
    content: "그림 요청 받았어요. 나노바나나로 처리해볼게요.",
    allowedMentions: { repliedUser: false },
  }).catch(() => null);

  let thinkingTimer = null;
  if (waitMessage) {
    thinkingTimer = setTimeout(() => {
      waitMessage.edit({
        content: "생각하는 시간이 조금 길어지고 있어요. 이미지 모델이 아직 처리 중이라 그대로 기다려볼게요.",
        components: [],
      }).catch(() => {});
    }, Number(process.env.NATSUMI_IMAGE_SLOW_NOTICE_MS || 25000));
  }

  const nanoResult = await createNanoBananaImage({ prompt, image });
  if (thinkingTimer) clearTimeout(thinkingTimer);
  if (nanoResult?.attachment) {
    return waitMessage?.edit({
      content: nanoResult.text?.slice(0, 1800) || "완성됐어요.",
      files: [nanoResult.attachment],
      components: [],
    });
  }

  const fallback = await requestImageGenerationFallback({
    prompt,
    imageUrl: image?.url || null,
    userId: message.author.id,
    channelId: message.channel.id,
  });

  if (fallback?.imageUrl) {
    return waitMessage?.edit({
      content: `${prompt || "이미지 변환"}\n${fallback.imageUrl}`,
      components: [],
    });
  }

  return waitMessage?.edit({
    content: "이미지 모델 키가 없거나 이미지 응답을 받지 못했어요. `NATSUMI_IMAGE_API_KEY` 또는 `GEMINI_API_KEY` 설정을 확인해주세요.",
    components: [],
  });
};
