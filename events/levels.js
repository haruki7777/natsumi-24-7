const { EmbedBuilder } = require('discord.js')
const levelDB = require('../models/LevelSystem.js')

const calculateXP = (level) => level * level * 100

/**
 * @param {import("discord.js").Message} message 
 */
const addXP = async(guildId, userId, xpToAdd, message) => {
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

        const LevelEmbed = new EmbedBuilder()
        .setTitle("레벨 업!!")
        .setDescription(`축하해요! **${message.author.username}**! 당신은 지금! __**레벨 ${level}을(를) 얻었다냥!**__ 🥳`)
        .setThumbnail(message.author.displayAvatarURL())
        .setColor(`Orange`)
        .setTimestamp(Date.now());

        message.reply({embeds: [LevelEmbed]}).catch(() => {});

        await levelDB.updateOne({
            GuildID: guildId,
            UserID: userId,
        }, {
            level: level,
            xp: xp,
        })
    }
}

module.exports = {
    calculateXP,
    addXP
}