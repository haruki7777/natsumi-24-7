import { PermissionFlagsBits } from "discord.js";
import { createEmojiFromMessage } from "../utils/natsumiEmoji.js";

export default {
  name: "NatsumiEmoji",
  async execute(interaction) {
    if (!interaction.isButton()) return;

    const [, mode, messageId] = interaction.customId.split("_");
    if (!["crop", "pad", "raw"].includes(mode) || !messageId) return;

    if (!interaction.guild) {
      return interaction.reply({ content: "서버에서만 사용할 수 있어요.", ephemeral: true });
    }

    const botMember = interaction.guild.members.me || await interaction.guild.members.fetchMe().catch(() => null);
    if (!botMember?.permissions?.has(PermissionFlagsBits.ManageGuildExpressions)) {
      return interaction.reply({
        content: "이모지와 스티커 관리 권한이 없어서 추가할 수 없어요.",
        ephemeral: true,
      });
    }

    await interaction.deferReply({ ephemeral: true });

    const sourceMessage = await interaction.channel.messages.fetch(messageId).catch(() => null);
    if (!sourceMessage) {
      return interaction.editReply("원본 이미지를 찾지 못했어요. 다시 이미지와 영어 이름을 올려주세요.");
    }

    try {
      const emoji = await createEmojiFromMessage({
        message: sourceMessage,
        mode,
        actorTag: interaction.user.tag,
      });

      await interaction.message.edit({ components: [] }).catch(() => {});
      return interaction.editReply(`이모지 추가 완료: ${emoji} / 이름: \`${emoji.name}\``);
    } catch (error) {
      console.error("[NatsumiEmojiButton] failed:", error);
      return interaction.editReply("이모지 추가에 실패했어요. 이미지 크기, 이름, 봇 권한을 확인해주세요.");
    }
  },
};
