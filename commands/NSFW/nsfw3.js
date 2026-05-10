import { ActionRowBuilder, EmbedBuilder, SlashCommandBuilder, StringSelectMenuBuilder } from "discord.js";
import { buildPremiumHeartPrompt, checkPremiumHeart } from "../../utils/premiumHeart.js";
import { nsfw3Categories } from "../../utils/imageFetchers.js";

export default {
  data: new SlashCommandBuilder()
    .setName("nsfw3")
    .setDescription("NSFW3 추가 카테고리를 메뉴에서 선택해 이미지를 불러와요.")
    .setNSFW(true),

  async execute(interaction) {
    if (!interaction.channel?.nsfw) {
      return interaction.reply({ content: "**NSFW 전용 채널에서만 사용할 수 있어요.**", ephemeral: true });
    }

    const heart = await checkPremiumHeart(interaction.user.id);
    if (!heart.ok) {
      return interaction.reply(buildPremiumHeartPrompt(interaction.user.id, heart));
    }

    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`nsfw3_category_${interaction.user.id}`)
        .setPlaceholder("NSFW3 카테고리 선택")
        .addOptions(nsfw3Categories.map((category) => ({
          label: category.name,
          value: category.value,
        })))
    );

    const embed = new EmbedBuilder()
      .setColor("#FF4F8B")
      .setTitle("NSFW3 추가 카테고리")
      .setDescription("12시간 하트 패스 확인 완료. 원하는 카테고리를 선택해줘.")
      .setTimestamp();

    return interaction.reply({ embeds: [embed], components: [row] });
  },
};
