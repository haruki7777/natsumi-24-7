import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("배너")
    .setDescription("유저의 디스코드 프로필 배너를 확인해요.")
    .addUserOption((option) =>
      option.setName("유저").setDescription("배너를 확인할 유저").setRequired(false),
    ),

  /**
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const targetUser = interaction.options.getUser("유저") || interaction.user;
    const user = await interaction.client.users.fetch(targetUser.id, { force: true }).catch(() => targetUser);
    const bannerUrl = user.bannerURL({ size: 1024, dynamic: true });

    if (!bannerUrl) {
      return interaction.editReply({ content: `**${user.username}** 유저는 아직 프로필 배너를 설정하지 않았어.` });
    }

    const embed = new EmbedBuilder()
      .setColor("#ff7ab6")
      .setTitle(`${user.username} 배너`)
      .setImage(bannerUrl)
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel("배너 원본 열기").setStyle(ButtonStyle.Link).setURL(bannerUrl),
    );

    return interaction.editReply({ embeds: [embed], components: [row] });
  },
};
