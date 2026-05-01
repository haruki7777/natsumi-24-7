const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require("discord.js");
const Schema = require("../../models/privateVoice");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("개인음성채널")
    .setDescription("개인 음성 채널 생성 시스템 설정")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addStringOption((option) =>
      option
        .setName("옵션")
        .setDescription("옵션을 선택해 주라냥")
        .setRequired(true)
        .addChoices(
          { name: "추가", value: "추가" },
          { name: "삭제", value: "삭제" }
        )
    )
    .addStringOption((option) =>
      option
        .setName("이름")
        .setDescription("채널 이름 설정 | {user} = 유저 닉네임 | 예: 📞ㆍ{user}님의 방")
        .setRequired(true)
        .setMaxLength(30)
    )
    .addChannelOption((option) =>
      option
        .setName("채널")
        .setDescription("여기에 들어가면 개인 채널이 생성된다냥")
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildVoice)
    )
    .addChannelOption((option) =>
      option
        .setName("카테고리")
        .setDescription("개인 채널이 생성될 카테고리")
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildCategory)
    ),
  /**
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    await interaction.deferReply();
    const namePattern = interaction.options.getString("이름");
    const option = interaction.options.getString("옵션");
    const triggerChannel = interaction.options.getChannel("채널");
    const spawnCategory = interaction.options.getChannel("카테고리");

    if (option === "추가") {
      await Schema.findOneAndUpdate(
        { guildId: interaction.guildId, channelId: triggerChannel.id },
        { categoryId: spawnCategory.id, name: namePattern },
        { upsert: true }
      );
      return interaction.editReply({ content: `**✅ ${triggerChannel} 채널에 개인 음성 시스템을 설정했다냥!**` });
    }
    
    if (option === "삭제") {
      const deleted = await Schema.findOneAndDelete({
        guildId: interaction.guildId,
        channelId: triggerChannel.id,
      });
      
      if (deleted) {
        return interaction.editReply({ content: `**✅ ${triggerChannel} 채널의 개인 음성 시스템을 삭제했다냥!**` });
      } else {
        return interaction.editReply({ content: `**❌ 해당 채널은 설정되어 있지 않다냥!**` });
      }
    }
  },
};
