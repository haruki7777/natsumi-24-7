import { EmbedBuilder } from "discord.js";
import { buildPremiumHeartPrompt, checkPremiumHeart } from "../utils/premiumHeart.js";
import { fetchNsfw2Image, getCategoryLabel, nsfw2Categories } from "../utils/imageFetchers.js";

export default {
  name: "nsfw2",

  async execute(interaction) {
    if (!interaction.isStringSelectMenu()) return;
    if (!interaction.customId.startsWith("nsfw2_category_")) return;

    const ownerId = interaction.customId.split("_").at(-1);
    if (ownerId && ownerId !== interaction.user.id) {
      return interaction.reply({
        content: "**이 선택 메뉴는 명령어를 실행한 사람만 사용할 수 있어요.**",
        ephemeral: true,
      });
    }

    if (!interaction.channel?.nsfw) {
      return interaction.reply({
        content: "**NSFW 전용 채널에서만 사용할 수 있어요.**",
        ephemeral: true,
      });
    }

    const heart = await checkPremiumHeart(interaction.user.id);
    if (!heart.ok) {
      return interaction.reply(buildPremiumHeartPrompt(interaction.user.id, heart));
    }

    const category = interaction.values?.[0];
    if (!nsfw2Categories.some((item) => item.value === category)) {
      return interaction.reply({
        content: "**없는 카테고리예요. 다시 선택해줘.**",
        ephemeral: true,
      });
    }

    await interaction.deferUpdate();

    try {
      const image = await fetchNsfw2Image(category);
      const label = getCategoryLabel(nsfw2Categories, category);
      const embed = new EmbedBuilder()
        .setColor("#FF4F8B")
        .setTitle(`NSFW2 · ${label}`)
        .setDescription("프리미엄 하트 인증 확인 완료.")
        .setImage(image.url)
        .setFooter({ text: `Source: ${image.source}` })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed], components: [] });
    } catch (error) {
      console.error(`[NSFW2] Image fetch failed (${category}):`, error.message);
      return interaction.editReply({
        content: "**이미지를 불러오지 못했어요. 다른 카테고리로 다시 시도해줘.**",
        embeds: [],
        components: [],
      });
    }
  },
};
