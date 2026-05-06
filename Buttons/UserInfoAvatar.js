import { EmbedBuilder } from "discord.js";

export default {
    name: "UserInfoAvatar",
    /**
     * @param {import("discord.js").ButtonInteraction} interaction
     * @param {import("discord.js").Client} client
     */
    async execute(interaction, client) {
        const targetUserId = interaction.customId.split("_")[1];
        const targetUser = await client.users.fetch(targetUserId).catch(() => null);

        if (!targetUser) {
            return interaction.reply({ content: "**흥! 그런 인간은 나도 모른다구! (유저 정보 없음) 콘콘!**", ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle(`🖼️ ${targetUser.username}의 모습이야`)
            .setImage(targetUser.displayAvatarURL({ dynamic: true, size: 1024 }))
            .setColor("#FF7F50")
            .setDescription("흥! 뭐, 그럭저럭 생겼네. 칭찬은 아니야! 콘콘!")
            .setFooter({ text: `관찰자: ${interaction.user.username}` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
