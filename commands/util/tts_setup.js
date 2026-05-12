import {
  ActionRowBuilder,
  EmbedBuilder,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
} from "discord.js";
import NatsumiTtsPreference from "../../models/NatsumiTtsPreference.js";
import { DEFAULT_TTS_VOICE, TTS_VOICES, fetchFishAudioVoiceOptions } from "../../utils/ttsVoices.js";

const toSelectOption = (voice, pref) => ({
  label: voice.label,
  value: voice.value?.startsWith?.("fish:") ? voice.value : voice.name,
  description: voice.description.slice(0, 100),
  ...(voice.emoji ? { emoji: voice.emoji } : {}),
  default: (pref?.voiceId && pref.voiceId === voice.voiceId) || (pref?.voiceName || DEFAULT_TTS_VOICE.name) === voice.name,
});

const buildVoiceOptions = async (pref) => {
  const staticVoices = TTS_VOICES.slice(0, 25).map((voice) => toSelectOption(voice, pref));
  if (!(process.env.FISH_API_KEY || process.env.NATSUMI_FISH_AUDIO_API_KEY)) return staticVoices;

  const fishVoices = await fetchFishAudioVoiceOptions({ limit: 25 }).catch(() => []);
  if (!fishVoices.length) return staticVoices;

  return fishVoices.map((voice) => toSelectOption(voice, pref)).slice(0, 25);
};

export const buildTtsSettingsView = async (interaction) => {
  const pref = await NatsumiTtsPreference.findOne({
    guildId: interaction.guildId,
    userId: interaction.user.id,
  }).lean().catch(() => null);

  const embed = new EmbedBuilder()
    .setColor("#5865f2")
    .setAuthor({ name: "나츠미 설정", iconURL: interaction.client.user.displayAvatarURL() })
    .setTitle("TTS 목소리 바꾸기")
    .setDescription([
      "음성 채널에 들어간 상태로 TTS 채널에 채팅을 치면 나츠미가 들어와서 읽어줘요.",
      "아래 메뉴에서 목소리를 고르면 다음 TTS부터 바로 그 설정을 사용해요.",
      process.env.FISH_API_KEY || process.env.NATSUMI_FISH_AUDIO_API_KEY
        ? "Fish Audio API에서 한국어/일본어 보이스만 골라 보여줘요."
        : "Fish Audio API 키가 없으면 기본 보이스 목록을 보여줘요.",
      "",
      `현재 목소리: **${pref?.voiceName || DEFAULT_TTS_VOICE.name}**`,
    ].join("\n"));

  const voiceSelect = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("NatsumiTts_voice")
      .setPlaceholder("TTS 목소리 선택")
      .addOptions(await buildVoiceOptions(pref))
  );

  return { embeds: [embed], components: [voiceSelect], ephemeral: true };
};

export default {
  data: new SlashCommandBuilder()
    .setName("tts설정")
    .setDescription("TTS 목소리와 읽기 설정을 바꿉니다."),

  async execute(interaction) {
    return interaction.reply(await buildTtsSettingsView(interaction));
  },
};
