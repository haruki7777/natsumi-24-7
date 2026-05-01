const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("추방")
        .setDescription("해당서버에서 한명을 추방시켜요!!")
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .addUserOption(option =>
            option.setName("유저")
                .setDescription("추방 시킬 유저를 넣어주세요!")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("사유")
                .setDescription("추방사유를 대시오!")
        ),

    async execute(interaction) {
        await interaction.deferReply();
        const { options } = interaction;

        const user = options.getUser("유저");
        const reason = options.getString("사유") || "없음";

        const member = await interaction.guild.members.fetch(user.id).catch(() => null);

        if (!member) {
            return interaction.editReply({ content: "유저를 찾을 수 없다냥!" });
        }

        if (member.roles.highest.position >= interaction.member.roles.highest.position) {
            return interaction.editReply({ 
                embeds: [new EmbedBuilder().setDescription(`당신은 ${user.username}를 추방시킬 권한이 부족하다냥!`).setColor('Orange')]
            });
        }

        if (!member.kickable) {
            return interaction.editReply({ content: "내가 그 유저를 추방할 수 없다냥!" });
        }

        await member.kick(reason);

        const embed = new EmbedBuilder()
            .setDescription(`냐하핫! ${user}를 추방 성공했다냥! 사유: ${reason}`)
            .setColor('Orange');

        await interaction.editReply({
            embeds: [embed],
        });
    }
}
