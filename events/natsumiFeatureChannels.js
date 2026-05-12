import { ActionRowBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, Events, PermissionFlagsBits } from "discord.js";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { GoogleGenAI, Modality } from "@google/genai";
import NatsumiGuildSetup from "../models/NatsumiGuildSetup.js";
import ProcessedMessage from "../models/ProcessedMessage.js";
import {
  buildEmojiChoiceRow,
  createEmojiFromMessage,
  getFirstEmojiImage,
  shouldAskEmojiResize,
} from "../utils/natsumiEmoji.js";
import { buildAiImageActionRows, runNatsumiImageGeneration } from "../utils/natsumiAiImage.js";

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

const markProcessed = async (message) => {
  await ProcessedMessage.findOneAndUpdate(
    { messageId: message.id },
    { $setOnInsert: { messageId: message.id, processedAt: new Date() } },
    { upsert: true, new: false }
  ).catch(() => {});
};

const getFirstImage = (message) => {
  return message.attachments.find((file) => {
    const type = file.contentType || "";
    const name = file.name || "";
    return type.startsWith("image/") || /\.(png|jpe?g|webp|gif)$/i.test(name);
  });
};

const getChannelFeatureKey = (channel, setup) => {
  const channels = setup?.featureChannels || {};
  for (const [key, id] of Object.entries(channels)) {
    if (id && id === channel.id) return key;
  }

  const name = String(channel.name || "").replace(/\s+/g, "").toLowerCase();

  if (name.includes("비밀") || name.includes("secret") || name.includes("속삭임")) return "secret";
  if (name.includes("익명") || name.includes("anonymous") || name.includes("가면")) return "anonymous";
  if (name.includes("그림") || name.includes("image") || name.includes("공방")) return "aiImage";
  if (name.includes("ai채팅") || name.includes("나츠미-대화") || name.includes("대화방")) return "aiChat";
  return null;
};

const sanitizeEmojiName = (value) => {
  const cleaned = String(value || "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 32);

  return cleaned || `natsumi_${Date.now().toString(36)}`;
};

const buildEmojiBuffer = async (url) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`image fetch failed ${response.status}`);

  const arrayBuffer = await response.arrayBuffer();
  const image = await loadImage(Buffer.from(arrayBuffer));
  const size = 128;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, size, size);

  const scale = Math.max(size / image.width, size / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  const x = (size - width) / 2;
  const y = (size - height) / 2;

  ctx.drawImage(image, x, y, width, height);
  return canvas.toBuffer("image/png");
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
    "너는 나츠미 봇의 이미지 생성 엔진이야.",
    "요청을 귀엽고 선명한 애니풍 이미지로 만들어줘.",
    "부적절하거나 안전하지 않은 요청은 안전한 방향으로 순화해줘.",
    prompt || "귀여운 여우귀 소녀 캐릭터를 예쁘게 그려줘.",
  ].join("\n");

  const parts = [{ text: finalPrompt }];
  const imagePart = await imageUrlToInlineData(image);
  if (imagePart) parts.push(imagePart);

  const response = await ai.models.generateContent({
    model,
    contents: [{ role: "user", parts }],
    config: {
      responseModalities: [Modality.TEXT, Modality.IMAGE],
    },
  });

  const responseParts = response?.candidates?.[0]?.content?.parts || response?.parts || [];
  const text = responseParts.find((part) => part.text)?.text || "나츠미가 그림을 완성했어.";
  const imageData = responseParts.find((part) => part.inlineData?.data)?.inlineData;

  if (!imageData?.data) return { text, attachment: null };

  const extension = imageData.mimeType?.includes("jpeg") ? "jpg" : "png";
  const buffer = Buffer.from(imageData.data, "base64");
  const attachment = new AttachmentBuilder(buffer, { name: `natsumi-image.${extension}` });

  return { text, attachment };
};

