import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } from "discord.js";

const categories = [
  { name: "🔥 Hentai", value: "hentai" },
  { name: "🍑 Ass", value: "ass" },
  { name: "🍒 Boobs", value: "boobs" },
  { name: "🍼 Paizuri", value: "paizuri" },
  { name: "🐱 HNeko", value: "hneko" },
  { name: "🦊 HKitsune", value: "hkitsune" },
  { name: "🎀 Kemonomimi", value: "kemonomimi" },
  { name: "✨ Kanna", value: "kanna" },
  { name: "🌸 Holo", value: "holo" },
  { name: "🎥 PGif", value: "pgif" },
  { name: "💫 4K", value: "4k" }
];

export default {
  data: new SlashCommandBuilder()
    .setName("nsfw2")
    .setDescription("NSFW 카테고리를 선택해서 이미지를 불러와 😼")
    .setNSFW(true),

  async execute(interaction) {
    if (!interaction.channel?.nsfw) {
      return interaction.reply({
        content: "흥... NSFW 채널에서만 사용할 수 있어 😤",
        ephemeral: true,
      });
    }

    const menu = new StringSelectMenuBuilder()
      .setCustomId("nsfw2_category")
      .setPlaceholder("카테고리를 선택해 😼")
      .addOptions(
        categories.map((c) => ({
          label: c.name,
          value: c.value,
        }))
      );

    const row = new ActionRowBuilder().addComponents(menu);

    const embed = new EmbedBuilder()
      .setTitle("🦊 NSFW2 카테고리")
      .setDescription("원하는 카테고리를 골라봐 😼")
      .setColor("#ff4f8b");

    return interaction.reply({
      embeds: [embed],
      components: [row],
    });
  },
};
