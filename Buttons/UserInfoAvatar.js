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
            return interaction.reply({ content: "**유저 정보를 찾을 수 없다냥!**", ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle(`${targetUser.username}님의 아바타`)
            .setImage(targetUser.displayAvatarURL({ dynamic: true, size: 1024 }))
            .setColor("Random")
            .setFooter({ text: `Requested by ${interaction.user.tag}` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