const handleEmojiChannel = async (message) => {
  const image = getFirstEmojiImage(message);
  if (!image) {
    await message.reply({
      content: "이미지를 첨부하고, 메시지에는 이모지 이름을 적어줘. 이름은 영어/숫자/밑줄만 가능해 😤",
      allowedMentions: { repliedUser: false },
    }).catch(() => {});
    return true;
  }

  const botMember = message.guild.members.me || await message.guild.members.fetchMe().catch(() => null);
  const canManageEmoji = botMember?.permissions?.has(PermissionFlagsBits.ManageGuildExpressions);

  if (!canManageEmoji) {
    await message.reply({
      content: "나한테 `이모지 및 스티커 관리` 권한이 없어. 권한부터 줘야 이모지를 등록할 수 있거든 😭",
      allowedMentions: { repliedUser: false },
    }).catch(() => {});
    return true;
  }

  await message.channel.sendTyping().catch(() => {});

  try {
    if (await shouldAskEmojiResize(image)) {
      await message.reply({
        content: "올려준 이미지는 가로와 세로 길이가 달라요. 이모지로 쓰기 좋게 처리 방법을 골라주세요.",
        components: buildEmojiChoiceRow(message.id),
        allowedMentions: { repliedUser: false },
      }).catch(() => {});
      return true;
    }

    const emoji = await createEmojiFromMessage({
      message,
      mode: "crop",
      actorTag: message.author.tag,
    });

    await message.reply({
      content: `✅ 이모지 등록 완료! ${emoji}\n이름: \`${emoji.name}\``,
      allowedMentions: { repliedUser: false },
    }).catch(() => {});
    await message.delete().catch(() => {});
  } catch (error) {
    console.error("[NatsumiEmoji] failed:", error);
    await message.reply({
      content: "이모지 등록에 실패했어. GIF는 첫 프레임만 처리될 수 있어. 이미지 크기, 서버 이모지 슬롯, 내 권한을 확인해줘 😭",
      allowedMentions: { repliedUser: false },
    }).catch(() => {});
  }

  return true;
};

const handleSecretChannel = async (message) => {
  const rawDeleteMs = Number(process.env.NATSUMI_SECRET_DELETE_MS || 15_000);
  const deleteMs = rawDeleteMs > 0 && rawDeleteMs < 1000 ? rawDeleteMs * 1000 : rawDeleteMs;
  setTimeout(() => {
    message.delete().catch(() => {});
  }, deleteMs);
  return true;
};

const anonymousNames = ["유동 여우", "가면 쓴 손님", "달빛 그림자", "익명 꼬리", "무명 손님", "비밀 목소리"];
const randomAnonId = () => Math.floor(1000 + Math.random() * 9000);
const randomAnonName = () => `${anonymousNames[Math.floor(Math.random() * anonymousNames.length)]}#${randomAnonId()}`;

const buildAnonButtons = () => [
  new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("NatsumiAnon_open")
      .setLabel("새 메시지 작성")
      .setEmoji("🎭")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("NatsumiAnon_shuffle")
      .setLabel("유동 ID 초기화")
      .setEmoji("🌀")
      .setStyle(ButtonStyle.Secondary)
  ),
];

const sendAnonymousMessage = async (channel, content, imageUrl = null) => {
  const embed = new EmbedBuilder()
    .setColor("#ff7aa8")
    .setAuthor({ name: randomAnonName() })
    .setDescription(content || "첨부 이미지")
    .setFooter({ text: "나츠미 익명 가면방 · 실제 IP가 아닌 유동 익명 ID입니다" })
    .setTimestamp();

  if (imageUrl) embed.setImage(imageUrl);
  return channel.send({ embeds: [embed], components: buildAnonButtons() }).catch(() => null);
};

