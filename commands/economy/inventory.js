import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import FishingInventory from "../../models/FishingInventory.js";

export default {
    data: new SlashCommandBuilder()
        .setName("가방")
        .setDescription("현재 내가 낚은 물고기들을 확인한다냥!"),
    async execute(interaction) {
        const userId = interaction.user.id;

        const inventory = await FishingInventory.findOne({ userId });
        if (!inventory || (inventory.goldenFish === 0 && inventory.decentGoldenFish === 0 && inventory.mediumFish === 0 && inventory.regularFish === 0 && inventory.curiousItem === 0)) {
            return interaction.reply({
                content: "가방이 텅텅 비어있다냥! 어서 낚시를 하러 가라냥!",
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setTitle(`🎒 ${interaction.user.username}님의 물고기 가방`)
            .setDescription("낚시로 획득한 전리품들이다냥! `/판매` 명령어로 나츠미에게 팔 수 있다냥.")
            .addFields(
                { name: "✨ 황금물고기", value: `\`${inventory.goldenFish}\` 마리`, inline: true },
                { name: "🌟 그럭저럭한 황금물고기", value: `\`${inventory.decentGoldenFish}\` 마리`, inline: true },
                { name: "🐟 중간물고기", value: `\`${inventory.mediumFish}\` 마리`, inline: true },
                { name: "🐠 일반물고기", value: `\`${inventory.regularFish}\` 마리`, inline: true },
                { name: "📦 버리기 아까운 물건", value: `\`${inventory.curiousItem}\` 개`, inline: true }
            )
            .setColor("Gold")
            .setThumbnail(interaction.user.displayAvatarURL())
            .setFooter({ text: "많이 모아서 한꺼번에 팔면 보너스가 있을지도 모른다냥? (나츠미의 기분파 감정)" });

        return interaction.reply({ embeds: [embed] });
    },
};
