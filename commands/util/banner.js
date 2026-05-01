const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  SlashCommandBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("배너")
    .setDescription("유저의 배너를 확인한다냥!")
    .addUserOption((option) =>
      option.setName("유저").setDescription("배너를 확인할 유저를 선택해주라냥").setRequired(true)
    ),
  /**
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    await interaction.deferReply();

    const targetUser = interaction.options.getUser("유저");
    const user = await interaction.client.users.fetch(targetUser.id, { force: true });

    const bannerUrl = user.bannerURL({ size: 512, dynamic: true });

    if (!bannerUrl) {
      return await interaction.editReply({
        content: `**${user.tag} 님은 배너가 없다냥! 😿**`,
      });
    }

    const embed = new EmbedBuilder()
      .setColor("Orange")
      .setTitle(`🖼️ ${user.tag}님의 배너`)
      .setImage(bannerUrl)
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
