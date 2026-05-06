import { 
  SlashCommandBuilder, 
  ModalBuilder, 
  ActionRowBuilder, 
  TextInputBuilder, 
  TextInputStyle, 
  EmbedBuilder 
} from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("문의")
    .setDescription("나츠미의 관리인에게 할 말이 있어? (나한테 직접 말하는 건 부끄러운 거야?)"),
  /**
  * @param {import("discord.js").ChatInputCommandInteraction} interaction
  */
  async execute(interaction) {
    // Note: showModal cannot be used after deferReply
    const modal = new ModalBuilder()
      .setCustomId("inquiry_modal")
      .setTitle("📝 나츠미에게 보내는 편지");

    const nameInput = new TextInputBuilder()
      .setCustomId("name")
      .setLabel("너의 이름 (닉네임이라도 써!)")
      .setPlaceholder("누가 보냈는지는 알아야 할 거 아냐!")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const contentInput = new TextInputBuilder()
      .setCustomId("content")
      .setLabel("전하고 싶은 말")
      .setPlaceholder("나츠미한테 바라는 점이나 궁금한 걸 적어봐. 흥!")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(nameInput),
      new ActionRowBuilder().addComponents(contentInput)
    );

    await interaction.showModal(modal);

    try {
      const submission = await interaction.awaitModalSubmit({
        time: 15 * 60 * 1000,
        filter: i => i.customId === 'inquiry_modal' && i.user.id === interaction.user.id,
      });

      if (submission) {
        const nameValue = submission.fields.getTextInputValue("name");
        const contentValue = submission.fields.getTextInputValue("content");

        const embed = new EmbedBuilder()
          .setTitle(`📩 여우 숲에 도착한 서신`)
          .setDescription(`**작성자:** ${nameValue}\n\n**내용:**\n${contentValue}`)
          .setFooter({ text: `ID: ${interaction.user.id} | ${interaction.user.tag}` })
          .setColor("#FF7F50")
          .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
          .setTimestamp();

        const devChannelId = "1072349046859108402";
        const devChannel = interaction.client.channels.cache.get(devChannelId);

        if (devChannel) {
          await devChannel.send({ embeds: [embed] });
        }

        await submission.reply({
          ephemeral: true,
          content: `**✅ 네 편지는 관리인한테 잘 전달했어! 별로 널 위해서 해준 건 아니니까 고마워하지 않아도 돼! 흥!**`,
        });
      }
    } catch (err) {
      // time out or error
    }
  },
};
