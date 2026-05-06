import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from "discord.js";
import BannedWords from "../../models/BannedWords.js";

export default {
  data: new SlashCommandBuilder()
    .setName("금지어")
    .setDescription("나츠미가 듣기 싫은 말들을 관리할 거야! 콘콘!")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub
        .setName("추가")
        .setDescription("새로운 금지어를 추가해!")
        .addStringOption((opt) => opt.setName("단어").setDescription("무슨 단어가 싫어?").setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName("삭제")
        .setDescription("금지어 단어를 용서해줄게.")
        .addStringOption((opt) => opt.setName("단어").setDescription("지워줄 단어").setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName("목록")
        .setDescription("지금까지 어떤 말들이 나를 화나게 했는지 볼까?")
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
        await interaction.reply({ content: `✅ 이제부터 **${word}** 같은 천박한 말은 절대 하면 안 돼! 알았어?`, ephemeral: true });
      } catch (e) {
        await interaction.reply({ content: "이미 내가 싫어하는 단어거나 뭔가 잘못됐어! 흥!", ephemeral: true });
      }
    } else if (sub === "삭제") {
      const deleted = await BannedWords.findOneAndDelete({ word: word });
      if (deleted) {
        await interaction.reply({ content: `🗑️ **${word}**... 이번 딱 한 번만 용서해 주는 거야. 다시는 하지 마!`, ephemeral: true });
      } else {
        await interaction.reply({ content: "흥! 그런 단어는 원래 목록에도 없었거든?", ephemeral: true });
      }
    } else if (sub === "목록") {
      const list = await BannedWords.find();
      const words = list.map((d) => d.word).join(", ") || "아직은 딱히 듣기 싫은 말이 없네? 헤헤.";
      
      const embed = new EmbedBuilder()
        .setTitle("🚫 나츠미가 봉인한 금지어")
        .setDescription(`\`\`\`${words}\`\`\``)
        .setColor("#ED4245")
        .setFooter({ text: "이 단어들을 내뱉으면 여우의 불꽃으로 혼내줄 거야! 콘콘!" });
      
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
