import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { buildPremiumHeartPrompt, checkPremiumHeart } from "../../utils/premiumHeart.js";
import { fetchSfwImage, getCategoryLabel, sfwCategories } from "../../utils/imageFetchers.js";

export default {
  data: new SlashCommandBuilder()
    .setName("sfw")
    .setDescription("건전한 애니 이미지를 불러와요.")
    .addStringOption((option) =>
      option
        .setName("카테고리")
        .setDescription("보고 싶은 SFW 이미지 종류를 선택해줘.")
        .setRequired(true)
        .addChoices(...sfwCategories.map((category) => ({ name: category.name, value: category.value })))
    ),

  async execute(interaction) {
    const heart = await checkPremiumHeart(interaction.user.id);
    if (!heart.ok) {
      return interaction.reply(buildPremiumHeartPrompt(interaction.user.id, heart));
    }

    await interaction.deferReply();

    const category = interaction.options.getString("카테고리", true);
    try {
      const image = await fetchSfwImage(category);
      const label = getCategoryLabel(sfwCategories, category);
      const embed = new EmbedBuilder()
        .setColor("#FF8F3D")
        .setTitle(`SFW · ${label}`)
        .setDescription("프리미엄 하트 인증 확인 완료.")
        .setImage(image.url)
        .setFooter({ text: `Source: ${image.source}` })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error(`[SFW] Image fetch failed (${category}):`, error.message);
      return interaction.editReply({
        content: "**이미지를 불러오지 못했어요. 잠시 뒤 다시 시도해줘.**",
      });
    }
  },
};
