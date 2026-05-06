import { SlashCommandBuilder, EmbedBuilder } from "discord.js";

export default {
    data: new SlashCommandBuilder()
        .setName("투표")
        .setDescription("인간들의 의견을 내가 직접 물어봐줄게! 콘콘!")
        .addStringOption(option =>
            option.setName("주제")
                .setDescription("뭘 물어보고 싶은지 여기 적어봐!")
                .setRequired(true)
        ),
    /**
     * @param {import("discord.js").ChatInputCommandInteraction} interaction
     */
    async execute(interaction) {
        const topic = interaction.options.getString("주제");

        const embed = new EmbedBuilder()
            .setTitle("📊 나츠미의 공정한 투표소")
            .setDescription(`**주제: ${topic}**\n\n중요한 결정을 해야 하나 봐? 내가 특별히 도와줄게! \n아래 반응을 눌러서 너희들의 생각을 말해봐! 콘콘!`)
            .addFields(
                { name: "👍 찬성", value: "이 의견에 나츠미도 찬성... 아, 아니 너희가 찬성하는 거야!", inline: true },
                { name: "👎 반대", value: "이런 말도 안 되는 의견엔 반대하라구!", inline: true }
            )
            .setColor("#FF7F50")
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .setFooter({ text: `${interaction.user.username} 녀석이 시작한 투표야.`, iconURL: interaction.user.displayAvatarURL() })
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
