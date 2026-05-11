import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  PermissionFlagsBits,
} from "discord.js";
import NatsumiGuildSetup from "../models/NatsumiGuildSetup.js";

const textChannels = [
  {
    key: "aiChat",
    name: "🦊｜나츠미-대화방",
    topic: "나츠미 호출어로만 AI 대화가 동작하는 전용 채널이야. 일반 채널은 기본적으로 막혀 😤",
    title: "🦊 나츠미 AI 대화방",
    description: [
      "여기서는 `나츠미`, `츠미야`, `나츠` 같은 호출어로 나츠미와 대화할 수 있어.",
      "일반 채널에서는 호출어가 기본적으로 막혀 있으니까, 아무 데서나 부르지 말라구 😤",
      "",
      "사용 예시",
      "`나츠미 오늘 서버 상태 어때?`",
      "`츠미야 잡담 채널 슬로우모드 5초로 바꿔줘`",
      "`나츠미 귀여운 여우귀 소녀 그림 프롬프트 만들어줘`",
      "",
      "관리자 전용 예시",
      "`나츠미 관리자모드 일반채팅 켜줘`",
      "`나츠미 관리자모드 잡담 슬로우모드 5초로 바꿔줘`",
    ].join("\n"),
  },
  {
    key: "aiImage",
    name: "🎨｜나츠미-그림공방",
    topic: "나노 바나나 기반 AI 그림 생성 채널이야. 프롬프트나 이미지를 올려봐.",
    title: "🎨 나츠미 그림공방",
    description: [
      "여기는 그림을 만드는 전용 채널이야.",
      "프롬프트만 적어도 되고, 이미지를 같이 올려서 변환 요청을 해도 돼.",
      "",
      "사용 예시",
      "`여우귀 여고생이 밤하늘 아래에서 웃는 애니풍 일러스트`",
      "`이 사진을 귀여운 나츠미풍 프로필 이미지로 바꿔줘`",
      "",
      "구글 나노 바나나 계열 이미지 모델을 먼저 사용하고, 실패하면 fallback API를 사용해.",
    ].join("\n"),
  },
  {
    key: "emoji",
    name: "🪄｜이모지-정제소",
    topic: "이미지를 올리면 나츠미가 128x128 PNG로 정리해서 서버 이모지로 등록해줘.",
    title: "🪄 나츠미 이모지 정제소",
    description: [
      "사진을 올리고 메시지에는 이모지 이름을 적어줘.",
      "나츠미가 이미지를 128x128 정사각형 PNG로 정리해서 서버 이모지로 등록해볼게.",
      "",
      "사용법",
      "1. 이미지 첨부",
      "2. 메시지에 이모지 이름 입력",
      "3. 전송",
      "",
      "이모지 이름은 영어, 숫자, 밑줄만 안전하게 사용할 수 있어.",
      "봇에게 `이모지 및 스티커 관리` 권한이 필요해 😤",
    ].join("\n"),
  },
  {
    key: "secret",
    name: "🌙｜비밀-속삭임",
    topic: "메시지가 잠시 뒤 사라지는 비밀 채팅 채널이야.",
    title: "🌙 나츠미 비밀 속삭임",
    description: [
      "여기에 적은 메시지는 일정 시간이 지나면 사라져.",
      "기본값은 15초야. 너무 오래 남기면 비밀이 아니잖아, 바보야 😤",
      "",
      "주의: 완전한 보안 채널은 아니니까 민감한 개인정보는 올리지 마.",
    ].join("\n"),
  },
  {
    key: "anonymous",
    name: "🎭｜익명-가면방",
    topic: "버튼이나 일반 메시지로 익명 메시지를 보낼 수 있는 채널이야.",
    title: "🎭 나츠미 익명 가면방",
    description: [
      "여기서는 익명으로 메시지를 보낼 수 있어.",
      "아래 버튼을 누르면 모달로 익명 메시지를 작성할 수 있고, 일반 메시지를 보내도 나츠미가 익명 임베드로 바꿔줘.",
      "",
      "원본 메시지는 가능한 경우 삭제하고, 익명 이름으로 다시 보내서 가면을 유지해줄게 😼",
      "그래도 규칙 위반은 관리자에게 들킬 수 있으니까 착각하지 마.",
    ].join("\n"),
    button: true,
  },
  {
    key: "chat",
    name: "🍵｜여우찻집",
    topic: "서버 사람들이 자유롭게 이야기하는 일반 잡담 채널이야.",
    title: "🍵 나츠미 여우찻집",
    description: [
      "여기는 편하게 이야기하는 잡담 채널이야.",
      "나츠미 호출어는 기본적으로 AI채팅 채널에서만 동작해.",
      "일반 채널에서도 호출어를 쓰려면 `/나츠미서버셋업 일반채팅 켜기`를 사용해줘.",
    ].join("\n"),
  },
];

