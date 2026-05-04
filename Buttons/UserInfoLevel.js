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
            return interaction.reply({ content: "**유저 정보를 찾을 수 없다냥!**", ephemeral: true });
        }

        const levelData = await levelDB.findOne({ GuildID: guildId, UserID: targetUserId });
        const level = levelData?.level || 1;
        const xp = levelData?.xp || 0;
        const requiredXP = level * level * 100;
        const progress = Math.min((xp / requiredXP) * 100, 100).toFixed(1);

        const embed = new EmbedBuilder()
            .setAuthor({ name: `${targetUser.username}님의 레벨 정보`, iconURL: targetUser.displayAvatarURL() })
            .setTitle("📊 레벨 상세 내역")
            .addFields(
                { name: "현재 레벨", value: `**Lv.${level}**`, inline: true },
                { name: "현재 경험치", value: `**${xp.toLocaleString()} XP**`, inline: true },
                { name: "다음 레벨까지", value: `**${(requiredXP - xp).toLocaleString()} XP**`, inline: true }
            )
            .setDescription(`**성장률: \`${progress}%\`**\n` + createProgressBar(xp, requiredXP))
            .setColor("#3498DB")
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
