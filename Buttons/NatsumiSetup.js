import { PermissionFlagsBits } from "discord.js";
import { createNatsumiChannels } from "../utils/natsumiChannelSetup.js";

export default {
  name: "NatsumiSetup",
  async execute(interaction) {
    if (!interaction.isButton()) return;
    if (interaction.customId !== "NatsumiSetup_create") return;

    if (!interaction.guild) {
      return interaction.reply({ content: "서버에서만 사용할 수 있어 😤", ephemeral: true });
    }

    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels)) {
      return interaction.reply({
        content: "채널 관리 권한이 있어야 만들 수 있어. 아무나 막 만들면 난장판 되잖아 😤",
        ephemeral: true,
      });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const result = await createNatsumiChannels(interaction.guild, interaction.user.id);
      if (result.already) {
        return interaction.editReply({ content: "이미 나츠미 채널 구성이 만들어져 있어. 또 만들면 복잡해지거든 😼" });
      }

      return interaction.editReply({
        content: [
          "✅ 나츠미 전용 채널 구성을 만들었어!",
          "🤖 AI채팅 채널에서는 `나츠미` 호출어로 대화할 수 있어.",
          "일반 채널에서는 나츠미 호출어가 막히니까 착각하지 마 😤",
        ].join("\n"),
      });
    } catch (error) {
      console.error("[NatsumiSetup] channel setup failed:", error);
      return interaction.editReply({ content: "채널 생성 중 오류가 났어. 내 탓은 아니거든?! 권한을 확인해줘 😭" });
    }
  },
};
