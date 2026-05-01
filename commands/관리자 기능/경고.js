const log_Channel = ""; //로그채널 아이디를 입력해 주세요 (필수 X)

//* 1,2,3번은 이미 mongoose에 연결 하셨다면 안하셔도 됩니다! *
//1. 터미널에 입력할 것 : npm i mongoose

//2. 아래 코드 index.js에 추가하세요
/*
const mongoose = require("mongoose");
mongoose.connect(process.env.MONGOOSE, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
});
*/

//3. https://youtu.be/-Wf8E6RRuXA 영상 3:37까지 따라하시고 3:37에 나오는 링크 복사하셔서 .env파일에 MONGOOSE=(복사한_링크) 이렇게 넣어주세요

//4. models 폴더 만드시고 warning.js 파일 하나 생성해 주시고 아래 코드를 넣어주세요
/*
const { Schema, model } = require("mongoose");
module.exports = model(
  "경고",
  new Schema({
    guildID: String,
    userID: String,
    count: Number,
  })
);
*/

const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} = require("discord.js");
const warning_Schema = require("../../models/warnings");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("경고")
    .setDescription("경고를 부여/회수합니다냥")
    .addStringOption((data) =>
      data
        .setName("옵션")
        .setDescription("옵션을 선택해 주라냥")
        .setRequired(true)
        .addChoices(
          { name: "부여", value: "부여" },
          { name: "회수", value: "회수" }
        )
    )
    .addUserOption((datas) =>
      datas
        .setName("유저")
        .setDescription("유저를 입력해 주라냥!")
        .setRequired(true)
    )
    .addIntegerOption((datass) =>
      datass
        .setName("횟수")
        .setDescription("경고를 몇 개만큼 회수/부여할 건지 입력해 주라냥!")
        .setRequired(false)
        .setMinValue(0)
    )
    .addStringOption((datasss) =>
      datasss
        .setName("사유")
        .setDescription("사유를 입력해 주라냥")
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  /**
   * @param {import("discord.js").CommandInteraction} interaction
   * @param {import("discord.js").Client} client
   * @preturns
   */
  async execute(interaction, client) {
    await interaction.deferReply();
    const option = interaction.options.getString("옵션");
    const reason = interaction.options.getString("사유");
    const user = interaction.options.getUser("유저");
    const integer = interaction.options.getInteger("횟수") || 1;
    const warning_find = await warning_Schema.findOne({
      userID: user.id,
      guildID: interaction.guildId,
    });
    if (option == "부여") {
      if (warning_find) {
        await warning_Schema.updateOne(
          { userID: user.id, guildID: interaction.guildId },
          { count: warning_find.count + integer }
        );
      } else {
        await new warning_Schema({
          userID: user.id,
          guildID: interaction.guildId,
          count: integer,
        }).save();
      }
      const embed = new EmbedBuilder()
        .setColor("Orange")
        .setTimestamp()
        .setTitle("경고 부여")
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setDescription(
          `**${user} 님에게 ${integer} 만큼 부여했다냥!\n총 경고 수 : ${
            (warning_find?.count || 0) + integer
          }개**`
        )
        .addFields(
          {
            name: "👮🏽‍♂️ 처리자",
            value: `${interaction.user} (${interaction.user.tag})`,
          },
          { name: `🙍 유저`, value: `${user} (${user.tag})` },
          { name: `📃 사유`, value: `\`\`\`${reason || "없음"}\`\`\`` }
        );
      interaction.editReply({ embeds: [embed] });
      if (log_Channel) {
        client.channels.cache
          .get(log_Channel)
          ?.send({ embeds: [embed] })
          .catch(() => {});
      }
      return;
    }
    if (option == "회수") {
      if (!warning_find) {
        {
          return interaction.editReply({
            content: "**회수할 경고가 없다냥**",
          });
        }
      }
      if (warning_find.count - integer < 0) {
        return interaction.editReply({
          content: `**회수할 경고 수가 유저의 경고 수보다 많다냥**`,
        });
      }
      await warning_Schema.updateOne(
        { userID: user.id, guildID: interaction.guildId },
        { count: warning_find.count - integer }
      );
      const embed = new EmbedBuilder()
        .setColor("Orange")
        .setTimestamp()
        .setTitle("경고 회수")
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setDescription(
          `**${user}님의 경고를 ${integer} 만큼 회수했다냥\n총 경고 수 : ${
            warning_find.count - integer
          }개**`
        )
        .addFields(
          {
            name: "👮🏽‍♂️ 처리자",
            value: `${interaction.user} (${interaction.user.tag})`,
          },
          { name: `🙍 유저`, value: `${user} (${user.tag})` },
          { name: `📃 사유`, value: `\`\`\`${reason || "없음"}\`\`\`` }
        );
      interaction.editReply({ embeds: [embed] });
      if (log_Channel) {
        client.channels.cache
          .get(log_Channel)
          ?.send({ embeds: [embed] })
          .catch(() => {});
      }
      return;
    }
  },
};
