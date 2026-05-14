import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import NatsumiGuildSetup from "../models/NatsumiGuildSetup.js";
import { resetAnonIp, sendAnonymousPlainMessage } from "../utils/natsumiAnonymous.js";

const cleanupAnonymousMessages = async (channel) => {
  const messages = await channel.messages.fetch({ limit: 100 }).catch(() => null);
  if (!messages) return 0;

  let deleted = 0;
  for (const msg of messages.values()) {
    if (msg.pinned) continue;
    const name = msg.author?.username || "";
    const content = msg.content || "";
    const shouldDelete = Boolean(
      msg.webhookId ||
      name.startsWith("ㅇㅇ(") ||
      content.startsWith("**ㅇㅇ(") ||
      msg.embeds?.some((embed) => String(embed.footer?.text || "").includes("익명"))
    );
    if (!shouldDelete) continue;
    await msg.delete().catch(() => {});
    deleted += 1;
  }
  return deleted;
};

const checkAnonChannel = async (interaction) => {
  const setup = await NatsumiGuildSetup.findOne({ guildId: interaction.guildId }).lean().catch(() => null);
  if (setup?.featureChannels?.anonymous && setup.featureChannels.anonymous !== interaction.channelId) {
    await interaction.reply({ content: "익명 가면방 버튼은 지정된 익명 채널에서만 사용할 수 있어.", ephemeral: true }).catch(() => {});
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
      const deleted = await cleanupAnonymousMessages(interaction.channel);
      return interaction.reply({
        content: deleted > 0
          ? `이전 익명 메시지 ${deleted}개를 정리했어. 이제 아래 입력창에 그냥 새 메시지를 보내면 돼 😼`
          : "정리할 익명 메시지는 없었어. 아래 입력창에 그냥 새 메시지를 보내면 돼 😼",
        ephemeral: true,
      });
    }

    if (interaction.isButton() && interaction.customId === "NatsumiAnon_reset") {
      const anonIp = await resetAnonIp(interaction.guildId, interaction.user.id);
      const deleted = await cleanupAnonymousMessages(interaction.channel);
      return interaction.reply({
        content: [`유동 IP를 \`${anonIp}\` 로 초기화했어.`, deleted > 0 ? `이전 익명 메시지 ${deleted}개도 정리했어.` : "정리할 익명 메시지는 없었어.", "이제 아래 입력창에 그냥 새 메시지를 보내면 새 번호로 표시돼."].join("\n"),
        ephemeral: true,
      });
    }

    if (interaction.isModalSubmit() && interaction.customId === "NatsumiAnon_submit") {
      const content = interaction.fields.getTextInputValue("message")?.trim();
      if (!content) return interaction.reply({ content: "내용이 비어있어.", ephemeral: true });
      await sendAnonymousPlainMessage({ channel: interaction.channel, guildId: interaction.guildId, userId: interaction.user.id, content });
      return interaction.reply({ content: "익명 메시지를 보냈어.", ephemeral: true });
    }
  },
};
