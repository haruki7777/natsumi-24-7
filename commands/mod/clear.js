import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName("청소")
        .setDescription("채널의 지저분한 메시지들을 정리할까? (콘콘!)")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addIntegerOption(option =>
            option.setName('숫자')
                .setDescription('1~99개까지 한꺼번에 치울 수 있어!')
                .setMinValue(1)
                .setMaxValue(99)
                .setRequired(true)
        )
        .addUserOption(option =>
            option.setName('유저')
                .setDescription('누가 쓴 것만 골라서 치울까?')
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
            .setColor("#FF8C00");

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
                res.setDescription(`흥! ${target} 녀석이 쓴 메시지 ${messages.size}개를 말끔히 치웠어!\n나한테 고마워하라구! 콘콘!`)
                    .setImage('https://media.tenor.com/rL-Y22ZfZxgAAAAC/foxplushy-foxy.gif')
                    .setFooter({ text: '이 메시지는 5초 후에 저절로 사라질 거야! 흥!' });
                interaction.editReply({ embeds: [res] });
            });
        } else {
            await channel.bulkDelete(amount, true).then(messages => {
                res.setDescription(`빠밤! 지저분했던 메시지 ${messages.size}개를 숲의 바람으로 날려버렸어!\n임무 완료라구! 콘콘!`)
                    .setImage('https://media.tenor.com/rL-Y22ZfZxgAAAAC/foxplushy-foxy.gif')
                    .setFooter({ text: '이 메시지는 5초 후에 저절로 사라질 거야! 흥!' });
                interaction.editReply({ embeds: [res] });
            });
        }

        setTimeout(() => {
            interaction.deleteReply().catch(() => {});
        }, 5000);
    }
}
