import { ChannelType, Events } from "discord.js";
import NatsumiGuildSetup from "../models/NatsumiGuildSetup.js";
import { speakMessage } from "../utils/voiceTts.js";

const compact = (value) => String(value || "").replace(/\s+/g, "").toLowerCase();

const isTtsNamedChannel = (channel) => {
  if (channel?.type !== ChannelType.GuildText) return false;
  const name = compact(channel.name);
  return name.includes("tts")
    || name.includes("rrs")
    || name.includes("읽어")
    || name.includes("음성")
    || name.includes("목소리");
};

const resolveTtsChannelMatch = (message, setup) => {
  const configuredTtsId = setup?.featureChannels?.tts;
  if (!configuredTtsId) return { ok: isTtsNamedChannel(message.channel), shouldRepair: false };
  if (message.channel.id === configuredTtsId) return { ok: true, shouldRepair: false };

  const configured = message.guild.channels.cache.get(configuredTtsId);
  const configuredLooksUsable = configured?.type === ChannelType.GuildText;
  const currentLooksTts = isTtsNamedChannel(message.channel);

  if (!configuredLooksUsable && currentLooksTts) {
    return { ok: true, shouldRepair: true };
  }

  return { ok: false, shouldRepair: false };
};

const repairTtsChannelId = async (guildId, channelId) => {
  await NatsumiGuildSetup.findOneAndUpdate(
    { guildId },
    {
      $set: { "featureChannels.tts": channelId },
      $addToSet: { textChannelIds: channelId },
      $pull: { voiceChannelIds: channelId },
    },
    { upsert: false }
  ).catch(() => {});
};

const getTargetVoiceChannel = (message) => {
  if (message.channel?.type === ChannelType.GuildVoice) return message.channel;
  return message.member?.voice?.channel || null;
};

export default {
  name: Events.MessageCreate,

  async execute(message) {
    if (!message.guild || message.author.bot) return;
    if (!message.content?.trim()) return;

    const setup = await NatsumiGuildSetup.findOne({ guildId: message.guild.id }).lean().catch(() => null);
    const match = resolveTtsChannelMatch(message, setup);
    if (!match.ok) return;
    if (match.shouldRepair) await repairTtsChannelId(message.guild.id, message.channel.id);

    const voiceChannel = getTargetVoiceChannel(message);
    if (!voiceChannel) {
      await message.reply({
        content: "먼저 음성채널에 들어간 다음 TTS방에 글을 적어줘요.",
        allowedMentions: { repliedUser: false },
      }).then((reply) => setTimeout(() => reply.delete().catch(() => {}), 5000)).catch(() => {});
      return;
    }

    try {
      const spoken = await speakMessage({ message, voiceChannel });
      if (!spoken) await message.react("⚠️").catch(() => {});
    } catch (error) {
      console.error("[NatsumiTTS] failed:", error);
      await message.react("⚠️").catch(() => {});
    }
  },
};
