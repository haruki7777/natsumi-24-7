import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import NatsumiGuildSetup from "../models/NatsumiGuildSetup.js";
import { resetAnonIp, sendAnonymousPlainMessage } from "../utils/natsumiAnonymous.js";

const openModal = async (interaction) => {
  const modal = new ModalBuilder()
    .setCustomId("NatsumiAnon_submit")
    .setTitle("나츠미 익명 메시지");

  const input = new TextInputBuilder()
    .setCustomId("message")
    .setLabel("익명으로 보낼 내용을 적어줘")
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder("여기에 메시지를 적으면 유동 IP 닉네임으로 전송돼.")
    .setRequired(true)
    .setMaxLength(1500);

  modal.addComponents(new ActionRowBuilder().addComponents(input));
  return interaction.showModal(modal);
};

export default {
  name: "NatsumiAnon",

  async execute(interaction) {
    if (!interaction.guild) {
      return interaction.reply({ content: "서버에서만 사용할 수 있어.", ephemeral: true });
    }

    const setup = await NatsumiGuildSetup.findOne({ guildId: interaction.guildId }).lean().catch(() => null);
    if (setup?.featureChannels?.anonymous && setup.featureChannels.anonymous !== interaction.channelId) {
      return interaction.reply({
        content: "익명 가면방 버튼은 서버셋업에서 지정한 익명 채널에서만 사용할 수 있어.",
        ephemeral: true,
      });
    }

    if (interaction.isButton() && interaction.customId === "NatsumiAnon_open") {
      return openModal(interaction);
    }

    if (interaction.isButton() && interaction.customId === "NatsumiAnon_reset") {
      const anonIp = await resetAnonIp(interaction.guildId, interaction.user.id);
      return interaction.reply({
        content: `유동 IP를 \`${anonIp}\` 로 초기화했어. 다음 익명 메시지부터 새 IP로 표시돼.`,
        ephemeral: true,
      });
    }

    if (interaction.isModalSubmit() && interaction.customId === "NatsumiAnon_submit") {
      const content = interaction.fields.getTextInputValue("message")?.trim();
      if (!content) {
        return interaction.reply({ content: "내용이 비어있어.", ephemeral: true });
      }

      await sendAnonymousPlainMessage({
        channel: interaction.channel,
        guildId: interaction.guildId,
        userId: interaction.user.id,
        content,
      });
      return interaction.reply({ content: "익명 메시지를 보냈어.", ephemeral: true });
    }
  },
};
