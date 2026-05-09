import { EmbedBuilder } from "discord.js";

const labels = {
  hentai: "🔥 Hentai",
  ass: "🍑 Ass",
  boobs: "🍒 Boobs",
  paizuri: "🍼 Paizuri",
  hneko: "🐱 HNeko",
  hkitsune: "🦊 HKitsune",
  kemonomimi: "🎀 Kemonomimi",
  kanna: "✨ Kanna",
  holo: "🌸 Holo",
  pgif: "🎥 PGif",
  "4k": "💫 4K",
};

export default {
  name: "nsfw2",

  async execute(interaction) {
    if (!interaction.isStringSelectMenu()) return;
    if (interaction.customId !== "nsfw2_category") return;

    if (!interaction.channel?.nsfw) {
      return interaction.reply({
        content: "흥... NSFW 채널에서만 사용할 수 있어 😤",
        ephemeral: true,
      });
    }

    const category = interaction.values?.[0];
    if (!category || !labels[category]) {
      return interaction.reply({
        content: "알 수 없는 카테고리야. 다시 선택해줘 😭",
        ephemeral: true,
      });
    }

    await interaction.deferUpdate();

    try {
      const response = await fetch(`https://nekobot.xyz/api/image?type=${encodeURIComponent(category)}`);
      if (!response.ok) throw new Error(`nekobot ${response.status}`);

      const data = await response.json();
      const imageUrl = data?.message;
      if (!imageUrl) throw new Error("image url missing");

      const embed = new EmbedBuilder()
        .setTitle(`🦊 NSFW2 · ${labels[category]}`)
        .setDescription("하트 인증 확인 완료. 12시간 안에는 사용할 수 있어 😼")
        .setImage(imageUrl)
        .setColor("#ff4f8b")
        .setTimestamp();

      return interaction.editReply({ embeds: [embed], components: [] });
    } catch (error) {
      return interaction.editReply({
        content: "이미지를 불러오지 못했어. 다른 카테고리로 다시 시도해줘 😭",
        embeds: [],
        components: [],
      });
    }
  },
};
