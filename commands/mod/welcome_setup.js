import { ChannelType, EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import WelcomeSettings from "../../models/WelcomeSettings.js";
import { buildPremiumHeartPrompt, checkPremiumHeart } from "../../utils/premiumHeart.js";
import { buildWelcomeContent, createWelcomeCard } from "../../utils/welcomeCard.js";

export default {
  data: new SlashCommandBuilder()
    .setName("환영인사설정")
    .setDescription("새 멤버 환영 카드와 멘트를 설정해요.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName("설정")
        .setDescription("환영인사를 켜고 보낼 채널과 멘트를 저장해요.")
        .addChannelOption((option) =>
          option
            .setName("채널")
            .setDescription("환영인사를 보낼 채널을 선택해줘.")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("멘트")
            .setDescription("{user}, {mention}, {server}, {count}를 사용할 수 있어요.")
            .setRequired(true)
            .setMaxLength(180)
        )
    )
    .addSubcommand((sub) =>
      sub.setName("끄기").setDescription("환영인사를 꺼요.")
    )
    .addSubcommand((sub) =>
      sub.setName("보기").setDescription("현재 환영인사 설정을 확인해요.")
    )
    .addSubcommand((sub) =>
      sub.setName("테스트").setDescription("현재 설정으로 테스트 환영 카드를 보내요.")
    ),

  async execute(interaction) {
    const heart = await checkPremiumHeart(interaction.user.id);
    if (!heart.ok) {
      return interaction.reply(buildPremiumHeartPrompt(interaction.user.id, heart));
    }

    await interaction.deferReply({ ephemeral: true });

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "설정") {
      const channel = interaction.options.getChannel("채널", true);
      const message = interaction.options.getString("멘트", true);

      const settings = await WelcomeSettings.findOneAndUpdate(
        { guildID: interaction.guildId },
        {
          $set: {
            guildID: interaction.guildId,
            channelID: channel.id,
            message,
            enabled: true,
          },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      return interaction.editReply({
        embeds: [buildSettingsEmbed(interaction, settings).setDescription("환영인사 설정을 저장했어요.")],
      });
    }

    if (subcommand === "끄기") {
      const settings = await WelcomeSettings.findOneAndUpdate(
        { guildID: interaction.guildId },
        { $set: { enabled: false } },
        { new: true }
      );

      if (!settings) return interaction.editReply({ content: "아직 환영인사 설정이 없어요." });
      return interaction.editReply({
        embeds: [buildSettingsEmbed(interaction, settings).setDescription("환영인사를 껐어요.")],
      });
    }

    const settings = await WelcomeSettings.findOne({ guildID: interaction.guildId }).lean();
    if (!settings) {
      return interaction.editReply({ content: "`/환영인사설정 설정`으로 먼저 채널과 멘트를 저장해줘." });
    }

    if (subcommand === "테스트") {
      const channel = interaction.guild.channels.cache.get(settings.channelID) || await interaction.guild.channels.fetch(settings.channelID).catch(() => null);
      if (!channel?.isTextBased?.()) {
        return interaction.editReply({ content: "저장된 환영 채널을 찾지 못했어요. 다시 설정해줘." });
      }

      const card = await createWelcomeCard(interaction.member, settings.message);
      await channel.send({
        content: buildWelcomeContent(settings.message, interaction.member),
        files: [card],
      });

      return interaction.editReply({ content: `${channel}에 테스트 환영인사를 보냈어요.` });
    }

    return interaction.editReply({ embeds: [buildSettingsEmbed(interaction, settings)] });
  },
};

const buildSettingsEmbed = (interaction, settings) => {
  return new EmbedBuilder()
    .setColor("#FF8F3D")
    .setTitle("환영인사 설정")
    .addFields(
      { name: "상태", value: settings.enabled ? "켜짐" : "꺼짐", inline: true },
      { name: "채널", value: settings.channelID ? `<#${settings.channelID}>` : "설정 안 됨", inline: true },
      { name: "멘트", value: settings.message || "설정 안 됨" }
    )
    .setFooter({ text: "{user}, {mention}, {server}, {count} 사용 가능" })
    .setTimestamp();
};
