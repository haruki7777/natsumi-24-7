import { AttachmentBuilder, SlashCommandBuilder } from "discord.js";

const GOOGLE_TTS_LIMIT = 180;

export default {
  data: new SlashCommandBuilder()
    .setName("구글tts")
    .setDescription("Google TTS 음성 파일을 만들어 보냅니다.")
    .addStringOption((option) =>
      option
        .setName("내용")
        .setDescription("읽어줄 문장")
        .setRequired(true)
        .setMaxLength(GOOGLE_TTS_LIMIT)
    )
    .addStringOption((option) =>
      option
        .setName("언어")
        .setDescription("TTS 언어")
        .setRequired(false)
        .addChoices(
          { name: "한국어", value: "ko" },
          { name: "일본어", value: "ja" },
          { name: "영어", value: "en" }
        )
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const text = interaction.options.getString("내용", true).trim().slice(0, GOOGLE_TTS_LIMIT);
    const lang = interaction.options.getString("언어") || "ko";
    const url = new URL("https://translate.google.com/translate_tts");
    url.searchParams.set("ie", "UTF-8");
    url.searchParams.set("client", "tw-ob");
    url.searchParams.set("tl", lang);
    url.searchParams.set("q", text);

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0",
        },
      });
      if (!response.ok) throw new Error(`Google TTS ${response.status}`);

      const buffer = Buffer.from(await response.arrayBuffer());
      const attachment = new AttachmentBuilder(buffer, { name: "natsumi-google-tts.mp3" });
      return interaction.editReply({ content: `TTS: ${text}`, files: [attachment] });
    } catch (error) {
      console.error("[GoogleTTS] failed:", error);
      return interaction.editReply("Google TTS 생성에 실패했어요. 문장을 조금 짧게 다시 시도해주세요.");
    }
  },
};
