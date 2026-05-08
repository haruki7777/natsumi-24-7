import { buildPremiumHeartPrompt, checkPremiumHeart, clearPremiumHeartCache } from "../utils/premiumHeart.js";

export default {
  name: "PremiumHeartCheck",
  /**
   * @param {import("discord.js").ButtonInteraction} interaction
   */
  async execute(interaction) {
    const [, targetUserId] = interaction.customId.split("_");

    if (targetUserId && targetUserId !== interaction.user.id) {
      return interaction.reply({
        content: "이 하트 확인 버튼은 명령어를 쓴 사람만 누를 수 있어.",
        ephemeral: true,
      });
    }

    await interaction.deferReply({ ephemeral: true });
    clearPremiumHeartCache(interaction.user.id);

    const result = await checkPremiumHeart(interaction.user.id, { force: true });
    if (result.ok) {
      return interaction.editReply({
        content: "프리미엄 하트 확인 완료! 이제 `/nsfw`를 사용할 수 있어.",
        embeds: [],
        components: [],
      });
    }

    const prompt = buildPremiumHeartPrompt(interaction.user.id, result);
    delete prompt.ephemeral;
    return interaction.editReply(prompt);
  },
};
