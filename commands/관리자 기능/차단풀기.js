const {
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionFlagsBits,
  } = require("discord.js");
  
  module.exports = {
    data: new SlashCommandBuilder()
      .setName("차단풀기")
      .setDescription("차단된 냥이들을 풀어준다냥 ㅋㅋ")
      .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
      .addUserOption((option) =>
        option
          .setName("유저")
          .setDescription("차단을 풀어줄 유저를 선택하세요.")
          .setRequired(true)
      ),
  
    async execute(interaction) {
      await interaction.deferReply();
  
      const user = interaction.options.getUser("유저");
  
      try {
        await interaction.guild.members.unban(user);
  
        const embed = new EmbedBuilder()
          .setAuthor({ name: '제작자 : 하루키#3081', iconURL:  'https://media.discordapp.net/attachments/1049783329613951036/1055765268846100590/124E7AB6-6124-48FF-9445-E53BFAF2BB02.jpg'})
          .setDescription(
            `성공! ${user.id} ${user.tag} 차단된 친구를 풀어줬냥 ㅋㅋㅋ 인심썻다냥`
          )
          .setFooter({ text: '봇 이름:나츠미', iconURL:  'https://media.discordapp.net/attachments/1049783329613951036/1055765268846100590/124E7AB6-6124-48FF-9445-E53BFAF2BB02.jpg'})
          .setImage("https://media.tenor.com/eABx7TWWAm4AAAAC/mao-amatsuka.gif")
          .setColor("Orange")
          .setTimestamp();
  
        await interaction.editReply({
          embeds: [embed],
        });
      } catch {
        await interaction.editReply({
          content: "이미 풀어져있거나 권한이 없어서 냥이를 차단 못푼다냥 바부🤣🤣",
        });
      }
    },
  };