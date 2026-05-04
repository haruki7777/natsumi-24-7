import { SlashCommandBuilder, EmbedBuilder } from "discord.js";

export default {
    data: new SlashCommandBuilder()
        .setName("투표")
        .setDescription("서버원들의 의견을 묻는 투표를 시작한다냥!")
        .addStringOption(option =>
            option.setName("주제")
                .setDescription("투표할 주제를 입력해 주라냥")
                .setRequired(true)
        ),
    /**
     * @param {import("discord.js").ChatInputCommandInteraction} interaction
     */
    async execute(interaction) {
        const topic = interaction.options.getString("주제");

        const embed = new EmbedBuilder()
            .setTitle("📊 나츠미의 실시간 투표")
            .setDescription(`**주제: ${topic}**\n\n아래의 반응을 눌러서 투표에 참여해 주라냥!`)
            .addFields(
                { name: "👍 찬성", value: "이 의견에 동의한다냥!", inline: true },
                { name: "👎 반대", value: "이 의견에 반대한다냥!", inline: true }
            )
            .setColor("#00AE86")
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .setFooter({ text: `${interaction.user.tag}님이 시작한 투표다냥`, iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp();

        const message = await interaction.reply({ embeds: [embed], fetchReply: true });
        
        try {
            await message.react("👍");
            await message.react("👎");
        } catch (error) {
            console.error("Failed to add reactions to vote message:", error);
        }
    },
};
