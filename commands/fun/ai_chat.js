import { SlashCommandBuilder } from "discord.js";
import { GoogleGenAI } from "@google/genai";
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
        const bannedWords = await BannedWords.find().catch(() => []);
        if (bannedWords.some(bw => lowerQuery.includes(bw.word.toLowerCase()))) {
            return interaction.editReply({
                content: `뭐야?! 그런 천박하고 불쾌한 말 하지 마! 혼날 줄 알아!! 떽!!! 💢`,
            });
        }
    } catch (e) {
        console.error("Banned words check error in command:", e);
    }

    const getValidKey = () => {
        const k = process.env.MY_GEMINI_API_KEY;
        if (!k) return null;
        const cleaned = k.toString().replace(/['"]/g, "").trim();
        if (cleaned.length > 10) return cleaned;
        return null;
    };

    const apiKey = getValidKey();
    if (!apiKey) {
      return interaction.editReply("미안해... 지금은 나츠미가 대화할 준비가 안 됐어! (API 키가 없거나 유효하지 않다냥. 설정 확인해달라냥!)");
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      
      const hour = new Date().getHours();
      let emotion = "츤츤";
      if (hour >= 0 && hour < 5) emotion = "귀찮음";
      else if (hour >= 5 && hour < 10) emotion = "기쁨";
      else if (hour >= 10 && hour < 17) emotion = "츤츤";
      else if (hour >= 17 && hour < 21) emotion = "사랑";
      else emotion = "슬픔";

      const response = await ai.models.generateContent({ 
        model: "gemini-3-flash-preview",
        contents: [{ role: "user", parts: [{ text: query }] }],
        config: {
            systemInstruction: `넌 '${emotion}' 감정 상태를 가진 츤데레 여고생 캐릭터 '나츠미'야. 
- 성격: 평소엔 툴툴거리고(츤), 가끔은 솔직하지 못하게 호감을 표현해(데레).
- 말투: 반말을 기본으로 하며, 문장 끝에 "~거든?", "~든?", "흥!", "...별로!", "착각하지 마!" 등을 섞어줘.
- 사용자 메시지에 맞춰서 츤츤거리면서도 귀엽게 대답해줘.
- 대답은 아주 간결하게 한 문장 정도로 해줘.`,
            temperature: 0.8,
        }
      });

      const replyText = response.text?.trim() || "흥... 뭐라고 해야 할지 모르겠다냥...";
      
      await interaction.editReply(replyText);
    } catch (err) {
      console.error("Gemini AI Chat Error:", err);
      
      if (err.message?.includes("API key not valid")) {
          return interaction.editReply("흥! API 키가 유효하지 않대! 봇 관리자보고 똑바로 설정하라고 전해줘냥! 💢");
      }
      
      if (err.message?.includes("SAFETY")) {
          return interaction.editReply("흥! 그런 이상한 말엔 대답해주기 싫거든? 변태! 💢");
      }
      await interaction.editReply({
        content: `**냐하앗... 나츠미 머리가 아파졌다냥! 🤕\n오류: ${err.message}**`,
      });
    }
  },
};
