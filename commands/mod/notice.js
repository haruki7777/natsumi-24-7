const {
  SlashCommandBuilder,
  EmbedBuilder,
  ChannelType,
  PermissionFlagsBits,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("공지")
    .setDescription("특정 채널에 공지를 전송한다냥")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption((option) =>
      option
        .setName("채널")
        .setDescription("공지를 전송할 채널을 선택해 주라냥.")
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildText)
    )
    .addStringOption((option) =>
      option
        .setName("내용")
        .setDescription("공지 내용을 입력해 주세요. 줄바꿈은 \\n로 해주라냥")
        .setRequired(true)
        .setMaxLength(4096)
    )
    .addStringOption((option) =>
      option
        .setName("멘션")
        .setDescription("멘션 옵션")
        .addChoices(
          { name: "없음", value: "없음" },
          { name: "온라인 유저만 멘션", value: "here" },
          { name: "모든 유저 멘션", value: "everyone" }
        )
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("썸네일")
        .setDescription("임베드 썸네일을 선택해 주라냥")
        .setRequired(false)
        .addChoices(
          { name: "없음", value: "없음" },
          { name: "서버 프로필", value: "서버 프로필" },
          { name: "공지 작성자", value: "공지 작성자" }
        )
    ),
  /**
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    await interaction.deferReply();
    const notice_channel = interaction.options.getChannel("채널");
    const notice_content = interaction.options.getString("내용");
    const notice_mention = interaction.options.getString("멘션");
    const notice_thumbnail = interaction.options.getString("썸네일");
    
    const embed = new EmbedBuilder()
      .setTitle(`📢 공지사항`)
      .setColor("Orange")
      .setDescription(`**${notice_content.replace(/\\n/g, "\n")}**`)
      .setFooter({
        text: `${interaction.user.username}`,
        iconURL: interaction.member.displayAvatarURL({ dynamic: true }),
      })
      .setTimestamp();
      
    if (notice_thumbnail == "서버 프로필") {
      embed.setThumbnail(interaction.guild.iconURL({ dynamic: true }));
    }
    if (notice_thumbnail == "공지 작성자") {
      embed.setThumbnail(
        interaction.member.displayAvatarURL({ dynamic: true })
      );
    }
    
    let msg;
    if (notice_mention == "없음") {
      msg = await notice_channel.send({
        embeds: [embed],
      });
    } else {
      msg = await notice_channel.send({
        content: `@${notice_mention}`,
        embeds: [embed],
      });
    }
    
    await interaction.editReply({
      content: `**${notice_channel}에 공지를 전송했다냥!!**`,
    });
    
    await msg.react("✅").catch(() => {});
  },
};
