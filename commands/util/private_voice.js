import { SlashCommandBuilder, ChannelType, PermissionFlagsBits } from "discord.js";
import Schema from "../../models/privateVoice.js";

export default {
  data: new SlashCommandBuilder()
    .setName("개인음성채널")
    .setDescription("숲의 비밀 대화방 시스템을 설정할 거야! 콘콘!")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addStringOption((option) =>
      option
        .setName("옵션")
        .setDescription("추가할지 삭제할지 골라봐.")
        .setRequired(true)
        .addChoices(
          { name: "추가", value: "추가" },
          { name: "삭제", value: "삭제" }
        )
    )
    .addStringOption((option) =>
      option
        .setName("이름")
        .setDescription("대화방 이름! {user}는 닉네임으로 바뀔 거야.")
        .setRequired(true)
        .setMaxLength(30)
    )
    .addChannelOption((option) =>
      option
        .setName("채널")
        .setDescription("어디로 들어가야 비밀방이 생길까? (음성 채널)")
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
      return interaction.editReply({ content: `**✅ ${triggerChannel}에 비밀 대화방 시스템을 설치했어! 콘콘!**` });
    }
    
    if (option === "삭제") {
      const deleted = await Schema.findOneAndDelete({
        guildId: interaction.guildId,
        channelId: triggerChannel.id,
      });
      
      if (deleted) {
        return interaction.editReply({ content: `**✅ ${triggerChannel}의 비밀 대화방 시스템을 철거했어! 흥!**` });
      } else {
        return interaction.editReply({ content: `**❌ 거긴 애초에 설정도 안 되어 있었잖아! 바보야?**` });
      }
    }
  },
};
