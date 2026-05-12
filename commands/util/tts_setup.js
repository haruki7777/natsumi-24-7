import {
  ActionRowBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
} from "discord.js";
import NatsumiTtsPreference from "../../models/NatsumiTtsPreference.js";
import { DEFAULT_TTS_VOICE, TTS_VOICES, fetchFishAudioVoiceOptions } from "../../utils/ttsVoices.js";

export const GUILD_TTS_USER_ID = "__guild_default__";

const categoryOptions = [
  {
    label: "한국어 보이스",
    value: "ko",
    description: "한국어 목소리 5개를 제목과 스타일로 보여줘요.",
  },
  {
    label: "일본어 보이스",
    value: "ja",
    description: "일본어 목소리 5개를 제목과 스타일로 보여줘요.",
  },
  {
    label: "기본 보이스",
    value: "static",
    description: "바로 사용할 수 있는 기본 목소리 5개예요.",
  },
];

export const isTtsAdmin = (interaction) => {
  return interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)
    || interaction.memberPermissions?.has(PermissionFlagsBits.Administrator);
};

export const getGuildTtsPreference = async (guildId) => {
  return NatsumiTtsPreference.findOne({
    guildId,
    userId: GUILD_TTS_USER_ID,
  }).lean().catch(() => null);
};

const toSelectOption = (voice, pref) => ({
  label: voice.label,
  value: voice.value?.startsWith?.("fish:") ? voice.value : voice.name,
  description: voice.description.slice(0, 100),
  default: (pref?.voiceId && pref.voiceId === voice.voiceId) || (pref?.voiceName || DEFAULT_TTS_VOICE.name) === voice.name,
});

export const buildTtsCategoryView = async (interaction) => {
  const pref = await getGuildTtsPreference(interaction.guildId);

  const embed = new EmbedBuilder()
    .setColor("#5865f2")
    .setAuthor({ name: "나츠미 TTS 설정", iconURL: interaction.client.user.displayAvatarURL() })
    .setTitle("서버 TTS 목소리 설정")
    .setDescription([
      "관리자만 서버 TTS 기본 목소리를 바꿀 수 있어요.",
      "카테고리를 고르면 제목과 스타일이 있는 목소리 5개를 보여줘요.",
      "TTS 채팅방에서 사용자가 말하면, 나츠미가 그 사용자의 음성채널로 들어가 읽어줘요.",
      "",
      `현재 서버 목소리: **${pref?.voiceName || DEFAULT_TTS_VOICE.name}**`,
    ].join("\n"));

  const categorySelect = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("NatsumiTts_category")
      .setPlaceholder("보이스 카테고리 선택")
      .addOptions(categoryOptions)
  );

  return { embeds: [embed], components: [categorySelect], ephemeral: true };
};

export const buildTtsVoiceView = async (interaction, category) => {
  const pref = await getGuildTtsPreference(interaction.guildId);
  const hasFishKey = Boolean(process.env.FISH_API_KEY || process.env.NATSUMI_FISH_AUDIO_API_KEY);
  let voices = TTS_VOICES;
  let title = "기본 보이스";

  if (category === "ko") {
    title = "한국어 보이스";
    voices = hasFishKey
      ? await fetchFishAudioVoiceOptions({ limit: 5, locale: "한국어" }).catch(() => [])
      : [];
  } else if (category === "ja") {
    title = "일본어 보이스";
    voices = hasFishKey
      ? await fetchFishAudioVoiceOptions({ limit: 5, locale: "일본어" }).catch(() => [])
      : [];
  }

  if (!voices.length) voices = TTS_VOICES.filter((voice) => {
    if (category === "ko") return voice.locale === "ko";
    if (category === "ja") return voice.locale === "ja";
    return true;
  });

  const embed = new EmbedBuilder()
    .setColor("#5865f2")
    .setAuthor({ name: "나츠미 TTS 설정", iconURL: interaction.client.user.displayAvatarURL() })
    .setTitle(`${title} 선택`)
    .setDescription([
      "아래 목록에서 서버 전체가 사용할 TTS 목소리를 골라주세요.",
      "목록은 최대 5개만 보여줘서 고르기 쉽게 정리했어요.",
      "",
      `현재 서버 목소리: **${pref?.voiceName || DEFAULT_TTS_VOICE.name}**`,
    ].join("\n"));

  const voiceSelect = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`NatsumiTts_voice_${category}`)
      .setPlaceholder(`${title} 선택`)
      .addOptions(voices.slice(0, 5).map((voice) => toSelectOption(voice, pref)))
  );

  const backSelect = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("NatsumiTts_category")
      .setPlaceholder("다른 카테고리 보기")
      .addOptions(categoryOptions)
  );

  return { embeds: [embed], components: [voiceSelect, backSelect], ephemeral: true };
};

export default {
  data: new SlashCommandBuilder()
    .setName("tts설정")
    .setDescription("관리자 전용: 서버 TTS 목소리를 설정합니다.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    if (!isTtsAdmin(interaction)) {
      return interaction.reply({ content: "이 설정은 서버 관리자만 사용할 수 있어요.", ephemeral: true });
    }

    return interaction.reply(await buildTtsCategoryView(interaction));
  },
};
