import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
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

const cleanupAnonymousMessages = async (channel) => {
  const messages = await channel.messages.fetch({ limit: 50 }).catch(() => null);
  if (!messages) return;

  const targets = messages.filter((msg) => {
    if (msg.pinned) return false;
    if (msg.author?.bot) return true;
    if (msg.webhookId) return true;
    if (msg.components?.length) return true;
    if (msg.embeds?.some((embed) => String(embed.footer?.text || "").includes("나츠미 익명"))) return true;
    return false;
  });

  for (const msg of targets.values()) {
    await msg.delete().catch(() => {});
  }
};

const checkAnonChannel = async (interaction) => {
  const setup = await NatsumiGuildSetup.findOne({ guildId: interaction.guildId }).lean().catch(() => null);
  if (setup?.featureChannels?.anonymous && setup.featureChannels.anonymous !== interaction.channelId) {
    await interaction.reply({
      content: "익명 가면방 버튼은 서버셋업에서 지정한 익명 채널에서만 사용할 수 있어.",
      ephemeral: true,
    }).catch(() => {});
    return false;
  }
  return true;
};

export default {
  name: "NatsumiAnon",

  async execute(interaction) {
    if (!interaction.guild) {
      return interaction.reply({ content: "서버에서만 사용할 수 있어.", ephemeral: true });
    }

    const ok = await checkAnonChannel(interaction);
    if (!ok) return;

    if (interaction.isButton() && interaction.customId === "NatsumiAnon_open") {
      await cleanupAnonymousMessages(interaction.channel);
      return openModal(interaction);
    }

    if (interaction.isButton() && interaction.customId === "NatsumiAnon_reset") {
      const anonIp = await resetAnonIp(interaction.guildId, interaction.user.id);
      await cleanupAnonymousMessages(interaction.channel);
      return interaction.reply({
        content: `IP변경: \`${anonIp}\`\n필독`,
        components: [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("NatsumiAnon_open")
              .setLabel("새 메시지 보내기")
              .setEmoji("🎭")
              .setStyle(ButtonStyle.Primary)
          ),
        ],
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
