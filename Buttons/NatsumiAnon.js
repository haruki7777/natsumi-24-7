import {
  ActionRowBuilder,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";

const anonymousNames = ["유동 여우", "가면 쓴 손님", "달빛 그림자", "익명 꼬리", "무명 손님", "비밀 목소리"];
const randomAnonId = () => Math.floor(1000 + Math.random() * 9000);
const randomAnonName = () => `${anonymousNames[Math.floor(Math.random() * anonymousNames.length)]}#${randomAnonId()}`;

const openModal = async (interaction) => {
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
};

export default {
  name: "NatsumiAnon",

  async execute(interaction) {
    if (interaction.isButton() && interaction.customId === "NatsumiAnon_open") {
      return openModal(interaction);
    }

    if (interaction.isButton() && interaction.customId === "NatsumiAnon_shuffle") {
      await interaction.message.delete().catch(() => {});
      return openModal(interaction);
    }

    if (interaction.isModalSubmit() && interaction.customId === "NatsumiAnon_submit") {
      const content = interaction.fields.getTextInputValue("message")?.trim();
      if (!content) {
        return interaction.reply({ content: "내용이 비어있어. 장난치는 거야? 😤", ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setColor("#ff7aa8")
        .setAuthor({ name: randomAnonName() })
        .setDescription(content)
        .setFooter({ text: "나츠미 익명 가면방 · 실제 IP가 아닌 유동 익명 ID입니다" })
        .setTimestamp();

      await interaction.channel.send({ embeds: [embed] });
      return interaction.reply({ content: "🎭 익명 메시지를 보냈어. 누가 썼는지는 비밀이야, 흥.", ephemeral: true });
    }
  },
};
