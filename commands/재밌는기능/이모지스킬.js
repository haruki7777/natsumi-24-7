const axios = require('axios')
const { 
SlashCommandBuilder,
EmbedBuilder,
PermissionFlagsBits, 
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("이모지스틸")
        .setDescription("이모지를 스틸한다냥")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption((option) => option.setName('이모지').setDescription('추가할 이모지나 이미지를 넣어주라냥').setRequired(true))
        .addStringOption((option) => option.setName('이름').setDescription('추가 후 표시될 이모지 이름을 적어주라냥 영어로 쓰라냥!').setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();
        let emoji = interaction.options.getString('이모지')?.trim()
        const name = interaction.options.getString('이름')

        if (emoji.startsWith("<") && emoji.endsWith(">")) {
            const id = emoji.match(/\d{15,}/g)[0]
            const type = await axios.get(`https://cdn.discordapp.com/emojis/${id}.gif`)
                .then(image => {
                    if (image) return "gif"
                    else return "png"
                }).catch(err => {
                    return "png"
                })
            emoji = `https://cdn.discordapp.com/emojis/${id}.${type}?quality=lossless`
        }
        interaction.guild.emojis.create({ name, attachment: emoji }).then(emoji => {
            const embed = new EmbedBuilder()
                .setTitle("이모지 스티이일! スチール！！")
                .setImage('https://media.discordapp.net/attachments/1061995086466007205/1062531270506192946/IMG_1764.gif')
                .setColor("Orange")
            return interaction.editReply({ embeds: [embed] })
        }).catch(err => {
            console.error(err)
        })
    }
}