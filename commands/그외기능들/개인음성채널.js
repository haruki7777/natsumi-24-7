const { SlashCommandBuilder, ChannelType } = require("discord.js");
const Schema = require("../../models/개인음성채널");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("개인음성채널")
    .setDescription("개인 음성 채널 설정 명령어")
    .addStringOption((f) =>
      f
        .setName("옵션")
        .setDescription("옵션을 선택해 주라냥")
        .setRequired(true)
        .addChoices(
          { name: "추가", value: "추가" },
          { name: "삭제", value: "삭제" }
        )
    )
    .addStringOption((f) =>
      f
        .setName("이름")
        .setDescription(
          "개인 음성 채널 이름을 입력해 주라냥 | {user} = 유저 닉네임 | 예시 : 📞ㆍ{user}님의 게임방"
        )
        .setRequired(true)
        .setMaxLength(30)
    )
    .addChannelOption((f) =>
      f
        .setName("채널")
        .setDescription("어떤 채널에 들어가면 개인 음성 채널을 생성할 건가냥?")
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildVoice)
    )
    .addChannelOption((f) =>
      f
        .setName("카테고리")
        .setDescription("개인 음성 채널 카테고리를 설정해 주라냥")
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildCategory)
    ),
  /**
   *
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    await interaction.deferReply();
    const namef = interaction.options.getString("이름");
    const option = interaction.options.getString("옵션");
    const channel = interaction.options.getChannel("채널");
    const category = interaction.options.getChannel("카테고리");
    if (option == "추가") {
      const find = await Schema.findOne({
        guildId: interaction.guildId,
        channelId: channel.id,
      });
      if (find) {
        await Schema.updateOne(
          { guildId: interaction.guildId, channelId: channel.id },
          {
            categoryId: category.id,
            name: namef,
          }
        );
      } else {
        await new Schema({
          guildId: interaction.guildId,
          categoryId: category.id,
          channelId: channel.id,
          name: namef,
        }).save();
      }
      interaction.editReply({ content: `**설정 완료**` });
      return;
    }
    if (option == "삭제") {
      const find = await Schema.findOne({
        guildId: interaction.guildId,
        channelId: channel.id,
      });
      if (find) {
        await Schema.deleteOne({
          guildId: interaction.guildId,
          channelId: channel.id,
        });
      } else {
        return interaction.editReply({
          content: `**개인 음성 채널 시스템이 설정되어 있지 않은 채널이다냥**`,
        });
      }
      interaction.editReply({ content: `**삭제 완료**` });
      return;
    }
  },
};