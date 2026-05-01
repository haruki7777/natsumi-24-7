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
        const { channel, options } = interaction;

        const user = options.getUser("유저");
        const reason = options.getString("사유") || "이유가 없으면 안돼요!";

        const member = await interaction.guild.members.fetch(user.id);

        const errEmbed = new EmbedBuilder()
            .setDescription(`당신은 ${user.username} 를 추방시킬 역할이 충분하지 않아요!!`)
            .setColor('Orange')

        if (member.roles.highest.position >= interaction.member.roles.highest.position)
            return interaction.reply({ embeds: [errEmbed], ephemeral: true });

        await member.kick(reason);

        const embed = new EmbedBuilder()
            .setDescription(`냐하핫! 당신이 ${user} 를 추방에 성공!!그의 사유는 다음과 같슴다! ${reason}`)
            .setColor('Orange')

        await interaction.reply({
            embeds: [embed],
        });
    }
}