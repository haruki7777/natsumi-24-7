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
    .setDescription("숲의 인간들이 걸어둔 장식(배너)을 엿볼까? 콘콘!")
    .addUserOption((option) =>
      option.setName("유저").setDescription("누구의 장식을 보고 싶어?")
    ),
  /**
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    await interaction.deferReply();

    const targetUser = interaction.options.getUser("유저") || interaction.user;
    const user = await interaction.client.users.fetch(targetUser.id, { force: true });

    const bannerUrl = user.bannerURL({ size: 1024, dynamic: true });

    if (!bannerUrl) {
      return await interaction.editReply({
        content: `**${user.username} 녀석은 아무런 장식도 안 걸어놨네! 썰렁하게스리! 흥!**`,
      });
    }

    const embed = new EmbedBuilder()
      .setColor("#FF7F50")
      .setTitle(`🖼️ ${user.username}의 화려한 배경`)
      .setImage(bannerUrl)
      .setDescription("흥! 뭐, 나쁘지는 않은 취향이네. 칭찬은 아니야! 콘콘!")
      .setTimestamp();

    const button = new ButtonBuilder()
      .setLabel("배너 링크")
      .setStyle(ButtonStyle.Link)
      .setURL(bannerUrl);

    const row = new ActionRowBuilder().addComponents(button);

    await interaction.editReply({
      embeds: [embed],
      components: [row],
    });
  },
};
