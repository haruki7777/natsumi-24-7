import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import fetch from "node-fetch";

export default {
  data: new SlashCommandBuilder()
    .setName("이모지스틸")
    .setDescription("다른 곳의 예쁜 이모지를 내가 가져와 줄게! 콘콘!")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuildExpressions)
    .addStringOption((option) =>
      option.setName("이모지").setDescription("가져오고 싶은 이모지를 여기 넣어봐!").setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("이름").setDescription("새로 지어줄 이름은 뭐야? (영문 권장)").setRequired(true)
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
      if (!idMatch) return interaction.editReply("흥! 제대로 된 이모지를 가져와야 할 거 아냐! 바보야?");
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
        .setTitle("✅ 이모지 획득 완료! 콘콘!")
        .setDescription(`흥, 특별히 이 숲에 **${createdEmoji.name}** 이모지를 심어줬어! \n**나한테 고마워하라고! 알겠어?** ♥(⸝⸝⸝ᵒ̴̶̷̥́ ᵕ ก̀⸝⸝⸝)ෆ`)
        .setColor("#FF7F50")
        .setThumbnail(url);

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      await interaction.editReply({ content: "**으악! 내 영력이 부족한 건지 오류가 났어! 바보야!**" });
    }
  },
};
