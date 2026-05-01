const {SlashCommandBuilder, CommandInteraction, PermissionFlagsBits, EmbedBuilder} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
    .setName("청소")
    .setDescription("청소할 메시지 와 유저를 넣어주라냥! [너무오래된 메시지는 삭제를 못한다냥!!]")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption(option =>
        option.setName('숫자')
        .setDescription('1~99까지 청소 가능하다냥!')
        .setMinValue(1)
        .setMaxValue(99)
        .setRequired(true)
        )
    .addUserOption(option =>
        option.setName('유저')
        .setDescription('메시지를 쓴 유저를 기입해주라냥!')
        .setRequired(false)
        ),

    async execute(interaction) {
        await interaction.deferReply();
      setTimeout(() => {// Delete the initial reply to this interaction
interaction.deleteReply()
  .then(console.log)
  .catch(console.error);
  // 5초뒤에 실행할 코드를 그대로 넣으세요
}, 5000);
      
        const {channel, options} = interaction;

        const amount = options.getInteger('숫자');
        const target = options.getUser("유저");

        const messages = await channel.messages.fetch({
            limit: amount +1,
        });

        const res = new EmbedBuilder()
            .setColor('Orange')

        if(target) {
            let i = 0;
            const filtered = [];

            (await messages).filter((msg) =>{
                if(msg.author.id === target.id && amount > i) {
                    filtered.push(msg);
                    i++;
                }
            });

            await channel.bulkDelete(filtered).then(messages => {
                res.setDescription(` 따란! ${target}의 ${messages.size}개를 청소했어요! 임무 완료!
ʕっ•ᴥ•ʔっ `)
             .setImage('https://images-ext-2.discordapp.net/external/HzpTM48vDyCGAdOKj2DJrO1EUhqOjrDCj6GzpY5rVRM/https/media.tenor.com/rL-Y22ZfZxgAAAAC/foxplushy-foxy.gif')  
              .setFooter({ text: '이 메세지는 5초후에 사라진다냥', iconURL: 'https://media.discordapp.net/attachments/1037360299965165608/1050405290438311946/IMG_1224.png' });
                interaction.reply({embeds: [res]}); // you can use ephemeral if you desire
            });
        } else {
            await channel.bulkDelete(amount, true).then(messages => {
                res.setDescription(`빠밤! ${messages.size} 개를 삭제했어여!! 임무 완료!
ʕっ•ᴥ•ʔっ`)
                  .setImage('https://images-ext-2.discordapp.net/external/HzpTM48vDyCGAdOKj2DJrO1EUhqOjrDCj6GzpY5rVRM/https/media.tenor.com/rL-Y22ZfZxgAAAAC/foxplushy-foxy.gif')  
              .setFooter({ text: '이 메세지는 5초후에 사라진다냥', iconURL: 'https://media.discordapp.net/attachments/1037360299965165608/1050405290438311946/IMG_1224.png' });
                interaction.reply({embeds: [res]});
             
            });
        }
    }
}