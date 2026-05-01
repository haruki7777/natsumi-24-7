const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
    PermissionFlagsBits,
  } = require("discord.js");
  
  const db = require("../../models/Verifydb");
  const client = require("../../index");
  
  module.exports = {
    data: new SlashCommandBuilder()
      .setName("인증설정")
      .setDescription("인증 채널과 인증 완료 후 지급할 역할을 설정한다냥")
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addRoleOption((op) =>
        op
          .setName("역할")
          .setDescription("인증 완료 후 지급 할 역할을 선택하라냥")
          .setRequired(true)
      )
      .addChannelOption((op) =>
        op
          .setName("채널")
          .setDescription("인증을 진행 할 채널을 선택하라냥")
          .setRequired(true)
          .addChannelTypes(ChannelType.GuildText)
      ),
    /**
     *
     * @param {import("discord.js").ChatInputCommandInteraction} interaction
     */
    async execute(interaction) {
      await interaction.deferReply()
      const role = interaction.options.getRole("역할");
      const channel = interaction.options.getChannel("채널");
      const db_find = await db.findOne({ guildId: interaction.guildId });
      if (db_find) {
        await db.updateOne(
          { guildId: interaction.guildId },
          { channelId: channel.id, roleId: role.id }
        );
      } else {
        const DB = new db({
          guildId: interaction.guildId,
          roleId: role.id,
          channelId: channel.id,
        });
        DB.save();
      }
      const Embed = new EmbedBuilder()
        .setTitle("인증 채널")
        .setDescription(
          `아래 **인증하기** 버튼을 눌러 인증하거나\n/인증 명령어를 사용하여 인증을 진행하라냥.\n인증하시면 ${role} 역할이 지급된다냥`
        )
        .setColor("Orange");
      const Btn = new ButtonBuilder()
        .setCustomId("verify")
        .setLabel("인증하기")
        .setEmoji("✅")
        .setStyle(ButtonStyle.Success);
      interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription("⛩️ 인증 설정이 완료되었다냥")
            .setColor("Orange"),
        ],
      });
      const Verifychannel = client.channels.cache.get(channel.id);
      Verifychannel.send({
        embeds: [Embed],
        components: [new ActionRowBuilder().addComponents(Btn)],
      });
    },
  };