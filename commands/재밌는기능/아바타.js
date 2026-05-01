const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    SlashCommandBuilder,
  } = require("discord.js");
  
  module.exports = {
    data: new SlashCommandBuilder()
      .setName("프로필")
      .setDescription("닝겐들의 프로필을 엿본다냥 ㅋㅋ")
      .addUserOption((option) =>
        option.setName("유저").setDescription("유저를 고르라냥").setRequired(true)
      ),
    async execute(interaction) {
      await interaction.deferReply();
  
      const user = interaction.options.getUser("유저");
      const userAvatar = user.displayAvatarURL({ size: 512 });
  
      const embed = new EmbedBuilder()
        .setColor("Orange")
        .setTitle(`${user.tag}의 프로필👤`)
        .setImage(`${userAvatar}`)
        .setTimestamp();
  
      const button = new ButtonBuilder()
        .setLabel("프로필 링크")
        .setStyle(ButtonStyle.Link)
        .setURL(userAvatar)
        .setEmoji("<:KemomimiDance:1048568057599119370>");
  
      const row = new ActionRowBuilder().addComponents(button);
  
      await interaction.editReply({
        embeds: [embed],
        components: [row],
      });
    },
  };