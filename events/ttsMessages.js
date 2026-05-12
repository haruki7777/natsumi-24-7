import { ChannelType, Events } from "discord.js";
import NatsumiGuildSetup from "../models/NatsumiGuildSetup.js";
import { speakMessage } from "../utils/voiceTts.js";

const isTtsChannel = (message, setup) => {
  const configuredTtsId = setup?.featureChannels?.tts;
  if (configuredTtsId && message.channel.id === configuredTtsId) return true;
  if (configuredTtsId) return false;

  const name = String(message.channel.name || "").toLowerCase();
  return message.channel?.type === ChannelType.GuildText && (name.includes("tts") || name.includes("읽어"));
};

const getTargetVoiceChannel = (message) => {
  if (message.channel?.type === ChannelType.GuildVoice) return message.channel;
  return message.member?.voice?.channel || null;
};

export default {
  name: Events.MessageCreate,

  async execute(message) {
    if (!message.guild || message.author.bot) return;

    const setup = await NatsumiGuildSetup.findOne({ guildId: message.guild.id }).lean().catch(() => null);
    if (!isTtsChannel(message, setup)) return;

    const voiceChannel = getTargetVoiceChannel(message);
    if (!voiceChannel) return;

    try {
      await speakMessage({ message, voiceChannel });
    } catch (error) {
      console.error("[NatsumiTTS] failed:", error);
    }
  },
};
