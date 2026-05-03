import { SlashCommandBuilder } from "discord.js";
import LearnedData from "../../models/LearnedData.js";
import BannedWords from "../../models/BannedWords.js";
import { generateDistributedContent } from "../../utils/ai.js";

export default {
  data: new SlashCommandBuilder()
    .setName("학습")
    .setDescription("나츠미에게 새로운 걸 가르쳐줘!")
    .addStringOption(option =>
      option.setName("질문")
        .setDescription("유저가 물어볼 질문")
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName("답변")
        .setDescription("나츠미가 대답할 내용")
        .setRequired(true)
    ),
  /**
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    const question = interaction.options.getString("질문");
    const answer = interaction.options.getString("답변");

    // Check local banned words first
    const bannedWords = await BannedWords.find();
    const hasBannedWord = (text) => bannedWords.some(bw => text.includes(bw.word));

    if (hasBannedWord(question) || hasBannedWord(answer)) {
        return interaction.reply({ 
            content: "뭐야?! 그런 천박하고 불쾌한 건 나한테 가르치지 마! 혼날 줄 알아!! 떽!!! 💢", 
            ephemeral: true 
        });
    }

    const isUnhealthy = async (text) => {
        try {
            const prompt = `Check if the following text is HIGHLY sexually explicit or extremely harmful hate speech. Reply exactly 'SAFE' or 'UNSAFE'. If it's just teasing or common words, reply 'SAFE'.\n\nText: ${text}`;
            
            const response = await generateDistributedContent({
                contents: [{ role: "user", parts: [{ text: prompt }] }]
            });
            
            const feedback = response.text?.trim().toUpperCase();
            return feedback === "UNSAFE";
        } catch (e) {
            console.error("Content filtering error:", e);
            
            // Minimal safety fallback if AI fails (quota or other issues)
            const unsafe = /\b(섹스|sex|야동|av|포르노|porn)\b/i;
            return unsafe.test(text);
        }
    };

    if (await isUnhealthy(question) || await isUnhealthy(answer)) {
        return interaction.reply({ content: "흥! 그런 불쾌한 건 나한테 가르치지 마! 꺼져!", ephemeral: true });
    }

    try {
        await LearnedData.create({
            question: question,
            answer: answer,
            user_id: interaction.user.id
        });

        await interaction.reply({ 
            content: `///.../// 에, 그러니까... ${interaction.user.username}가 알려준 거... 잘 기억해 둘게! 착각하지 마!`, 
            ephemeral: true 
        });
    } catch (error) {
        console.error("Learn command error:", error);
        await interaction.reply({ content: "으… 뭔가 잘 안 됐어! 다시 시도해 줘!", ephemeral: true });
    }
  },
};
