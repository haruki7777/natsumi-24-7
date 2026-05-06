import { EmbedBuilder } from 'discord.js';
import levelDB from '../models/LevelSystem.js';

export const calculateXP = (level) => level * level * 100;

/**
 * @param {import("discord.js").Message | import("discord.js").ChatInputCommandInteraction} target 
 */
export const addXP = async(guildId, userId, xpToAdd, target) => {
    const result = await levelDB.findOneAndUpdate({
        GuildID: guildId,
        UserID: userId
    }, {
        GuildID: guildId,
        UserID: userId,
        $inc: {
            xp: xpToAdd
        }
    }, {
        upsert: true,
        new: true
    })

    let { xp, level } = result
    const needed = calculateXP(level)

    if(xp >= needed) {
        level++
        xp = xp - needed

        const author = target.author || target.user;
        const LevelEmbed = new EmbedBuilder()
        .setTitle("🏮 서열 상승!!")
        .setDescription(`오, **${author.username}**! 너 좀 치는데? \n이제 __**서열 ${level}**__에 도달했어! \n딱히 네가 대단해서 칭찬하는 건 아니니까! 콘콘! 🥳`)
        .setThumbnail(author.displayAvatarURL())
        .setColor(`#FF8C00`)
        .setTimestamp(Date.now());

        if (target.reply) {
            if (target.deferred || target.replied) {
                target.followUp({ embeds: [LevelEmbed], ephemeral: true }).catch(() => {});
            } else {
                target.reply({ embeds: [LevelEmbed], ephemeral: true }).catch(() => {});
            }
        } else {
            // For regular messages: Send and auto-delete (Temporal message)
            target.channel.send({ content: `<@${author.id}>`, embeds: [LevelEmbed] }).then(msg => {
                setTimeout(() => msg.delete().catch(() => {}), 5000);
            }).catch(() => {});
        }

        await levelDB.updateOne({
            GuildID: guildId,
            UserID: userId,
        }, {
            level: level,
            xp: xp,
        })
    }
}

