import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from "discord.js";
import BannedWords from "../../models/BannedWords.js";

export default {
  data: new SlashCommandBuilder()
    .setName("금지어")
    .setDescription("나츠미가 싫어하는 금지어를 관리합니다냥!")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub
        .setName("추가")
        .setDescription("금지어를 추가합니다.")
        .addStringOption((opt) => opt.setName("단어").setDescription("추가할 단어").setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName("삭제")
        .setDescription("금지어를 삭제합니다.")
        .addStringOption((opt) => opt.setName("단어").setDescription("삭제할 단어").setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName("목록")
        .setDescription("현재 등록된 금지어 목록을 봅니다.")
    ),
  /**
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const word = interaction.options.getString("단어");

    if (sub === "추가") {
      try {
        await BannedWords.create({ word: word });
        await interaction.reply({ content: `✅ 이제부터 **${word}** 같은 말은 절대 하면 안 된다냥!`, ephemeral: true });
      } catch (e) {
        await interaction.reply({ content: "이미 등록된 금지어거나 오류가 발생했다냥!", ephemeral: true });
      }
    } else if (sub === "삭제") {
      const deleted = await BannedWords.findOneAndDelete({ word: word });
      if (deleted) {
        await interaction.reply({ content: `🗑️ **${word}** 단어를 용서해 주겠다냥... 다음엔 조심하라냥!`, ephemeral: true });
      } else {
        await interaction.reply({ content: "그런 단어는 목록에 없다냥!", ephemeral: true });
      }
    } else if (sub === "목록") {
      const list = await BannedWords.find();
      const words = list.map((d) => d.word).join(", ") || "아직 금지어가 없다냥!";
      
      const embed = new EmbedBuilder()
        .setTitle("🚫 나츠미의 금지어 목록")
        .setDescription(words)
        .setColor("Red");
      
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
