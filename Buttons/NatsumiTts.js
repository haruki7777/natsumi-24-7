import NatsumiTtsPreference from "../models/NatsumiTtsPreference.js";
import { buildTtsSettingsView } from "../commands/util/tts_setup.js";
import { TTS_VOICES, fetchFishAudioVoiceOptions } from "../utils/ttsVoices.js";

export default {
  name: "NatsumiTts",

  async execute(interaction) {
    if (!interaction.isAnySelectMenu() || interaction.customId !== "NatsumiTts_voice") return;

    const selectedValue = interaction.values?.[0];
    const fishVoices = selectedValue?.startsWith?.("fish:")
      ? await fetchFishAudioVoiceOptions({ limit: 25 }).catch(() => [])
      : [];
    const selected = selectedValue?.startsWith?.("fish:")
      ? fishVoices.find((voice) => voice.value === selectedValue)
      : TTS_VOICES.find((voice) => voice.name === selectedValue);
    const voice = selected || TTS_VOICES[0];

    await NatsumiTtsPreference.findOneAndUpdate(
      { guildId: interaction.guildId, userId: interaction.user.id },
      {
        guildId: interaction.guildId,
        userId: interaction.user.id,
        voiceId: voice.voiceId || voice.value,
        voiceName: voice.name,
        updatedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    const view = await buildTtsSettingsView(interaction);
    return interaction.update({
      ...view,
      content: `목소리를 **${voice.name}**(으)로 바꿨어요.`,
    });
  },
};
