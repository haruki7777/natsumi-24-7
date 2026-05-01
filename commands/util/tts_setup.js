const { SlashCommandBuilder } = require("discord.js");
const tts_Schema = require("../../models/tts");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("tts설정")
    .setDescription("TTS(Text-to-Speech)가 작동할 채널을 설정한다냥!")
    .addChannelOption((option) =>
      option.setName("채널").setDescription("채널을 선택해주라냥!").setRequired(true)
    ),
  /**
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   */
  async execute(interaction) { 
    await interaction.deferReply();
    const channel = interaction.options.getChannel("채널");
    
    let tts_find = await tts_Schema.findOne({ guildid: interaction.guildId });
    
    if (tts_find) {
      await tts_Schema.updateOne(
        { guildid: interaction.guildId },
        { channelid: channel.id }
      );
    } else {
      await new tts_Schema({
        guildid: interaction.guildId,
        channelid: channel.id,
      }).save();
    }
    
    await interaction.editReply({ content: `**✅ ${channel} 채널로 TTS 설정이 완료되었다냥!**` });
  },
};
