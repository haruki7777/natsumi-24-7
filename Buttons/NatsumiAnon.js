import {
  ActionRowBuilder,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";

const anonymousNames = ["익명의 여우", "가면 쓴 손님", "달빛 그림자", "조용한 목소리", "수상한 꼬리"];

export default {
  name: "NatsumiAnon",

  async execute(interaction) {
    if (interaction.isButton() && interaction.customId === "NatsumiAnon_open") {
      const modal = new ModalBuilder()
        .setCustomId("NatsumiAnon_submit")
        .setTitle("나츠미 익명 메시지");

      const input = new TextInputBuilder()
        .setCustomId("message")
        .setLabel("익명으로 보낼 내용을 적어줘")
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder("여기에 메시지를 적으면 나츠미가 익명으로 보내줄게.")
        .setRequired(true)
        .setMaxLength(1500);

      modal.addComponents(new ActionRowBuilder().addComponents(input));
      return interaction.showModal(modal);
    }

    if (interaction.isModalSubmit() && interaction.customId === "NatsumiAnon_submit") {
      const content = interaction.fields.getTextInputValue("message")?.trim();
      if (!content) {
        return interaction.reply({ content: "내용이 비어있어. 장난치는 거야? 😤", ephemeral: true });
      }

      const name = anonymousNames[Math.floor(Math.random() * anonymousNames.length)];
      const embed = new EmbedBuilder()
        .setColor("#ff7aa8")
        .setAuthor({ name })
        .setDescription(content)
        .setFooter({ text: "나츠미 익명 가면방" })
        .setTimestamp();

      await interaction.channel.send({ embeds: [embed] });
      return interaction.reply({ content: "🎭 익명 메시지를 보냈어. 누가 썼는지는 비밀이야, 흥.", ephemeral: true });
    }
  },
};
