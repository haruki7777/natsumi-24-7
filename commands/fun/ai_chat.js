import { SlashCommandBuilder } from "discord.js";
import { generateDistributedContent, getEmotion } from "../../utils/ai.js";
import BannedWords from "../../models/BannedWords.js";

export default {
  data: new SlashCommandBuilder()
    .setName("나츠미")
    .setDescription("나츠미랑 대화하자냥! (AI)")
    .addStringOption((option) =>
      option
        .setName("문장")
        .setDescription("하고 싶은 말을 입력해주라냥")
        .setRequired(true)
    ),
  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    if (!interaction.deferred && !interaction.replied) await interaction.deferReply();
    const query = interaction.options.getString("문장");
    const lowerQuery = query.toLowerCase().trim();

    // --- Banned Words Check ---
    try {
        const bannedWords = await BannedWords.find().lean().catch(() => []);
        if (bannedWords.some(bw => lowerQuery.includes(bw.word.toLowerCase()))) {
            return interaction.editReply({
                content: `뭐야?! 그런 천박하고 불쾌한 말 하지 마! 혼날 줄 알아!! 떽!!! 💢`,
            });
        }
    } catch (e) {}

    try {
      const emotion = getEmotion();

      const response = await generateDistributedContent({ 
        contents: [{ role: "user", parts: [{ text: query }] }],
        config: {
            systemInstruction: `넌 '${emotion}' 감정 상태를 가진 츤데레 여고생 캐릭터 '나츠미'야. 
- 성격: 평소엔 툴툴거리고(츤), 가끔은 솔직하지 못하게 호감을 표현해(데레).
- 말투: 반말을 기본으로 하며, 문장 끝에 "~거든?", "~든?", "흥!", "...별로!", "착각하지 마!" 등을 섞어줘.
- 사용자 메시지에 맞춰서 츤츤거리면서도 귀엽게 대답해줘.
- 대답은 자연스럽게 세 문장 이내로 해줘.`,
            temperature: 0.8,
        }
      });

      const replyText = response.text?.trim() || "흥... 뭐라고 해야 할지 모르겠다냥...";
      
      await interaction.editReply(replyText);
    } catch (err) {
      console.error("Gemini AI Chat Error:", err);
      
      const errMsg = err.message || "";

      if (errMsg.includes("ALL_MODELS_QUOTA_EXCEEDED") || errMsg.includes("429")) {
          return interaction.editReply("흥! 나츠미 지금 너무 바쁘거든? 나중에 다시 말 걸어줘... (API 사용량 초과)");
      }
      
      if (errMsg.includes("SAFETY")) {
          return interaction.editReply("흥! 그런 이상한 말엔 대답해주기 싫거든? 변태! 💢");
      }

      if (err.message?.includes("NO_API_KEY")) {
        return interaction.editReply("미안해... 지금은 나츠미가 대화할 준비가 안 됐어! (API 키가 없거나 유효하지 않다냥.)");
      }

      await interaction.editReply({
        content: `**냐하앗... 나츠미 머리가 아파졌다냥! 🤕\n오류: ${err.message}**`,
      });
    }
  },
};
