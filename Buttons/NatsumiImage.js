import { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from "discord.js";
import { runNatsumiImageGeneration } from "../utils/natsumiAiImage.js";

const getFirstImage = (message) => {
  return message.attachments.find((file) => {
    const type = file.contentType || "";
    const name = file.name || "";
    return type.startsWith("image/") || /\.(png|jpe?g|webp|gif)$/i.test(name);
  });
};

export default {
  name: "NatsumiImage",
  async execute(interaction) {
    const parts = interaction.customId.split("_");
    const mode = parts[1];
    const messageId = parts.at(-1);

    if (interaction.isButton() && mode === "cancel") {
      await interaction.message.edit({ components: [] }).catch(() => {});
      return interaction.reply({ content: "이미지 작업을 취소했어요.", ephemeral: true });
    }

    if (interaction.isButton() && mode === "custom") {
      const modal = new ModalBuilder()
        .setCustomId(`NatsumiImage_modal_${messageId}`)
        .setTitle("AI그림 그리기 설정")
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId("prompt")
              .setLabel("프롬프트 키워드")
              .setStyle(TextInputStyle.Paragraph)
              .setRequired(true)
              .setMaxLength(1000)
          )
        );
      return interaction.showModal(modal);
    }

    if (interaction.isModalSubmit() && mode === "modal") {
      await interaction.deferReply({ ephemeral: true });
      const sourceMessage = await interaction.channel.messages.fetch(messageId).catch(() => null);
      const image = sourceMessage ? getFirstImage(sourceMessage) : null;
      if (!sourceMessage || !image) return interaction.editReply("원본 이미지를 찾지 못했어요. 다시 올려주세요.");

      const prompt = interaction.fields.getTextInputValue("prompt");
      const status = await interaction.channel.send("사용자 지정 프롬프트로 그림을 처리할게요.").catch(() => null);
      await runNatsumiImageGeneration({ message: sourceMessage, prompt, image, statusMessage: status });
      await interaction.message?.edit?.({ components: [] }).catch(() => {});
      return interaction.editReply("요청을 그림 채널에 보냈어요.");
    }

    if (interaction.isButton() && (mode === "convert" || mode === "resolution")) {
      await interaction.deferReply({ ephemeral: true });
      const sourceMessage = await interaction.channel.messages.fetch(messageId).catch(() => null);
      const image = sourceMessage ? getFirstImage(sourceMessage) : null;
      if (!sourceMessage || !image) return interaction.editReply("원본 이미지를 찾지 못했어요. 다시 올려주세요.");

      const resolution = mode === "resolution" ? parts[2] : null;
      const prompt = resolution
        ? `Convert the attached image into a polished anime-style image. Target long-side resolution: ${resolution}p.`
        : "Convert the attached image into a polished anime-style image while preserving the main subject.";

      const status = await interaction.channel.send("AI그림 변환을 시작할게요.").catch(() => null);
      await runNatsumiImageGeneration({ message: sourceMessage, prompt, image, statusMessage: status });
      await interaction.message.edit({ components: [] }).catch(() => {});
      return interaction.editReply("요청을 그림 채널에 보냈어요.");
    }
  },
};
