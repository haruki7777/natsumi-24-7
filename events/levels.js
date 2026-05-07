import { EmbedBuilder } from 'discord.js';
import levelDB from '../models/LevelSystem.js';

export const calculateXP = (level) => level * level * 100;

/**
 * @param {import("discord.js").Message | import("discord.js").ChatInputCommandInteraction} target 
 */
export const addXP = async(guildId, userId, xpToAdd, target) => {
    // Initial find
    const result = await levelDB.findOne({ GuildID: guildId, UserID: userId }).lean();
    
    let currentLevel = result?.level || 1;
    
    // Dynamic XP formula as requested:
    // Start at 100, decrease by 10 per level, minimum 5.
    // Level 1: 100 - (0 * 10) = 100
    // Level 2: 100 - (1 * 10) = 90
    // ... Level 11+: 100 - (10 * 10) = 0 -> Max(5, 0) = 5
    const calculatedXP = xpToAdd || Math.max(5, 110 - (currentLevel * 10));
    
    let currentXP = (result?.xp || 0) + calculatedXP;
    let didLevelUp = false;

    const needed = calculateXP(currentLevel);

    if (currentXP >= needed) {
        currentLevel++;
        currentXP -= needed;
        didLevelUp = true;
    }

    // Update database
    await levelDB.updateOne({
        GuildID: guildId,
        UserID: userId
    }, {
        $set: {
            xp: currentXP,
            level: currentLevel
        }
    }, {
        upsert: true
    });

    if (didLevelUp) {
        const author = target.author || target.user;
        const LevelEmbed = new EmbedBuilder()
            .setTitle("🏮 서열 상승!!")
            .setDescription(`오, **${author.username}**! 너 좀 치는데? \n이제 __**서열 ${currentLevel}**__에 도달했어! \n딱히 네가 대단해서 칭찬하는 건 아니니까! 콘콘! 🥳`)
            .setThumbnail(author.displayAvatarURL())
            .setColor(`#FF8C00`)
            .setTimestamp(Date.now());

        const isInteraction = target.isReplyable && (target.applicationId || target.token);

        if (isInteraction) {
            // Use Ephemeral follow-up for interactions (Slash Commands, Buttons, etc.)
            if (target.deferred || target.replied) {
                target.followUp({ embeds: [LevelEmbed], ephemeral: true }).catch(() => {});
            } else {
                target.reply({ embeds: [LevelEmbed], ephemeral: true }).catch(() => {});
            }
        } else {
            // For regular text messages: Send to channel and auto-delete after 5s
            target.channel.send({ content: `<@${author.id}>`, embeds: [LevelEmbed] }).then(msg => {
                setTimeout(() => msg.delete().catch(() => {}), 5000);
            }).catch(() => {});
        }
    }
}

