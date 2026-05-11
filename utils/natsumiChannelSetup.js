import { ChannelType, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import NatsumiGuildSetup from "../models/NatsumiGuildSetup.js";

const textChannels = [
  {
    key: "aiChat",
    name: "🤖｜AI채팅",
    topic: "나츠미 호출어로 AI 대화를 나누는 채널이야. 일반 채널에서는 호출어가 기본으로 막혀 😤",
    title: "카미봇 AI 채팅 채널",
    description: [
      "이곳에서 AI 나츠미와 채팅으로 대화하실 수 있어요!",
      "",
      "봇에게 답장해서 이전 내용의 질문을 이어가고, 점(.)으로 시작하는 메시지로 답장하지 않게 하면 돼요.",
      "봇이 말한 메시지에서 `답장`을 누르면 이전 대화를 기억해요.",
      "",
      "예시:",
      "`나츠미 바닷가에서 커피 마시는 소녀 그림 설명해줘`",
      "`나츠미 이번 주 서버에서 무슨 일이 많았어?`",
      "`나츠미 잡담 채널 슬로우모드 5초로 바꿔줘`",
    ].join("\n"),
  },
  {
    key: "aiImage",
    name: "🎨｜AI그림",
    topic: "AI 그림 기능 안내 채널이야. 사진 변환, 프롬프트, 이미지 생성 안내에 사용해.",
    title: "카미봇으로 그림 만들기",
    description: [
      "세 가지 방법으로 그림을 만들 수 있어요!",
      "",
      "1. 사진을 올리고 AI로 변환하기",
      "이 채널에 사진을 올리고 원하는 스타일을 적어보세요.",
      "",
      "2. AI채팅의 카미봇에게 그려달라고 하기",
      "예: `나츠미 귀여운 러스크가 바닷가에서 웃는 그림 그려줘`",
      "",
      "3. 전문가용 프롬프트 사용",
      "예: `/sd 키: 1girl 키: long hair` 처럼 키워드 기반으로 사용할 수 있어요.",
      "",
      "고급 기능: 키, 이미지 개수, 시드, 스텝, 해상도 등을 설정할 수 있어요.",
    ].join("\n"),
  },
  {
    key: "emoji",
    name: "😀｜이모지-추가하기",
    topic: "이미지를 올리면 서버 이모지로 등록하는 채널이야.",
    title: "이모지를 추가해보자!",
    description: [
      "여기서 누구나 새로운 이모지를 서버에 추가할 수 있어요.",
      "업로드된 이미지는 128x128 정사각형 PNG로 정리해서 등록해볼게요.",
      "",
      "사용법:",
      "• 사진을 첨부하고 메시지에는 이모지 이름을 적어주세요. 필수예요.",
      "• 사진과 메시지를 한 번에 보내주세요.",
      "• 이모지 이름은 영어, 숫자, 밑줄만 사용할 수 있어요.",
    ].join("\n"),
  },
  {
    key: "secret",
    name: "🤫｜비밀채팅",
    topic: "15초 뒤 메시지를 지우는 비밀 대화 채널이야.",
    title: "비밀 채팅에 오신 걸 환영합니다!",
    description: [
      "여기에 말하는 내용은 15초 뒤에 전부 사라져요.",
      "채널 알림을 켜 두시면 비밀 대화에 참여하실 수 있을지도...! 😅",
    ].join("\n"),
  },
  {
    key: "anonymous",
    name: "🤫｜익명채팅",
    topic: "익명 닉네임으로 대화하는 채널이야.",
    title: "익명으로 대화해 보세요! 🤫",
    description: [
      "여기에 대화하면 익명 닉네임으로 대화할 수 있어요.",
      "원본 메시지는 지워지고 나츠미가 익명 메시지로 다시 보내줘요.",
    ].join("\n"),
  },
  {
    key: "chat",
    name: "💬｜잡담",
    topic: "자유롭게 이야기하는 채널이야.",
    title: "잡담 채널",
    description: [
      "카미봇의 특별한 기능 채널은 아니지만, 서버 세팅상 하나 만들어 드렸어요.",
      "자유롭게 이야기 나눠 보세요 😊",
    ].join("\n"),
  },
];

const voiceChannels = [
  { key: "tts", name: "📢｜TTS" },
  { key: "tempVoice", name: "🔊｜새 음성 채널" },
];

const sendGuide = async (channel, item) => {
  const embed = new EmbedBuilder()
    .setColor("#ff7aa8")
    .setTitle(item.title)
    .setDescription(item.description)
    .setTimestamp();

  const message = await channel.send({ embeds: [embed] }).catch(() => null);
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
    name: "카미봇 기능 채널",
    type: ChannelType.GuildCategory,
    permissionOverwrites: baseOverwrites,
    reason: "나츠미 자동 채널 구성",
  });

  const voiceCategory = await guild.channels.create({
    name: "카미봇 음성 채널",
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
    .setTitle("🦊 나츠미 채널 자동 구성")
    .setDescription([
      "반가워요! 저는 나츠미예요.",
      "`/도움말` 명령어에 자세한 설명이 있어요.",
      "`/나츠미 자동셋업`을 쓰면 카미봇처럼 예쁜 채널 구성을 자동으로 만들어줄게요.",
      "",
      "생성되는 채널:",
      "🤖 AI채팅 · 🎨 AI그림 · 😀 이모지 · 🤫 비밀채팅 · 🤐 익명채팅 · 💬 잡담 · 📢 TTS",
    ].join("\n"))
    .setFooter({ text: "나츠미가 알아서 척척 정리해줄게. 흥, 특별히야!" })
    .setTimestamp();
};
