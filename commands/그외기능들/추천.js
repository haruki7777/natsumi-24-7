const { SlashCommandBuilder } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
const {ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle} =
require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
  .setName('추천')
  .setDescription('나츠미를 추천해주라냥!'),
  async execute(interaction) { 
    await interaction.deferReply();

    const Embed = new EmbedBuilder()
    .setTitle('하트 누르러 가기(클릭해주세요)')
    .setDescription('나츠미를 추천해주라냥! 안그럼 문다냥 ㅋㅋ')
    .setColor('Orange')
    .setTimestamp()
.setURL('https://koreanbots.dev/bots/905355491708903485/vote')
    .setAuthor({ name: '제작자 : 하루키#3081', iconURL:  'https://media.discordapp.net/attachments/1049783329613951036/1055765268846100590/124E7AB6-6124-48FF-9445-E53BFAF2BB02.jpg'})
.setImage('https://media.discordapp.net/attachments/1049783329613951036/1055765268846100590/124E7AB6-6124-48FF-9445-E53BFAF2BB02.jpg')
    .setFooter({ text: '봇 이름:나츠미', iconURL:  'https://media.discordapp.net/attachments/1049783329613951036/1055765268846100590/124E7AB6-6124-48FF-9445-E53BFAF2BB02.jpg'})

    const button = new ButtonBuilder()
      .setLabel("하트 링크")
      .setStyle(ButtonStyle.Link)
      .setURL('https://koreanbots.dev/bots/905355491708903485/vote')
      .setEmoji("<:KemomimiDance:1048568057599119370>");

    const row = new ActionRowBuilder().addComponents(button);
    
    await interaction.editReply({ embeds: [Embed],components: [row],});
}}