//Commands 폴더에 넣어주세요
const { SlashCommandBuilder } = require("discord.js");
const tts_Schema = require("../../models/tts");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("tts설정")
    .setDescription("tts 설정")
    .addChannelOption((f) =>
      f.setName("채널").setDescription("채널을 입력해 주라냥!").setRequired(true)
    ),
  /**
   *
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   */
  async execute(interaction) { 
    await interaction.deferReply();
    const channel = interaction.options.getChannel("채널");
    const tts_find = await tts_Schema.findOne({ guildid: interaction.guildId });
    if (tts_find) {
      await tts_Schema.updateOne(
        { guildid: interaction.guildId },
        {
          channelid: channel.id,
        }
      );
    } else {
      await new tts_Schema({
        guildid: interaction.guildId,
        channelid: channel.id,
      }).save();
    }
    interaction.editReply({ content: `**세팅 완료**` });
  },
};
