import { AttachmentBuilder, EmbedBuilder, Events, PermissionFlagsBits } from "discord.js";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import NatsumiGuildSetup from "../models/NatsumiGuildSetup.js";
import ProcessedMessage from "../models/ProcessedMessage.js";

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

const handleEmojiChannel = async (message) => {
  const image = getFirstImage(message);
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
    const emojiName = sanitizeEmojiName(message.content);
    const buffer = await buildEmojiBuffer(image.url);
    const emoji = await message.guild.emojis.create({
      attachment: buffer,
      name: emojiName,
      reason: `나츠미 이모지 등록 요청: ${message.author.tag}`,
    });

    await message.reply({
      content: `✅ 이모지 등록 완료! ${emoji}\n이름: \`${emoji.name}\``,
      allowedMentions: { repliedUser: false },
    }).catch(() => {});
  } catch (error) {
    console.error("[NatsumiEmoji] failed:", error);
    await message.reply({
      content: "이모지 등록에 실패했어. 이미지 크기, 서버 이모지 슬롯, 내 권한을 확인해줘 😭",
      allowedMentions: { repliedUser: false },
    }).catch(() => {});
  }

  return true;
};

const handleSecretChannel = async (message) => {
  setTimeout(() => {
    message.delete().catch(() => {});
  }, Number(process.env.NATSUMI_SECRET_DELETE_MS || 15_000));
  return false;
};

const anonymousNames = ["익명의 여우", "수상한 그림자", "조용한 손님", "비밀의 목소리", "가면 쓴 유저"];

const handleAnonymousChannel = async (message) => {
  const content = message.content?.trim();
  const image = getFirstImage(message);

  if (!content && !image) return false;

  const name = anonymousNames[Math.floor(Math.random() * anonymousNames.length)];
  const embed = new EmbedBuilder()
    .setColor("#ff7aa8")
    .setAuthor({ name })
    .setDescription(content || "첨부 이미지")
    .setFooter({ text: "나츠미 익명 채팅" })
    .setTimestamp();

  if (image) embed.setImage(image.url);

  await message.delete().catch(() => {});
  await message.channel.send({ embeds: [embed] }).catch(() => {});
  return true;
};

const requestImageGeneration = async ({ prompt, imageUrl, userId, channelId }) => {
  const endpoint = process.env.NATSUMI_IMAGE_API_URL?.replace?.(/[\"']/g, "").trim();
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

  try {
    const result = await requestImageGeneration({
      prompt,
      imageUrl: image?.url || null,
      userId: message.author.id,
      channelId: message.channel.id,
    });

    if (result?.imageUrl) {
      const embed = new EmbedBuilder()
        .setColor("#ff7aa8")
        .setTitle("🎨 나츠미 그림 생성 완료")
        .setDescription(prompt || "첨부 이미지를 기반으로 생성했어.")
        .setImage(result.imageUrl)
        .setTimestamp();
      await message.reply({ embeds: [embed], allowedMentions: { repliedUser: false } }).catch(() => {});
      return true;
    }

    await message.reply({
      content: [
        "🎨 그림 요청을 받았어!",
        "아직 이미지 생성 API가 연결되지 않았으면 실제 그림 생성은 대기 상태야.",
        "환경변수 `NATSUMI_IMAGE_API_URL`을 연결하면 이 채널에서 바로 그림을 생성할 수 있어.",
      ].join("\n"),
      allowedMentions: { repliedUser: false },
    }).catch(() => {});
  } catch (error) {
    console.error("[NatsumiImage] failed:", error);
    await message.reply({
      content: "그림 생성 요청 중 오류가 났어. 이미지 API 상태를 확인해줘 😭",
      allowedMentions: { repliedUser: false },
    }).catch(() => {});
  }

  return true;
};

export default {
  name: Events.MessageCreate,
  async execute(message) {
    if (!message.guild || message.author.bot) return;

    const setup = await NatsumiGuildSetup.findOne({ guildId: message.guild.id }).lean().catch(() => null);
    const channels = setup?.featureChannels || {};
    if (!channels || Object.keys(channels).length === 0) return;

    let handled = false;

    if (message.channel.id === channels.emoji) handled = await handleEmojiChannel(message);
    else if (message.channel.id === channels.secret) handled = await handleSecretChannel(message);
    else if (message.channel.id === channels.anonymous) handled = await handleAnonymousChannel(message);
    else if (message.channel.id === channels.aiImage) handled = await handleAiImageChannel(message);

    if (handled) await markProcessed(message);
  },
};
