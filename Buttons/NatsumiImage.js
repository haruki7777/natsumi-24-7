import {
  ActionRowBuilder,
  ModalBuilder,
  PermissionFlagsBits,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { buildImagePrompt, runNatsumiImageGeneration } from "../utils/natsumiAiImage.js";

const getFirstImage = (message) => {
  return message.attachments.find((file) => {
    const type = file.contentType || "";
    const name = file.name || "";
    return type.startsWith("image/") || /\.(png|jpe?g|webp|gif)$/i.test(name);
  });
};

const canManageResult = (interaction, ownerId) => {
  return interaction.user.id === ownerId
    || interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages);
};

const getResultImageUrl = (message) => {
  const attachment = message.attachments?.first?.();
  if (attachment?.url) return attachment.url;

  const textUrl = String(message.content || "").match(/https?:\/\/\S+/)?.[0];
  return textUrl || null;
};

export default {
  name: "NatsumiImage",
  async execute(interaction) {
    if (!interaction.customId?.startsWith("NatsumiImage_")) return;

    const parts = interaction.customId.split("_");
    const mode = parts[1];
    const messageId = parts.at(-1);

    if (interaction.isAnySelectMenu() && mode === "result") {
      const ownerId = parts[2];
      if (!canManageResult(interaction, ownerId)) {
        return interaction.reply({ content: "이 그림을 만든 사람만 정리할 수 있어요.", ephemeral: true });
      }

      const action = interaction.values?.[0];
      if (action === "delete") {
        await interaction.reply({ content: "그림 결과를 삭제했어요.", ephemeral: true }).catch(() => {});
        return interaction.message.delete().catch(() => {});
      }

      if (action === "save") {
        const imageUrl = getResultImageUrl(interaction.message);
        return interaction.reply({
          content: imageUrl
            ? `저장용 이미지 링크예요:\n${imageUrl}`
            : "이미지 링크를 찾지 못했어요. 메시지에 첨부된 이미지를 직접 열어주세요.",
          ephemeral: true,
        });
      }
    }

    if (interaction.isButton() && mode === "cancel") {
      await interaction.message.edit({ components: [] }).catch(() => {});
      return interaction.reply({ content: "이미지 작업을 취소했어요.", ephemeral: true });
    }

    if (interaction.isButton() && mode === "custom") {
      const modal = new ModalBuilder()
        .setCustomId(`NatsumiImage_modal_${messageId}`)
        .setTitle("AI그림 사용자 지정")
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId("prompt")
              .setLabel("프롬프트")
              .setStyle(TextInputStyle.Paragraph)
              .setRequired(true)
              .setMaxLength(1000)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId("negative")
              .setLabel("제외할 키워드")
              .setStyle(TextInputStyle.Paragraph)
              .setRequired(false)
              .setMaxLength(1000)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId("similarity")
              .setLabel("원본과의 유사도(%)")
              .setStyle(TextInputStyle.Short)
              .setRequired(false)
              .setPlaceholder("예: 50")
              .setMaxLength(3)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId("resolution")
              .setLabel("해상도")
              .setStyle(TextInputStyle.Short)
              .setRequired(false)
              .setPlaceholder("예: 768, 1080")
              .setMaxLength(5)
          )
        );
      return interaction.showModal(modal);
    }

    if (interaction.isModalSubmit() && mode === "modal") {
      await interaction.deferReply({ ephemeral: true });
      const sourceMessage = await interaction.channel.messages.fetch(messageId).catch(() => null);
      const image = sourceMessage ? getFirstImage(sourceMessage) : null;
      if (!sourceMessage || !image) return interaction.editReply("원본 이미지를 찾지 못했어요. 다시 올려주세요.");

      const prompt = buildImagePrompt({
        prompt: interaction.fields.getTextInputValue("prompt"),
        negative: interaction.fields.getTextInputValue("negative"),
        similarity: interaction.fields.getTextInputValue("similarity"),
        resolution: interaction.fields.getTextInputValue("resolution"),
      });
      const status = await interaction.channel.send("사용자 지정 프롬프트로 그림을 처리할게요. 예상 완료 시간은 약 30초예요.").catch(() => null);
      await runNatsumiImageGeneration({ message: sourceMessage, prompt, image, statusMessage: status });
      await interaction.message?.edit?.({ components: [] }).catch(() => {});
      return interaction.editReply("요청을 그림 채널에 보냈어요.");
    }

    if (interaction.isButton() && (mode === "convert" || mode === "resolution")) {
      await interaction.deferReply({ ephemeral: true });
      const sourceMessage = await interaction.channel.messages.fetch(messageId).catch(() => null);
      const image = sourceMessage ? getFirstImage(sourceMessage) : null;
      if (!sourceMessage || !image) return interaction.editReply("원본 이미지를 찾지 못했어요. 다시 올려주세요.");

      const resolution = mode === "resolution" ? parts[2] : "768";
      const prompt = buildImagePrompt({
        prompt: "Convert the attached image into one polished anime-style image while preserving the main subject.",
        resolution,
      });

      const status = await interaction.channel.send("AI그림 변환을 시작할게요. 0/1장, 예상 완료 시간은 약 30초예요.").catch(() => null);
      await runNatsumiImageGeneration({ message: sourceMessage, prompt, image, statusMessage: status });
      await interaction.message.edit({ components: [] }).catch(() => {});
      return interaction.editReply("요청을 그림 채널에 보냈어요.");
    }
  },
};
