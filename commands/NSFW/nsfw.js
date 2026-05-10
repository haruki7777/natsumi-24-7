import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { buildPremiumHeartPrompt, checkPremiumHeart } from "../../utils/premiumHeart.js";
import { fetchNsfwImage, getCategoryLabel, nsfwCategories } from "../../utils/imageFetchers.js";

export default {
  data: new SlashCommandBuilder()
    .setName("nsfw")
    .setDescription("NSFW 전용 채널에서 이미지를 불러와요.")
    .setNSFW(true)
    .addStringOption((option) =>
      option
        .setName("카테고리")
        .setDescription("보고 싶은 NSFW 이미지 종류를 선택해줘.")
        .setRequired(true)
        .addChoices(...nsfwCategories.map((category) => ({ name: category.name, value: category.value })))
    ),

  async execute(interaction) {
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

    await interaction.deferReply();

    const category = interaction.options.getString("카테고리", true);
    try {
      const image = await fetchNsfwImage(category);
      const label = getCategoryLabel(nsfwCategories, category);
      const embed = new EmbedBuilder()
        .setColor("#FF4F8B")
        .setTitle(`NSFW · ${label}`)
        .setDescription("프리미엄 하트 인증 확인 완료.")
        .setImage(image.url)
        .setFooter({ text: `Source: ${image.source}` })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error(`[NSFW] Image fetch failed (${category}):`, error.message);
      return interaction.editReply({
        content: "**이미지를 불러오지 못했어요. 잠시 뒤 다시 시도해줘.**",
      });
    }
  },
};
