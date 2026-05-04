import {
  ContextMenuCommandBuilder,
  EmbedBuilder,
  ApplicationCommandType,
} from "discord.js";

export default {
  data: new ContextMenuCommandBuilder()
    .setName("개표")
    .setType(ApplicationCommandType.Message),
  /**
   * @param {import("discord.js").ContextMenuCommandInteraction} interaction
   */
  async execute(interaction) {
    if (!interaction.deferred && !interaction.replied) await interaction.deferReply({ ephemeral: true });
    
    const message = interaction.targetMessage;

    // Check if it's a vote message (Check if reactions exist or if it's from current client)
    // We expect 👍 and 👎 reactions
    await message.fetch();
    const good_count = (message.reactions.cache.get("👍")?.count || 1) - 1;
    const bad_count = (message.reactions.cache.get("👎")?.count || 1) - 1;

    if (good_count === 0 && bad_count === 0 && !message.embeds[0]) {
      return interaction.editReply({
        content: `**투표 메시지가 아니거나 아무도 참여하지 않았다냥!**`,
      });
    }

    const total = good_count + bad_count;
    
    // Calculate percentages safely (handle total = 0)
    const goodPercent = total > 0 ? Math.round((good_count / total) * 100) : 0;
    const badPercent = total > 0 ? Math.round((bad_count / total) * 100) : 0;

    // Remove reactions
    await message.reactions.removeAll().catch(() => {});

    const originalEmbed = message.embeds[0];
    const topic = originalEmbed?.description?.split('\n')[0] || "알 수 없는 주제";

    const embed = new EmbedBuilder()
      .setTitle("🏁 투표 결과 발표")
      .setDescription(`${topic}\n\n투표가 성공적으로 마감되었다냥! 결과는 아래와 같다냥.`)
      .setThumbnail(interaction.client.user.displayAvatarURL())
      .setTimestamp();

    let resultText = "";
    if (good_count > bad_count) {
      embed.setColor("#2ECC71"); // Green
      resultText = "✅ **찬성 승리!** 의견이 수렴되었다냥.";
    } else if (bad_count > good_count) {
      embed.setColor("#E74C3C"); // Red
      resultText = "❌ **반대 승리!** 의견이 기각되었다냥.";
    } else {
      embed.setColor("#95A5A6"); // Grey
      resultText = "⚖️ **무승부!** 의견이 팽팽하다냥.";
    }

    embed.addFields(
      { name: "📈 결과 요약", value: resultText },
      { name: "👍 찬성", value: `\`${good_count}표\` (${goodPercent}%)`, inline: true },
      { name: "👎 반대", value: `\`${bad_count}표\` (${badPercent}%)`, inline: true },
      { name: "👥 총 참여 수", value: `\`${total}명\``, inline: true }
    );

    await message.edit({ embeds: [embed] });
    await interaction.editReply({ content: `**개표가 완료되었다냥! 결과를 확인해 주라냥.**` });
  },
};
