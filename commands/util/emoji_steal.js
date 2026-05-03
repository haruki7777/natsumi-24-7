import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import fetch from "node-fetch";

export default {
  data: new SlashCommandBuilder()
    .setName("이모지스틸")
    .setDescription("이모지를 서버로 가져온다냥!")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuildExpressions)
    .addStringOption((option) =>
      option.setName("이모지").setDescription("가져올 이모지를 입력해주라냥").setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("이름").setDescription("새로 만들 이모지 이름을 입력해주라냥 (영문 권장)").setRequired(true)
    ),
  /**
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    await interaction.deferReply();
    let emoji = interaction.options.getString("이모지").trim();
    const name = interaction.options.getString("이름");

    let url = emoji;

    if (emoji.startsWith("<") && emoji.endsWith(">")) {
      const idMatch = emoji.match(/\d{15,}/);
      if (!idMatch) return interaction.editReply("올바른 이모지가 아니다냥!");
      const id = idMatch[0];
      const isAnimated = emoji.includes(":a:");
      url = `https://cdn.discordapp.net/emojis/${id}.${isAnimated ? "gif" : "png"}?quality=lossless`;
    }

    try {
      const createdEmoji = await interaction.guild.emojis.create({
        attachment: url,
        name: name,
        reason: `${interaction.user.tag} 유저가 이모지 스틸 요청함`
      });

      const embed = new EmbedBuilder()
        .setTitle("✅ 이모지 스틸 성공!")
        .setDescription(`성공적으로 <:${createdEmoji.name}:${createdEmoji.id}> 이모지를 추가했다냥!`)
        .setColor("Orange")
        .setThumbnail(url);

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      await interaction.editReply({ content: "**이모지를 추가하는 도중에 오류가 발생했다냥!**" });
    }
  },
};
