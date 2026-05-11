import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import NatsumiAnonIdentity from "../models/NatsumiAnonIdentity.js";

const randomAnonIp = () => {
  const first = Math.floor(Math.random() * 223) + 1;
  const second = Math.floor(Math.random() * 255);
  return `${first}.${second}`;
};

const getOrCreateAnonIp = async (guildId, userId) => {
  const existing = await NatsumiAnonIdentity.findOne({ guildId, userId });
  if (existing?.anonIp) return existing.anonIp;

  const created = await NatsumiAnonIdentity.create({
    guildId,
    userId,
    anonIp: randomAnonIp(),
    updatedAt: new Date(),
  });

  return created.anonIp;
};

const resetAnonIp = async (guildId, userId) => {
  const anonIp = randomAnonIp();
  await NatsumiAnonIdentity.findOneAndUpdate(
    { guildId, userId },
    { guildId, userId, anonIp, updatedAt: new Date() },
    { upsert: true, new: true }
  );
  return anonIp;
};

const buildAnonButtons = () => [
  new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("NatsumiAnon_open")
      .setLabel("새 메시지 작성")
      .setEmoji("🎭")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("NatsumiAnon_reset")
      .setLabel("유동 IP 초기화")
      .setEmoji("🌀")
      .setStyle(ButtonStyle.Secondary)
  ),
];

const openModal = async (interaction) => {
  const modal = new ModalBuilder()
    .setCustomId("NatsumiAnon_submit")
    .setTitle("나츠미 익명 메시지");

  const input = new TextInputBuilder()
    .setCustomId("message")
    .setLabel("익명으로 보낼 내용을 적어줘")
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder("여기에 메시지를 적으면 가상 유동 IP로 익명 전송돼.")
    .setRequired(true)
    .setMaxLength(1500);

  modal.addComponents(new ActionRowBuilder().addComponents(input));
  return interaction.showModal(modal);
};

const sendAnonymousMessage = async (interaction, content) => {
  const anonIp = await getOrCreateAnonIp(interaction.guildId, interaction.user.id);
  const embed = new EmbedBuilder()
    .setColor("#ff7aa8")
    .setAuthor({ name: `ㅇㅇ(${anonIp})` })
    .setDescription(content)
    .setFooter({ text: "나츠미 익명 가면방 · 실제 IP가 아닌 가상 유동 ID입니다" })
    .setTimestamp();

  return interaction.channel.send({ embeds: [embed], components: buildAnonButtons() });
};

export default {
  name: "NatsumiAnon",

  async execute(interaction) {
    if (!interaction.guild) {
      return interaction.reply({ content: "서버에서만 사용할 수 있어 😤", ephemeral: true });
    }

    if (interaction.isButton() && interaction.customId === "NatsumiAnon_open") {
      await interaction.message.delete().catch(() => {});
      return openModal(interaction);
    }

    if (interaction.isButton() && interaction.customId === "NatsumiAnon_reset") {
      const anonIp = await resetAnonIp(interaction.guildId, interaction.user.id);
      await interaction.message.delete().catch(() => {});
      return interaction.reply({
        content: `IP변경: \`${anonIp}\`\n필독`,
        components: [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("NatsumiAnon_open")
              .setLabel("새 메시지 보내기")
              .setStyle(ButtonStyle.Primary)
          ),
        ],
        ephemeral: true,
      });
    }

    if (interaction.isModalSubmit() && interaction.customId === "NatsumiAnon_submit") {
      const content = interaction.fields.getTextInputValue("message")?.trim();
      if (!content) {
        return interaction.reply({ content: "내용이 비어있어. 장난치는 거야? 😤", ephemeral: true });
      }

      await sendAnonymousMessage(interaction, content);
      return interaction.reply({ content: "🎭 익명 메시지를 보냈어. 이번에도 정체는 숨겨줬다구, 흥.", ephemeral: true });
    }
  },
};
