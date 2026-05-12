import NatsumiTtsPreference from "../models/NatsumiTtsPreference.js";
import { buildTtsSettingsView } from "../commands/util/tts_setup.js";
import { TTS_VOICES } from "../utils/ttsVoices.js";

export default {
  name: "NatsumiTts",

  async execute(interaction) {
    if (!interaction.isAnySelectMenu() || interaction.customId !== "NatsumiTts_voice") return;

    const selectedName = interaction.values?.[0];
    const selected = TTS_VOICES.find((voice) => voice.name === selectedName) || TTS_VOICES[0];

    await NatsumiTtsPreference.findOneAndUpdate(
      { guildId: interaction.guildId, userId: interaction.user.id },
      {
        guildId: interaction.guildId,
        userId: interaction.user.id,
        voiceId: selected.value,
        voiceName: selected.name,
        updatedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    const view = await buildTtsSettingsView(interaction);
    return interaction.update({
      ...view,
      content: `목소리를 **${selected.name}**(으)로 바꿨어요.`,
    });
  },
};
