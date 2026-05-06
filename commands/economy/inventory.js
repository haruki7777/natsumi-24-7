import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import FishingInventory from "../../models/FishingInventory.js";

export default {
    data: new SlashCommandBuilder()
        .setName("가방")
        .setDescription("네가 지금까지 뭘 낚아왔는지 확인해볼까? 콘콘!"),
    async execute(interaction) {
        const userId = interaction.user.id;

        const inventory = await FishingInventory.findOne({ userId });
        if (!inventory || (inventory.goldenFish === 0 && inventory.decentGoldenFish === 0 && inventory.mediumFish === 0 && inventory.regularFish === 0 && inventory.curiousItem === 0)) {
            return interaction.reply({
                content: "가방이 텅텅 비어있네? 낚시터에서 잠이라도 잔 거야? 바보야!",
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setTitle(`🎒 ${interaction.user.username}의 가방 속 기록`)
            .setDescription("네가 열심히... 아니, 대충 낚아 올린 것들이야! \n`/판매` 명령어를 쓰면 나츠미가 특별히 사줄게!")
            .addFields(
                { name: "✨ 황금물고기", value: `\`${inventory.goldenFish}\` 마리`, inline: true },
                { name: "🌟 빛나는 생선", value: `\`${inventory.decentGoldenFish}\` 마리`, inline: true },
                { name: "🐟 괜찮은 생선", value: `\`${inventory.mediumFish}\` 마리`, inline: true },
                { name: "🐠 흔한 생선", value: `\`${inventory.regularFish}\` 마리`, inline: true },
                { name: "📦 잡동사니", value: `\`${inventory.curiousItem}\` 개`, inline: true }
            )
            .setColor("#FF7F50")
            .setThumbnail(interaction.user.displayAvatarURL())
            .setFooter({ text: "많이 모아서 오면 보너스를 줄지도 몰라. 내 기분이 좋다면 말이지!" });

        return interaction.reply({ embeds: [embed] });
    },
};