const voiceChannels = [
  { key: "tts", name: "📢｜여우-TTS" },
  { key: "tempVoice", name: "🔊｜새-음성방" },
];

const buildGuideComponents = (item) => {
  if (item.key !== "anonymous") return [];

  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("NatsumiAnon_open")
        .setLabel("익명 메시지 쓰기")
        .setEmoji("🎭")
        .setStyle(ButtonStyle.Primary)
    ),
  ];
};

const sendGuide = async (channel, item) => {
  const embed = new EmbedBuilder()
    .setColor("#ff7aa8")
    .setTitle(item.title)
    .setDescription(item.description)
    .setTimestamp();

  const message = await channel.send({
    embeds: [embed],
    components: buildGuideComponents(item),
  }).catch(() => null);

  if (message) await message.pin().catch(() => {});
};

export const createNatsumiChannels = async (guild, userId = null) => {
  const existing = await NatsumiGuildSetup.findOne({ guildId: guild.id }).lean();
  if (existing?.featureCategoryId) {
    const category = await guild.channels.fetch(existing.featureCategoryId).catch(() => null);
    if (category) return { already: true, setup: existing };
  }

  const everyone = guild.roles.everyone;
  const botMember = guild.members.me || await guild.members.fetchMe().catch(() => null);

  const baseOverwrites = [
    { id: everyone.id, allow: [PermissionFlagsBits.ViewChannel] },
  ];

  if (botMember) {
    baseOverwrites.push({
      id: botMember.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.ManageMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.EmbedLinks,
        PermissionFlagsBits.AttachFiles,
      ],
    });
  }

  const featureCategory = await guild.channels.create({
    name: "🦊 나츠미 기능 여우굴",
    type: ChannelType.GuildCategory,
    permissionOverwrites: baseOverwrites,
    reason: "나츠미 자동 채널 구성",
  });

  const voiceCategory = await guild.channels.create({
    name: "🎙️ 나츠미 음성 여우굴",
    type: ChannelType.GuildCategory,
    permissionOverwrites: baseOverwrites,
    reason: "나츠미 자동 음성 채널 구성",
  });

  const createdText = [];
  const aiChannelIds = [];
  const featureChannels = {};

  for (const item of textChannels) {
    const channel = await guild.channels.create({
      name: item.name,
      type: ChannelType.GuildText,
      parent: featureCategory.id,
      topic: item.topic,
      reason: "나츠미 자동 채널 구성",
    });

    createdText.push(channel.id);
    featureChannels[item.key] = channel.id;
    if (item.key === "aiChat") aiChannelIds.push(channel.id);
    await sendGuide(channel, item);
  }

  const createdVoice = [];
  for (const item of voiceChannels) {
    const channel = await guild.channels.create({
      name: item.name,
      type: ChannelType.GuildVoice,
      parent: voiceCategory.id,
      reason: "나츠미 자동 음성 채널 구성",
    });
    createdVoice.push(channel.id);
    featureChannels[item.key] = channel.id;
  }

  const setup = await NatsumiGuildSetup.findOneAndUpdate(
    { guildId: guild.id },
    {
      guildId: guild.id,
      featureCategoryId: featureCategory.id,
      voiceCategoryId: voiceCategory.id,
      aiChannelIds,
      textChannelIds: createdText,
      voiceChannelIds: createdVoice,
      featureChannels,
      setupBy: userId,
      setupAt: new Date(),
    },
    { upsert: true, new: true }
  );

  return { already: false, setup };
};

export const buildNatsumiSetupEmbed = () => {
  return new EmbedBuilder()
    .setColor("#ff7aa8")
    .setTitle("🦊 나츠미 서버 자동셋업")
    .setDescription([
      "`/나츠미서버셋업 자동셋업`을 쓰면 나츠미 전용 채널 구성을 자동으로 만들어줄게.",
      "",
      "생성되는 채널:",
      "🦊 AI대화방 · 🎨 그림공방 · 🪄 이모지 정제소 · 🌙 비밀 속삭임 · 🎭 익명 가면방 · 🍵 여우찻집 · 📢 TTS",
      "",
      "AI 호출어는 기본적으로 AI대화방에서만 동작해. 일반 채널에서도 쓰려면 설정을 켜야 해 😤",
    ].join("\n"))
    .setFooter({ text: "나츠미가 알아서 척척 정리해줄게. 흥, 특별히야!" })
    .setTimestamp();
};
