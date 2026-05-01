const { Client, Message, MessageType, EmbedBuilder } = require('discord.js')

const featuresDB = require('../models/Features.js') 
const levelDB = require('../models/LevelSystem.js')

const calculateXP = (level) => level * level * 100

module.exports = {
    name: "messageCreate",
    rest: false,
    once: false,
    /**
     * 
     * @param {Message} message 
     * @param {Client} client 
     */
    async execute(message, client) {
        const { guild, member } = message
        if(!message.inGuild()) return;
       if(message.author.bot) return;

        const levelSystemCheck = await featuresDB.findOne({GuildID: guild.id})
        if(levelSystemCheck && levelSystemCheck.LevelSystem.Enabled) {
         addXP(guild.id, member.id, 5, message, client)
        }
    },
    calculateXP
}

/**
 * @param {Message} message 
 */
const addXP = async(guildId, userId, xpToAdd, message, client) => {
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
        xp -= needed

        const LevelEmbed = new EmbedBuilder()
        .setTitle("레벨 업!!")
        .setDescription(`축하해요! **${message.member.user.username}**! 당신은 지금! __**레벨 ${level}을(를) 얻었다냥!**__ 🥳`)
        .setThumbnail(message.member.user.displayAvatarURL())
        .setColor(`Orange`)
        .setTimestamp(Date.now());

        message.reply({embeds: [LevelEmbed]});

        await levelDB.updateOne({
            GuildID: guildId,
            UserID: userId,
        }, {
            level: level,
            xp: xp,
        })
    }
}