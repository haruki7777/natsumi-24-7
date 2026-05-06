import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} from "discord.js";
import warning_Schema from "../../models/warnings.js";

export default {
  data: new SlashCommandBuilder()
    .setName("경고")
    .setDescription("잘못을 저지른 인간들에게 주의를 줄게! 콘콘!")
    .addStringOption((data) =>
      data
        .setName("옵션")
        .setDescription("뭘 하고 싶어?")
        .setRequired(true)
        .addChoices(
          { name: "딱지 붙이기(부여)", value: "부여" },
          { name: "딱지 떼주기(회수)", value: "회수" }
        )
    )
    .addUserOption((datas) =>
      datas
        .setName("유저")
        .setDescription("누구를 지목할 거야?")
        .setRequired(true)
    )
    .addIntegerOption((datass) =>
      datass
        .setName("횟수")
        .setDescription("몇 장이나 처리할까?")
        .setRequired(false)
        .setMinValue(0)
    )
    .addStringOption((datasss) =>
      datasss
        .setName("사유")
        .setDescription("이유가 뭐야? 제대로 설명하라구!")
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  /**
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   * @param {import("discord.js").Client} client
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
        .setTitle("⚠️ 영력의 경고")
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setDescription(
          `**${user}! 너에게 경고 ${integer}회를 줬어! \n반성하고 꼬리 내리고 있으라구! 콘콘! \n현재 총 경고: ${(warning_find?.count || 0) + integer}회**`
        )
        .addFields(
          {
            name: "👮🏽‍♂️ 처리자",
            value: `${interaction.user} (${interaction.user.tag})`,
          },
          { name: `🙍 대상 유저`, value: `${user} (${user.tag})` },
          { name: `📃 사유`, value: `\`\`\`${reason || "없음"}\`\`\`` }
        );
      return interaction.editReply({ embeds: [embed] });
    }
    
    if (option == "회수") {
      if (!warning_find || warning_find.count === 0) {
        return interaction.editReply({
          content: "**흥! 회수할 경고도 없는데 왜 나를 부르는 거야?**",
        });
      }
      
      if (warning_find.count - integer < 0) {
        return interaction.editReply({
          content: `**회수할 경고가 그렇게 많아? 이 녀석 경고는 ${warning_find.count}회뿐이라구! 바보야?**`,
        });
      }
      
      await warning_Schema.updateOne(
        { userID: user.id, guildID: interaction.guildId },
        { count: warning_find.count - integer }
      );
      
      const embed = new EmbedBuilder()
        .setColor("Orange")
        .setTimestamp()
        .setTitle("✅ 자비의 경고 회수")
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setDescription(
          `**${user}! 너의 경고를 ${integer}회 만큼 거둬줬어. \n내가 자비로운 여우라는 걸 잊지 말라구! 콘콘! \n남은 경고: ${warning_find.count - integer}회**`
        )
        .addFields(
          {
            name: "👮🏽‍♂️ 처리자",
            value: `${interaction.user} (${interaction.user.tag})`,
          },
          { name: `🙍 대상 유저`, value: `${user} (${user.tag})` },
          { name: `📃 사유`, value: `\`\`\`${reason || "없음"}\`\`\`` }
        );
      return interaction.editReply({ embeds: [embed] });
    }
  },
};
