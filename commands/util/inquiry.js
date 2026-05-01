const { 
  SlashCommandBuilder, 
  ModalBuilder, 
  ActionRowBuilder, 
  TextInputBuilder, 
  TextInputStyle, 
  EmbedBuilder 
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("문의")
    .setDescription("나츠미 개발자에게 문의할 사항을 적어주라냥"),
  /**
  * @param {import("discord.js").ChatInputCommandInteraction} interaction
  */
  async execute(interaction) {
    // Note: showModal cannot be used after deferReply
    const modal = new ModalBuilder()
      .setCustomId("inquiry_modal")
      .setTitle("📝 나츠미 봇 문의서");

    const nameInput = new TextInputBuilder()
      .setCustomId("name")
      .setLabel("당신의 이름(또는 닉네임)")
      .setPlaceholder("이름을 적어주라냥!")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const contentInput = new TextInputBuilder()
      .setCustomId("content")
      .setLabel("문의 내용")
      .setPlaceholder("나츠미에게 하고 싶은 말을 적어주라냥!")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(nameInput),
      new ActionRowBuilder().addComponents(contentInput)
    );

    await interaction.showModal(modal);

    // Results are handled by interactionCreate event or awaitModalSubmit (if not deferred)
    // But since we want to handle it here:
    try {
      const submission = await interaction.awaitModalSubmit({
        time: 15 * 60 * 1000,
        filter: i => i.customId === 'inquiry_modal' && i.user.id === interaction.user.id,
      });

      if (submission) {
        const nameValue = submission.fields.getTextInputValue("name");
        const contentValue = submission.fields.getTextInputValue("content");

        const embed = new EmbedBuilder()
          .setTitle(`📩 새로운 문의 도착!`)
          .setDescription(`**작성자:** ${nameValue}\n\n**내용:**\n${contentValue}`)
          .setFooter({ text: `유저 아이디: ${interaction.user.id} | ${interaction.user.tag}` })
          .setColor("Green")
          .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
          .setTimestamp();

        // Developer channel ID from original code
        const devChannelId = "1072349046859108402";
        const devChannel = interaction.client.channels.cache.get(devChannelId);

        if (devChannel) {
          await devChannel.send({ embeds: [embed] });
        }

        await submission.reply({
          ephemeral: true,
          content: `**✅ 문의가 제작자에게 성공적으로 전송되었다냥! 고맙다냥!**`,
        });
      }
    } catch (err) {
      // time out or error
    }
  },
};
