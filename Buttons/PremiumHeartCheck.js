import { buildPremiumHeartPrompt, checkPremiumHeart, clearPremiumHeartCache } from "../utils/premiumHeart.js";

export default {
  name: "PremiumHeartCheck",

  async execute(interaction) {
    const [, targetUserId] = interaction.customId.split("_");

    if (targetUserId && targetUserId !== interaction.user.id) {
      return interaction.reply({
        content: "이 하트 확인 버튼은 명령어를 실행한 사람만 사용할 수 있어요.",
        ephemeral: true,
      });
    }

    await interaction.deferReply({ ephemeral: true });
    clearPremiumHeartCache(interaction.user.id);

    const result = await checkPremiumHeart(interaction.user.id, { force: true });
    if (result.ok) {
      const expiresAt = Math.floor(new Date(result.expiresAt).getTime() / 1000);
      return interaction.editReply({
        content: `프리미엄 하트 확인 완료! 이제 12시간 동안 \`/sfw\`, \`/애니짤\`, \`/nsfw\`, \`/nsfw2\`, \`/nsfw3\`를 사용할 수 있어요.\n만료: <t:${expiresAt}:R>`,
        embeds: [],
        components: [],
      });
    }

    const prompt = buildPremiumHeartPrompt(interaction.user.id, result);
    delete prompt.ephemeral;
    return interaction.editReply(prompt);
  },
};
