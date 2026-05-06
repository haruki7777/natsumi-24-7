import { EmbedBuilder } from "discord.js";
import levelDB from "../models/LevelSystem.js";

export default {
    name: "UserInfoLevel",
    /**
     * @param {import("discord.js").ButtonInteraction} interaction
     * @param {import("discord.js").Client} client
     */
    async execute(interaction, client) {
        const targetUserId = interaction.customId.split("_")[1];
        const guildId = interaction.guildId;
        
        const targetUser = await client.users.fetch(targetUserId).catch(() => null);
        if (!targetUser) {
            return interaction.reply({ content: "**흥! 그런 녀석은 이 숲에 없어! (유저 정보 없음) 콘콘!**", ephemeral: true });
        }

        const levelData = await levelDB.findOne({ GuildID: guildId, UserID: targetUserId });
        const level = levelData?.level || 1;
        const xp = levelData?.xp || 0;
        const requiredXP = level * level * 100;
        const progress = Math.min((xp / requiredXP) * 100, 100).toFixed(1);

        const embed = new EmbedBuilder()
            .setAuthor({ name: `${targetUser.username}의 서열 기록`, iconURL: targetUser.displayAvatarURL() })
            .setTitle("📊 서열 상세 내역")
            .addFields(
                { name: "🏮 현재 위계", value: `**위계 ${level}**`, inline: true },
                { name: "✨ 축적된 영력", value: `**${xp.toLocaleString()} 영력**`, inline: true },
                { name: "🔝 다음 위계까지", value: `**${(requiredXP - xp).toLocaleString()} 영력**`, inline: true }
            )
            .setDescription(`**영력 집중도: \`${progress}%\`**\n` + createProgressBar(xp, requiredXP))
            .setColor("#FF8C00")
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};

function createProgressBar(current, total) {
    const size = 15;
    const progress = Math.round((current / total) * size);
    const emptyProgress = size - progress;
    
    const progressText = "🟦".repeat(Math.max(0, progress));
    const emptyProgressText = "⬜".repeat(Math.max(0, emptyProgress));
    
    return `[${progressText}${emptyProgressText}]`;
}
