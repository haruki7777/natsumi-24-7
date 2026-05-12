import { Readable } from "node:stream";
import { PermissionsBitField } from "discord.js";
import {
  AudioPlayerStatus,
  VoiceConnectionStatus,
  createAudioPlayer,
  createAudioResource,
  entersState,
  joinVoiceChannel,
} from "@discordjs/voice";
import ffmpegPath from "ffmpeg-static";
import NatsumiTtsPreference from "../models/NatsumiTtsPreference.js";

if (ffmpegPath) process.env.FFMPEG_PATH = ffmpegPath;

const MAX_TTS_LENGTH = Number(process.env.NATSUMI_TTS_MAX_LENGTH || 180);
const queues = new Map();

const cleanText = (message) => {
  return String(message.content || "")
    .replace(/<@!?(\d+)>/g, "멘션")
    .replace(/<#(\d+)>/g, "채널")
    .replace(/<@&(\d+)>/g, "역할")
    .replace(/https?:\/\/\S+/g, "링크")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_TTS_LENGTH);
};

const buildTtsUrl = (text, voice = null) => {
  const endpoint = process.env.NATSUMI_TTS_API_URL || "https://api.streamelements.com/kappa/v2/speech";
  const url = new URL(endpoint);
  if (!url.searchParams.has("voice")) url.searchParams.set("voice", voice || process.env.NATSUMI_TTS_VOICE || "Seoyeon");
  url.searchParams.set("text", text);
  return url;
};

const fetchTtsBuffer = async (text, voice = null) => {
  const response = await fetch(buildTtsUrl(text, voice), {
    headers: { "User-Agent": "NatsumiDiscordBot/1.0" },
  });
  if (!response.ok) throw new Error(`TTS API ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
};

const waitForPlayerIdle = (player) => new Promise((resolve, reject) => {
  const timeout = setTimeout(() => reject(new Error("TTS playback timeout")), 120000);
  player.once(AudioPlayerStatus.Idle, () => {
    clearTimeout(timeout);
    resolve();
  });
  player.once("error", (error) => {
    clearTimeout(timeout);
    reject(error);
  });
});

const playBuffer = async ({ message, voiceChannel, buffer }) => {
  const me = message.guild.members.me || await message.guild.members.fetchMe().catch(() => null);
  const permissions = voiceChannel.permissionsFor(me);
  if (!permissions?.has(PermissionsBitField.Flags.Connect) || !permissions?.has(PermissionsBitField.Flags.Speak)) {
    return false;
  }

  const connection = joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId: message.guild.id,
    adapterCreator: message.guild.voiceAdapterCreator,
    selfDeaf: false,
  });

  try {
    await entersState(connection, VoiceConnectionStatus.Ready, 15000);
    const player = createAudioPlayer();
    const resource = createAudioResource(Readable.from(buffer));
    connection.subscribe(player);
    player.play(resource);
    await entersState(player, AudioPlayerStatus.Playing, 15000);
    await waitForPlayerIdle(player);
    return true;
  } finally {
    connection.destroy();
  }
};

const enqueue = (guildId, task) => {
  const previous = queues.get(guildId) || Promise.resolve();
  const next = previous.then(task, task).finally(() => {
    if (queues.get(guildId) === next) queues.delete(guildId);
  });
  queues.set(guildId, next);
  return next;
};

export const speakMessage = async ({ message, voiceChannel }) => {
  const text = cleanText(message);
  if (!text) return false;

  return enqueue(message.guild.id, async () => {
    const pref = await NatsumiTtsPreference.findOne({
      guildId: message.guild.id,
      userId: message.author.id,
    }).lean().catch(() => null);
    const buffer = await fetchTtsBuffer(text, pref?.voiceId || null);
    return playBuffer({ message, voiceChannel, buffer });
  });
};
