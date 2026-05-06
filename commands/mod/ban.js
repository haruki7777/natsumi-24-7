//Commands/* 에 넣어주세요

import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("차단")
    .setDescription("마음에 안 드는 인간을 숲에서 쫓아버리겠어! 콘콘!")
    .addUserOption((option) =>
      option
        .setName("유저")
        .setDescription("쫓아버릴 대상을 선택해!")
        .setRequired(true)
    )
    .addBooleanOption((option) =>
      option
        .setName("메세지삭제여부")
        .setDescription("이 녀석이 남긴 흔적도 다 지워버릴까?")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("유저전송여부")
        .setDescription("쫓겨나는 이유를 본인에게 말해줄까?")
        .addChoices(
          { name: "전송해!", value: "true" },
          { name: "몰래 쫓아내!", value: "false" }
        )
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("사유")
        .setDescription("왜 쫓아내는 거야? 타당한 이유를 대라고!")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  /**
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    await interaction.deferReply();

    const user = interaction.options.getUser("유저");
    const member =
      interaction.guild.members.cache.get(user.id) ||
      (await interaction.guild.members.fetch(user.id).catch(() => {}));
    const deleteMessages = interaction.options.getBoolean("메세지삭제여부");
    const send = interaction.options.getString("유저전송여부");
    const reason = interaction.options.getString("사유");

    if (!member) {
      return interaction.editReply({
        content: "**흥! 그런 녀석은 숲에 존재하지도 않아!**",
      });
    }

    if (interaction.member.id == member.id) {
      return interaction.editReply({
        content: "**자기 자신을 쫓아내겠다고? 바보야?**",
      });
    }

    if (
      member.roles.highest.position >= interaction.member.roles.highest.position
    ) {
      return interaction.editReply({
        content: "**흥! 자기보다 영력이 강한 사람을 쫓아낼 순 없다구!**",
      });
    }

    if (!member.bannable) {
      return interaction.editReply({
        content: "**저 녀석은 숲의 가호를 받고 있나 봐! 쫓아낼 수 없어!**",
      });
    }

    const embed = new EmbedBuilder()
      .setTitle(`🏮 ${interaction.guild.name} 추방 기록`)
      .addFields(
        {
          name: "👮🏽‍♂️ 처리자",
          value: `**<@!${interaction.user.id}> ( ${interaction.user.tag} )**`,
        },
        {
          name: "🙍 대상자",
          value: `**<@!${member.id}> ( ${member.user.tag} )** \n **ID : ${member.id}**`,
        },
        { name: "📃 사유", value: `\`\`\`${reason}\`\`\`` }
      )
      .setTimestamp()
      .setColor("Red")
      .setThumbnail(member.user.displayAvatarURL({ size: 2048, dynamic: true }));

    if (send == "true") {
      await member.send({ embeds: [embed] }).catch(() => {});
    }

    await member.ban({
      reason: `${reason}`,
      deleteMessageSeconds: deleteMessages ? 604800 : 0,
    });

    await interaction.editReply({ embeds: [embed] });
  },
};
