// Commands/* 폴더에 넣어주세요

const {
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionFlagsBits,
  } = require("discord.js");
  
  module.exports = {
    data: new SlashCommandBuilder()
      .setName("투표")
      .setDescription("투표 명령어다냥")
      .addStringOption((f) =>
        f
          .setName("주제")
          .setDescription("투표 주제를 입력해 주라냥.ᐟ")
          .setRequired(true)
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    /**
     *
     * @param {import("discord.js").ChatInputCommandInteraction} interaction
     * @param {import("discord.js").Client} client
     */
    async execute(interaction) {
      await interaction.deferReply();
      const topic = interaction.options.getString("주제");
      const embed = new EmbedBuilder()
        .setTitle("투표")
        .setColor("Gold")
        .setDescription(`**투표 주제** : **${topic}**`)
        .setFooter({
          text: interaction.user.tag,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        })
        .setImage('https://media.discordapp.net/attachments/1031616908300136462/1055256334129430568/6DDE285D-86CF-4937-BCB7-BE53CDC00336.png')
        .setTimestamp();
      const msg = await interaction.editReply({
        embeds: [embed],
      });
      msg.react("👍");
      msg.react("👎");
    },
  };
  