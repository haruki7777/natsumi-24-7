import { ChannelType, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import NatsumiGuildSetup from "../models/NatsumiGuildSetup.js";

const textChannels = [
  { name: "🤖｜AI채팅", topic: "나츠미 호출어로 AI 대화를 나누는 채널이야. 일반 채널에서는 호출어가 막혀 😤", ai: true },
  { name: "🎨｜AI그림", topic: "AI 그림 기능을 사용하는 채널이야." },
  { name: "😀｜이모지-추가하기", topic: "서버 이모지 추가 안내 채널이야." },
  { name: "🤫｜비밀채팅", topic: "비밀 대화용 채널이야." },
  { name: "🤐｜익명채팅", topic: "익명 채팅 기능용 채널이야." },
  { name: "💬｜잡담", topic: "자유롭게 이야기하는 채널이야." },
];

const voiceChannels = [
  { name: "📢｜TTS" },
  { name: "🔊｜새 음성 채널" },
];

export const createNatsumiChannels = async (guild, userId = null) => {
  const existing = await NatsumiGuildSetup.findOne({ guildId: guild.id }).lean();
  if (existing?.featureCategoryId) {
    const category = await guild.channels.fetch(existing.featureCategoryId).catch(() => null);
    if (category) return { already: true, setup: existing };
  }

  const everyone = guild.roles.everyone;
  const botMember = guild.members.me || await guild.members.fetchMe().catch(() => null);

  const baseOverwrites = [
    {
      id: everyone.id,
      allow: [PermissionFlagsBits.ViewChannel],
    },
  ];

  if (botMember) {
    baseOverwrites.push({
      id: botMember.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ManageChannels,
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

  for (const item of textChannels) {
    const channel = await guild.channels.create({
      name: item.name,
      type: ChannelType.GuildText,
      parent: featureCategory.id,
      topic: item.topic,
      reason: "나츠미 자동 채널 구성",
    });

    createdText.push(channel.id);
    if (item.ai) aiChannelIds.push(channel.id);
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
      "아래 버튼을 누르면 카미봇처럼 예쁜 채널 구성을 자동으로 만들어줄게요.",
      "",
      "생성되는 채널:",
      "🤖 AI채팅 · 🎨 AI그림 · 😀 이모지 · 🤫 비밀채팅 · 🤐 익명채팅 · 💬 잡담 · 📢 TTS",
    ].join("\n"))
    .setFooter({ text: "나츠미가 알아서 척척 정리해줄게. 흥, 특별히야!" })
    .setTimestamp();
};
