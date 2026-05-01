const { Events, EmbedBuilder } = require("discord.js");

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    if (message.content == "<@905355491708903485>") {
      const Embed = new EmbedBuilder()
        .setTitle("도움말보러 오신거다냥?")
        .setDescription("도움말은 </도움말:2938> 을 치리냥!")
        .setColor("Orange");
      message.channel.send({ embeds: [Embed] });
    }
  },
};