const handleAnonymousChannel = async (message) => {
  const content = message.content?.trim();
  const image = getFirstImage(message);

  if (!content && !image) return false;

  await message.delete().catch(() => {});
  await sendAnonymousMessage(message.channel, content, image?.url || null);
  return true;
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

const handleAiImageChannel = async (message) => {
  const prompt = message.content?.trim();
  const image = getFirstImage(message);

  if (!prompt && !image) return false;
  await message.channel.sendTyping().catch(() => {});

  if (image && !prompt) {
    await message.reply({
      content: `${image.name || "첨부 이미지"} (${image.width || "?"}x${image.height || "?"}, ${Math.round((image.size || 0) / 1024)}KB)\n이 파일로 어떤 작업을 할까요?`,
      components: buildAiImageActionRows(message.id),
      allowedMentions: { repliedUser: false },
    }).catch(() => {});
    return true;
  }

  const waitMessage = await message.reply({
    content: "🎨 그림 요청을 받았어. 나노 바나나한테 슬쩍 부탁해볼게... 잠깐만 기다려 😤",
    allowedMentions: { repliedUser: false },
  }).catch(() => null);

  try {
    await runNatsumiImageGeneration({ message, prompt, image, statusMessage: waitMessage });
    return true;

    const nanoResult = await createNanoBananaImage({ prompt, image });

    if (nanoResult?.attachment) {
      const embed = new EmbedBuilder()
        .setColor("#ff7aa8")
        .setTitle("🎨 나츠미 그림 생성 완료")
        .setDescription(nanoResult.text?.slice(0, 1500) || prompt || "나노 바나나로 그림을 만들었어.")
        .setImage(`attachment://${nanoResult.attachment.name}`)
        .setTimestamp();

      await waitMessage?.edit({ content: "", embeds: [embed], files: [nanoResult.attachment] }).catch(async () => {
        await message.reply({ embeds: [embed], files: [nanoResult.attachment], allowedMentions: { repliedUser: false } }).catch(() => {});
      });
      return true;
    }

    const fallback = await requestImageGenerationFallback({
      prompt,
      imageUrl: image?.url || null,
      userId: message.author.id,
      channelId: message.channel.id,
    });

    if (fallback?.imageUrl) {
      const embed = new EmbedBuilder()
        .setColor("#ff7aa8")
        .setTitle("🎨 나츠미 그림 생성 완료")
        .setDescription(prompt || "첨부 이미지를 기반으로 생성했어.")
        .setImage(fallback.imageUrl)
        .setTimestamp();
      await waitMessage?.edit({ content: "", embeds: [embed] }).catch(() => {});
      return true;
    }

    await waitMessage?.edit({
      content: [
        "🎨 그림 요청은 받았어!",
        "구글 나노 바나나를 쓰려면 `NATSUMI_IMAGE_API_KEY` 또는 `GEMINI_API_KEY`가 필요해.",
        "모델 기본값은 `gemini-2.5-flash-image-preview`로 잡아놨어.",
      ].join("\n"),
    }).catch(() => {});
  } catch (error) {
    console.error("[NatsumiImage] failed:", error);
    await waitMessage?.edit({ content: "그림 생성 요청 중 오류가 났어. API 키, 모델명, 이미지 안전 필터를 확인해줘 😭" }).catch(() => {});
  }

  return true;
};

export default {
  name: Events.MessageCreate,
  async execute(message) {
    if (!message.guild || message.author.bot) return;

    const setup = await NatsumiGuildSetup.findOne({ guildId: message.guild.id }).lean().catch(() => null);
    const featureKey = getChannelFeatureKey(message.channel, setup);
    if (!featureKey) return;

    let handled = false;

    if (featureKey === "emoji") handled = await handleEmojiChannel(message);
    else if (featureKey === "secret") handled = await handleSecretChannel(message);
    else if (featureKey === "anonymous") handled = await handleAnonymousChannel(message);
    else if (featureKey === "aiImage") handled = await handleAiImageChannel(message);

    if (handled) await markProcessed(message);
  },
};
