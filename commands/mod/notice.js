import {
  SlashCommandBuilder,
  EmbedBuilder,
  ChannelType,
  PermissionFlagsBits,
} from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("공지")
    .setDescription("특정 채널에 나의 메시지를 전파하겠어! 콘콘!")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption((option) =>
      option
        .setName("채널")
        .setDescription("어디에 내 메시지를 뿌릴 거야?")
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildText)
    )
    .addStringOption((option) =>
      option
        .setName("내용")
        .setDescription("무슨 내용인지 적어봐! (줄바꿈은 \\n)")
        .setRequired(true)
        .setMaxLength(4096)
    )
    .addStringOption((option) =>
      option
        .setName("멘션")
        .setDescription("누구를 호출할까?")
        .addChoices(
          { name: "없음", value: "없음" },
          { name: "온라인 유저만 (here)", value: "here" },
          { name: "모두 다 (everyone)", value: "everyone" }
        )
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("썸네일")
        .setDescription("옆에 뭐라도 띄울까? 콘콘!")
        .setRequired(false)
        .addChoices(
          { name: "없음", value: "없음" },
          { name: "서버 문양", value: "서버 프로필" },
          { name: "내 얼굴(작성자)", value: "공지 작성자" }
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
      .setTitle(`🦊 나츠미의 공지 전파`)
      .setColor("#FF7F50")
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
      content: `**${notice_channel}에 공지를 성공적으로 뿌렸어! 별로 힘들진 않았지만!**`,
    });
    
    await msg.react("🏮").catch(() => {});
  },
};
