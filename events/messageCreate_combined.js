const { Events, EmbedBuilder } = require("discord.js");
const tts_Schema = require("../models/tts");
const featuresDB = require("../models/Features");
const { calculateXP } = require("./levels"); // Import the calculateXP helper

const {
  joinVoiceChannel,
  createAudioPlayer,
  NoSubscriberBehavior,
  createAudioResource,
} = require("@discordjs/voice");
const { getAudioUrl } = require("google-tts-api");

module.exports = {
  name: Events.MessageCreate,
  /**
   * @param {import("discord.js").Message} message
   * @param {import("discord.js").Client} client
   */
  async execute(message, client) {
    if (message.author.bot) return;

    // 1. Greetings
    if (message.content === "안녕 나츠미") {
      return message.reply({ 
          content: `**할로할로~ 내 이름은 나츠미!! 귀엽고 깜찍한 여우라냥~ 🦊💛**` 
      });
    }

    // 2. TTS Logic
    const tts_find = await tts_Schema.findOne({ channelid: message.channelId });
    if (tts_find) {
      const memberVoicechannel = message.member.voice?.channel;
      if (memberVoicechannel) {
        const player = createAudioPlayer({
          behaviors: {
            noSubscriber: NoSubscriberBehavior.Stop,
          },
        });

        const tts_url = getAudioUrl(message.content.slice(0, 200), {
          lang: "ko",
          slow: false,
          host: "https://translate.google.com",
        });

        const resource = createAudioResource(tts_url);
        const connection = joinVoiceChannel({
          channelId: memberVoicechannel.id,
          guildId: message.guild.id,
          adapterCreator: message.guild.voiceAdapterCreator,
        });

        connection.subscribe(player);
        player.play(resource);
        
        // Optionally notify
        // message.channel.send({ content: `**[TTS]** ${message.author.username}: ${message.content}` });
      }
    }

    // 3. Level System Logic (XP)
    if (message.guild) {
        const levelSystemCheck = await featuresDB.findOne({ GuildID: message.guild.id });
        if (levelSystemCheck && levelSystemCheck.LevelSystem?.Enabled) {
            // We can call the levels handler here or just let levels.js handle it if we keep it separate
            // To keep things simple and avoid duplicate events, I'll keep levels.js separate but rename it to levels_xp.js
        }
    }
  },
};
