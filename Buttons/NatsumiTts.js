import NatsumiTtsPreference from "../models/NatsumiTtsPreference.js";
import {
  GUILD_TTS_USER_ID,
  buildTtsCategoryView,
  buildTtsVoiceView,
  isTtsAdmin,
} from "../commands/util/tts_setup.js";
import { TTS_VOICES, fetchFishAudioVoiceOptions } from "../utils/ttsVoices.js";

const findVoice = async (selectedValue, category) => {
  if (selectedValue?.startsWith?.("fish:")) {
    const locale = category === "ko" ? "한국어" : category === "ja" ? "일본어" : null;
    const fishVoices = await fetchFishAudioVoiceOptions({ limit: 5, locale }).catch(() => []);
    return fishVoices.find((voice) => voice.value === selectedValue);
  }

  return TTS_VOICES.find((voice) => voice.name === selectedValue || voice.value === selectedValue);
};

export default {
  name: "NatsumiTts",

  async execute(interaction) {
    if (!interaction.isAnySelectMenu() || !interaction.customId?.startsWith("NatsumiTts_")) return;

    if (!isTtsAdmin(interaction)) {
      return interaction.reply({ content: "이 설정은 서버 관리자만 사용할 수 있어요.", ephemeral: true });
    }

    const parts = interaction.customId.split("_");
    const mode = parts[1];

    if (mode === "category") {
      await interaction.deferUpdate();
      const category = interaction.values?.[0];
      return interaction.editReply(await buildTtsVoiceView(interaction, category));
    }

    if (mode === "voice") {
      await interaction.deferUpdate();
      const category = parts[2] || "static";
      const selectedValue = interaction.values?.[0];
      const voice = await findVoice(selectedValue, category) || TTS_VOICES[0];

      await NatsumiTtsPreference.findOneAndUpdate(
        { guildId: interaction.guildId, userId: GUILD_TTS_USER_ID },
        {
          guildId: interaction.guildId,
          userId: GUILD_TTS_USER_ID,
          voiceId: voice.voiceId || voice.value,
          voiceName: voice.name,
          updatedAt: new Date(),
        },
        { upsert: true, new: true }
      );

      const view = await buildTtsCategoryView(interaction);
      return interaction.editReply({
        ...view,
        content: `서버 TTS 목소리를 **${voice.name}**(으)로 바꿨어요.`,
      });
    }
  },
};
