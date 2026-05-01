// Events 폴더에 넣어주세요
const { Events } = require("discord.js");
const voice = require("@discordjs/voice");

module.exports = {
  name: Events.VoiceStateUpdate,
  /**
   *
   * @param {import("discord.js").VoiceState} oldSate
   * @param {import("discord.js").VoiceState} newSate
   */
  async execute(oldSate, newSate) {
    if (newSate.channel) {
      if (newSate.member.user.id == newSate.client.user.id) {
        if (newSate.channel.members.size == 1) {
          const connection = voice.getVoiceConnection(newSate.guild.id);
          connection.disconnect();
        }
      }
    }
    if (oldSate.channel) {
      if (
        oldSate.channel.members.has(oldSate.client.user.id) &&
        oldSate.channel.members.size == 1
      ) {
        const connection = voice.getVoiceConnection(oldSate.guild.id);
        connection.disconnect();
      }
    }
  },
};
