import { SlashCommandBuilder, EmbedBuilder } from "discord.js";

const images = [
  "https://nekobot.xyz/api/image?type=ass",
  "https://nekobot.xyz/api/image?type=hentai",
  "https://nekobot.xyz/api/image?type=hneko"
];

export default {
  data: new SlashCommandBuilder()
    .setName("nsfw2")
    .setDescription("추가 NSFW 이미지를 불러와 😼"),

  async execute(interaction) {
    if (!interaction.channel?.nsfw) {
      return interaction.reply({
        content: "흥... NSFW 채널에서만 사용할 수 있어 😤",
        ephemeral: true,
      });
    }

    const random = images[Math.floor(Math.random() * images.length)];

    const embed = new EmbedBuilder()
      .setTitle("🦊 NSFW2")
      .setDescription("나츠미가 몰래 가져왔어 😼")
      .setImage(random)
      .setColor("#ff4f8b");

    return interaction.reply({ embeds: [embed] });
  },
};
