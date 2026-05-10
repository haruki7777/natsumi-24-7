import { ActionRowBuilder, EmbedBuilder, SlashCommandBuilder, StringSelectMenuBuilder } from "discord.js";
import { buildPremiumHeartPrompt, checkPremiumHeart } from "../../utils/premiumHeart.js";
import { nsfw2Categories } from "../../utils/imageFetchers.js";

const chunk = (items, size) => {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
};

export default {
  data: new SlashCommandBuilder()
    .setName("nsfw2")
    .setDescription("NSFW 카테고리를 메뉴에서 선택해 이미지를 불러와요.")
    .setNSFW(true),

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

    const rows = chunk(nsfw2Categories, 25).map((categories, index) =>
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`nsfw2_category_${index + 1}_${interaction.user.id}`)
          .setPlaceholder(index === 0 ? "NSFW2 카테고리 선택" : "NSFW2 추가 카테고리 선택")
          .addOptions(categories.map((category) => ({
            label: category.name,
            value: category.value,
          })))
      )
    );

    const embed = new EmbedBuilder()
      .setColor("#FF4F8B")
      .setTitle("NSFW2 카테고리")
      .setDescription("프리미엄 하트 인증 확인 완료. 원하는 카테고리를 선택해줘.")
      .setTimestamp();

    return interaction.reply({
      embeds: [embed],
      components: rows,
    });
  },
};
