import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName("청소")
        .setDescription("청소할 메시지 수와 유저를 선택해주세요! (오래된 메시지는 불가능해요)")
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
        
        const { channel, options } = interaction;
        const amount = options.getInteger('숫자');
        const target = options.getUser("유저");

        const messages = await channel.messages.fetch({
            limit: amount + 1,
        });

        const res = new EmbedBuilder()
            .setColor('Orange');

        if (target) {
            let i = 0;
            const filtered = [];

            messages.filter((msg) => {
                if (msg.author.id === target.id && amount > i) {
                    filtered.push(msg);
                    i++;
                }
            });

            await channel.bulkDelete(filtered).then(messages => {
                res.setDescription(`따란! ${target}의 ${messages.size}개를 청소했어요! 임무 완료!\nʕっ•ᴥ•ʔっ`)
                    .setImage('https://media.tenor.com/rL-Y22ZfZxgAAAAC/foxplushy-foxy.gif')
                    .setFooter({ text: '이 메세지는 5초후에 사라진다냥' });
                interaction.editReply({ embeds: [res] });
            });
        } else {
            await channel.bulkDelete(amount, true).then(messages => {
                res.setDescription(`빠밤! ${messages.size} 개를 삭제했어여!! 임무 완료!\nʕっ•ᴥ•ʔっ`)
                    .setImage('https://media.tenor.com/rL-Y22ZfZxgAAAAC/foxplushy-foxy.gif')
                    .setFooter({ text: '이 메세지는 5초후에 사라진다냥' });
                interaction.editReply({ embeds: [res] });
            });
        }

        setTimeout(() => {
            interaction.deleteReply().catch(() => {});
        }, 5000);
    }
}
