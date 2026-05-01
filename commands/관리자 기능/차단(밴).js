//Commands/* 에 넣어주세요

const log_Channel = ""; //차단 로그를 보낼 채널 아이디를 입력해 주세요 (필수 X)



const {

  SlashCommandBuilder,

  CommandInteraction,

  PermissionFlagsBits,

  EmbedBuilder,

} = require("discord.js");



module.exports = {

  data: new SlashCommandBuilder()

    .setName("차단")

    .setDescription("유저를 차단한다냥")

    .addUserOption((option) =>

      option

        .setName("유저")

        .setDescription("차단할 유저를 선택하라냥")

        .setRequired(true)

    )

    .addBooleanOption((option) =>

      option

        .setName("메세지삭제여부")

        .setDescription("차단할 대상의 메시지를 삭제할지 선택하라냥")

        .setRequired(true)

    )

    .addStringOption((option) =>

      option

        .setName("유저전송여부")

        .setDescription("서버 차단 로그를 유저에게 전송할지 선택해 주라냥")

        .addChoices(

          { name: "전송", value: "true" },

          { name: "미전송", value: "false" }

        )

        .setRequired(true)

    )

    .addStringOption((option) =>

      option

        .setName("사유")

        .setDescription("차단을 하는 이유를 사유를 입력해 주라냥")

        .setRequired(true)

    )

    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  /**

   * @param {CommandInteraction} interaction

   * @preturns

   */

  async execute(interaction) {
    await interaction.deferReply();

    const user = interaction.options.getUser("유저");

    const member =

      interaction.guild.members.cache.get(user.id) ||

      (await interaction.guild.members.fetch(user.id).catch(() => {}));

    const string = interaction.options.getBoolean("메세지삭제여부");

    const send = interaction.options.getString("유저전송여부");

    const reason = interaction.options.getString("사유");

    if (!member) {

      interaction.editReply({

        content: "**해당 유저를 찾을 수 없다냥**",

      });

      return;

    }

    if (interaction.member.id == member.id) {

      interaction.editReply({

        content: "**자기 자신을 차단할 순 없다냥**",

      });

      return;

    }

    if (

      member.roles.highest.position > interaction.member.roles.highest.position

    ) {

      interaction.editReply({

        content: "**자신보다 높은 권한의 유저는 차단할 수 없다냥**",

      });

      return;

    }

    if (!member.bannable) {

      interaction.editReply({

        content: "**해당 유저를 차단할 수 없다냥**",

      });

      return;

    }

    const embed = new EmbedBuilder()

      .setTitle(`${interaction.guild.name} 서버 차단 로그`)

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

      .setThumbnail(member.displayAvatarURL({ size: 2048, dynamic: true }));

    await interaction.editReply({ embeds: [embed] });

    if (send == "true") {

      await member.send({ embeds: [embed] }).catch(async () => {

        interaction.editReply({

          content: "**차단할 유저에게 메시지 전송을 실패했다냥**",

        });

      });

    }

    await member.ban({

      reason: `${reason}`,

      deleteMessageSeconds: string == true ? 604800 : 0,

    });

    if (log_Channel.length != 0) {

      interaction.guild.channels.cache

        .get(log_Channel)

        ?.send({ embeds: [embed] });

    }

  },

};

