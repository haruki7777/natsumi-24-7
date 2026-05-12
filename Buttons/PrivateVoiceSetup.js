import { ChannelType, PermissionFlagsBits } from "discord.js";
import Schema from "../models/privateVoice.js";

const DEFAULT_ROOM_NAME = "{user}의 대화방";

const ensureBaseSetup = async (guild) => {
  const existingSetup = await Schema.findOne({ guildId: guild.id }).lean();
  let category = null;
  let trigger = null;

  if (existingSetup) {
    category = guild.channels.cache.get(existingSetup.categoryId) || await guild.channels.fetch(existingSetup.categoryId).catch(() => null);
    trigger = guild.channels.cache.get(existingSetup.channelId) || await guild.channels.fetch(existingSetup.channelId).catch(() => null);
  }

  if (!category) {
    category = await guild.channels.create({
      name: "🏮 개인 음성 채널",
      type: ChannelType.GuildCategory,
      reason: "개인 음성 채널 자동 구축",
    });
  }

  if (!trigger) {
    trigger = await guild.channels.create({
      name: "대화방 생성",
      type: ChannelType.GuildVoice,
      parent: category.id,
      userLimit: 0,
      reason: "개인 음성 채널 자동 구축",
    });
  }

  await Schema.findOneAndUpdate(
    { guildId: guild.id, channelId: trigger.id },
    {
      guildId: guild.id,
      categoryId: category.id,
      channelId: trigger.id,
      name: DEFAULT_ROOM_NAME,
      userLimit: trigger.userLimit || 0,
    },
    { upsert: true, new: true }
  );

  return { category, trigger };
};

const createLimitedTrigger = async (guild, limit) => {
  const { category } = await ensureBaseSetup(guild);
  const trigger = await guild.channels.create({
    name: `${limit}인방 생성`,
    type: ChannelType.GuildVoice,
    parent: category.id,
    userLimit: limit,
    reason: `개인 음성 채널 ${limit}인방 트리거 추가`,
  });

  await Schema.findOneAndUpdate(
    { guildId: guild.id, channelId: trigger.id },
    {
      guildId: guild.id,
      categoryId: category.id,
      channelId: trigger.id,
      name: `{user}의 ${limit}인방`,
      userLimit: limit,
    },
    { upsert: true, new: true }
  );

  return { category, trigger };
};

export default {
  name: "privateVoiceSetup",

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: "**이 작업은 서버 관리자만 할 수 있어요.**", ephemeral: true });
    }

    try {
      if (interaction.isAnySelectMenu?.() && interaction.customId === "privateVoiceSetup_limit") {
        await interaction.deferReply({ ephemeral: true });
        const limit = Number(interaction.values?.[0] || 0);
        if (![2, 5, 10].includes(limit)) return interaction.editReply("지원하지 않는 인원 제한이에요.");

        const { category, trigger } = await createLimitedTrigger(interaction.guild, limit);
        return interaction.editReply(`**${category} 카테고리에 ${trigger} ${limit}인방 트리거를 추가했어요.**`);
      }

      await interaction.deferUpdate();
      const existing = await Schema.findOne({ guildId: interaction.guild.id }).lean();
      const existingCategory = existing
        ? interaction.guild.channels.cache.get(existing.categoryId) || await interaction.guild.channels.fetch(existing.categoryId).catch(() => null)
        : null;
      const existingTrigger = existing
        ? interaction.guild.channels.cache.get(existing.channelId) || await interaction.guild.channels.fetch(existing.channelId).catch(() => null)
        : null;

      if (existingCategory && existingTrigger) {
        await interaction.message.delete().catch(() => {});
        return interaction.followUp({
          content: "**이미 개인 음성 시스템이 구축되어 있어요. 추가 인원 제한 방은 셀렉트 메뉴에서 골라주세요.**",
          ephemeral: true,
        });
      }

      const { category, trigger } = await ensureBaseSetup(interaction.guild);
      await interaction.message.delete().catch(() => {});
      return interaction.followUp({
        content: `**${category} 카테고리에 개인 음성 시스템 구축을 완료했어요.**\n이제 ${trigger} 채널에 들어가면 개인 방이 생성돼요.`,
        ephemeral: true,
      });
    } catch (error) {
      console.error("[Private Voice Setup Button Error]", error);
      const payload = {
        content: "**채널을 만드는 중 오류가 발생했어요. 봇의 채널 관리 권한을 확인해주세요.**",
        ephemeral: true,
      };
      if (interaction.deferred || interaction.replied) return interaction.followUp(payload).catch(() => {});
      return interaction.reply(payload).catch(() => {});
    }
  },
};
