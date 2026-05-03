import { SlashCommandBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("소개")
    .setDescription("나츠미 자기소개 츤츤 스타일"),
  /**
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    await interaction.reply(
      "나, 나츠미야...! 고등학생이고... " +
      "취미는 게임이랑 그림 그리기야...\n" +
      "생일은 3월 18일이고, 좋아하는 음식은 딸기 케이크야! " +
      "딱히 네가 궁금해할까 봐 말해주는 건 아니니까?! 착각하지 마!!!"
    );
  },
};
