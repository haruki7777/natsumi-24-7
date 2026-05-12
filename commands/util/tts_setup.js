import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
} from "discord.js";
import NatsumiTtsPreference from "../../models/NatsumiTtsPreference.js";
import { DEFAULT_TTS_VOICE, TTS_VOICES } from "../../utils/ttsVoices.js";

const buildVoiceOptions = (pref) => TTS_VOICES.slice(0, 25).map((voice) => ({
  label: voice.label,
  value: voice.name,
  description: voice.description.slice(0, 100),
  emoji: voice.emoji,
  default: (pref?.voiceName || DEFAULT_TTS_VOICE.name) === voice.name,
}));

export const buildTtsSettingsView = async (interaction) => {
  const pref = await NatsumiTtsPreference.findOne({
    guildId: interaction.guildId,
    userId: interaction.user.id,
  }).lean().catch(() => null);

  const embed = new EmbedBuilder()
    .setColor("#5865f2")
    .setAuthor({ name: "카미봇 설정", iconURL: interaction.client.user.displayAvatarURL() })
    .setTitle("TTS 목소리 바꾸기")
    .setDescription([
      "짠! 새로운 목소리가 생겼어요!",
      "아래 메뉴에서 TTS 목소리를 선택하면, TTS 채널에서 채팅을 칠 때 그 목소리로 읽어요.",
      "",
      `현재 목소리: **${pref?.voiceName || DEFAULT_TTS_VOICE.name}**`,
    ].join("\n"));

  const links = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel("설정 홈")
      .setStyle(ButtonStyle.Link)
      .setURL(process.env.NATSUMI_DASHBOARD_URL || "https://github.com/haruki7777/natsumi-dashboard"),
    new ButtonBuilder()
      .setLabel("이 채널 설정")
      .setStyle(ButtonStyle.Link)
      .setURL(process.env.NATSUMI_DASHBOARD_URL || "https://github.com/haruki7777/natsumi-dashboard"),
    new ButtonBuilder()
      .setLabel("TTS 관리")
      .setStyle(ButtonStyle.Link)
      .setURL(process.env.NATSUMI_DASHBOARD_URL || "https://github.com/haruki7777/natsumi-dashboard")
  );

  const voiceSelect = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("NatsumiTts_voice")
      .setPlaceholder("TTS 목소리 선택")
      .addOptions(buildVoiceOptions(pref))
  );

  return { embeds: [embed], components: [links, voiceSelect], ephemeral: true };
};

export default {
  data: new SlashCommandBuilder()
    .setName("tts설정")
    .setDescription("TTS 목소리와 읽기 설정을 바꿉니다."),

  async execute(interaction) {
    return interaction.reply(await buildTtsSettingsView(interaction));
  },
};
