import { ActionRowBuilder, EmbedBuilder, SlashCommandBuilder, StringSelectMenuBuilder } from "discord.js";
import { buildPremiumHeartPrompt, checkPremiumHeart } from "../../utils/premiumHeart.js";
import { sfwCategories } from "../../utils/imageFetchers.js";

export default {
  data: new SlashCommandBuilder()
    .setName("sfw")
    .setDescription("SFW 카테고리를 메뉴에서 선택해 이미지를 불러와요."),

  async execute(interaction) {
    const heart = await checkPremiumHeart(interaction.user.id);
    if (!heart.ok) {
      return interaction.reply(buildPremiumHeartPrompt(interaction.user.id, heart));
    }

    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`sfw_category_${interaction.user.id}`)
        .setPlaceholder("SFW 카테고리 선택")
        .addOptions(sfwCategories.map((category) => ({
          label: category.name,
          value: category.value,
        })))
    );

    const embed = new EmbedBuilder()
      .setColor("#FF8F3D")
      .setTitle("SFW 카테고리")
      .setDescription("12시간 하트 패스 확인 완료. 원하는 카테고리를 선택해줘.")
      .setTimestamp();

    return interaction.reply({ embeds: [embed], components: [row] });
  },
};
