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

    // Strict Validation: Check if it's a valid Natsumi vote message
    const isBotAuthor = message.author.id === interaction.client.user.id;
    const originalEmbed = message.embeds[0];
    const isVoteTitle = originalEmbed?.data?.title === "📊 나츠미의 공정한 투표소";

    if (!isBotAuthor || !isVoteTitle) {
      return interaction.editReply({
        content: `❌ **이 메시지는 나츠미가 생성한 투표 메시지가 아니야!**\n나츠미의 \`/투표\` 명령어로 만든 메시지에만 이 기능을 사용할 수 있다구! 콘콘!`,
      });
    }

    const fetchedMessage = await message.fetch(true);
    
    // Explicitly find the reactions to avoid cache key issues with unicode
    const goodReaction = fetchedMessage.reactions.cache.find(r => r.emoji.name === "👍");
    const badReaction = fetchedMessage.reactions.cache.find(r => r.emoji.name === "👎");

    const good_count = Math.max(0, (goodReaction?.count || 0) - (goodReaction?.me ? 1 : 0));
    const bad_count = Math.max(0, (badReaction?.count || 0) - (badReaction?.me ? 1 : 0));

    const total = good_count + bad_count;
    
    // Calculate percentages safely (handle total = 0)
    const goodPercent = total > 0 ? Math.round((good_count / total) * 100) : 0;
    const badPercent = total > 0 ? Math.round((bad_count / total) * 100) : 0;

    // Remove reactions
    await message.reactions.removeAll().catch(() => {});

    const topic = originalEmbed?.description?.split('\n')[0] || "**[주제 정보 없음]**";

    const embed = new EmbedBuilder()
      .setTitle("🏁 투표 집계 완료! 콘콘!")
      .setDescription(`${topic}\n\n투표가 성공적으로 마감됐어! 결과는 아래를 확인하라구.`)
      .setThumbnail(interaction.client.user.displayAvatarURL())
      .setTimestamp();

    let resultText = "";
    if (good_count > bad_count) {
      embed.setColor("#2ECC71"); // Green
      resultText = "✅ **찬성 승리!** 다들 마음이 잘 맞네? 흥!";
    } else if (bad_count > good_count) {
      embed.setColor("#E74C3C"); // Red
      resultText = "❌ **반대 승리!** 역시 세상은 내 맘대로 안 된다니까?";
    } else {
      embed.setColor("#95A5A6"); // Grey
      resultText = "⚖️ **무승부!** 이렇게 팽팽할 줄은 몰랐는걸?";
    }

    embed.addFields(
      { name: "📈 결과 요약", value: resultText },
      { name: "👍 찬성", value: `\`${good_count}표\` (${goodPercent}%)`, inline: true },
      { name: "👎 반대", value: `\`${bad_count}표\` (${badPercent}%)`, inline: true },
      { name: "👥 총 참여 수", value: `\`${total}명\``, inline: true }
    );

    await message.edit({ embeds: [embed] });
    await interaction.editReply({ content: `**개표 완료! 결과를 확인해 봐. 별로 기다린 건 아냐!**` });
  },
};
