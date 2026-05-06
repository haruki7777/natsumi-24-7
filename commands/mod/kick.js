import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from "discord.js";

export default {
    data: new SlashCommandBuilder()
        .setName("추방")
        .setDescription("눈에 거슬리는 녀석을 숲 밖으로 쫓아낼게! (권한 필요)")
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .addUserOption(option =>
            option.setName("유저")
                .setDescription("쫓아낼 녀석을 선택해.")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("사유")
                .setDescription("왜 쫓아내는지 이유는 말해줘야지?")
        ),

    async execute(interaction) {
        await interaction.deferReply();
        const { options } = interaction;

        const user = options.getUser("유저");
        const reason = options.getString("사유") || "나츠미 마음에 안 들어!";

        const member = await interaction.guild.members.fetch(user.id).catch(() => null);

        if (!member) {
            return interaction.editReply({ content: "흥! 그런 녀석은 이 숲에 있지도 않은걸? 바보야?" });
        }

        if (member.roles.highest.position >= interaction.member.roles.highest.position) {
            return interaction.editReply({ 
                embeds: [new EmbedBuilder().setTitle("🦊 권한 부족!").setDescription(`네 위계가 ${user.username}보다 낮잖아! \n어디서 감히 명령질이야? 흥!`).setColor('#ED4245')]
            });
        }

        if (!member.kickable) {
            return interaction.editReply({ content: "저 녀석은 나도 못 건드린다구! 너보다 높은 분 아냐?" });
        }

        await member.kick(reason);

        const embed = new EmbedBuilder()
            .setTitle("🏮 숲에서 추방 완료!")
            .setDescription(`콘콘! **${user.username}** 녀석을 시원하게 쫓아냈어!\n\n**사유:** \`${reason}\`\n\n다시는 내 눈앞에 나타나지 말라구! ♥(⸝⸝⸝ᵒ̴̶̷̥́ ᵕ ก̀⸝⸝⸝)ෆ`)
            .setColor('#FF7F50');

        await interaction.editReply({
            embeds: [embed],
        });
    }
}
