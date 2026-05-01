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
      .setDescription("닝겐들의 배너를 엿본다냥 ㅋㅋ")
      .addUserOption((option) =>
        option.setName("유저").setDescription("유저를 고르라냥").setRequired(true)
      ),
    async execute(interaction) {
      await interaction.deferReply();
  
      const _user = interaction.options.getUser("유저");
      const user = await interaction.client.users.fetch(_user.id, {
        force: true,
      });
  
      const user_banner = user.bannerURL({
        size: 512,
      });
  
      if (!user_banner) {
        return await interaction.editReply({
          content: "배너가 존재하지 않다냥",
        });
      }
  
      const embed = new EmbedBuilder()
        .setColor("Orange")
        .setTitle(`${user.tag}의 배너👤`)
        .setImage(user_banner)
        .setTimestamp();
  
      const button = new ButtonBuilder()
        .setLabel("배너 링크")
        .setStyle(ButtonStyle.Link)
        .setURL(user_banner)
        .setEmoji("<:KemomimiDance:1048568057599119370>");
  
      const row = new ActionRowBuilder().addComponents(button);
  
      await interaction.editReply({
        embeds: [embed],
        components: [row],
      });
    },
  };