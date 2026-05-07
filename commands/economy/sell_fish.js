import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import dobak_Schema from "../../models/dobak.js";
import FishingInventory from "../../models/FishingInventory.js";

export default {
    data: new SlashCommandBuilder()
        .setName("판매")
        .setDescription("가방에 든 생선들을 나츠미한테 팔아봐! (흥, 내가 특별히 사줄게!)"),
    async execute(interaction) {
        const userId = interaction.user.id;

        const inventory = await FishingInventory.findOne({ userId });
        if (!inventory || (inventory.goldenFish === 0 && inventory.decentGoldenFish === 0 && inventory.mediumFish === 0 && inventory.regularFish === 0 && inventory.curiousItem === 0)) {
            return interaction.reply({
                content: "팔 물건이 하나도 없잖아! 낚시부터 하고 오든가! 바보야!",
                ephemeral: true
            });
        }

        const prices = {
            goldenFish: 50000,
            decentGoldenFish: 10000,
            mediumFish: 3000,
            regularFish: 1000,
            curiousItem: 200
        };

        const counts = {
            goldenFish: inventory.goldenFish,
            decentGoldenFish: inventory.decentGoldenFish,
            mediumFish: inventory.mediumFish,
            regularFish: inventory.regularFish,
            curiousItem: inventory.curiousItem
        };

        let subtotal = 0;
        let totalCount = 0;

        for (const [key, price] of Object.entries(prices)) {
            subtotal += counts[key] * price;
            totalCount += counts[key];
        }

        // Quantity Bonus Logic
        let bonusPercent = 0;
        if (totalCount >= 50) bonusPercent = 20;
        else if (totalCount >= 30) bonusPercent = 10;
        else if (totalCount >= 10) bonusPercent = 5;

        const bonusAmount = Math.floor(subtotal * (bonusPercent / 100));
        const finalPrice = subtotal + bonusAmount;

        // Update Database
        await dobak_Schema.updateOne(
            { userid: userId },
            { $inc: { money: finalPrice } }
        );

        // Reset Inventory counts
        inventory.goldenFish = 0;
        inventory.decentGoldenFish = 0;
        inventory.mediumFish = 0;
        inventory.regularFish = 0;
        inventory.curiousItem = 0;
        await inventory.save();

        const embed = new EmbedBuilder()
            .setTitle("🏮 나츠미의 수산시장 정산")
            .setDescription(`콘콘! 가져온 물건들이 꽤 싱싱하네? 내가 다 사줄 테니까 고맙게 생각하라구!`)
            .addFields(
                { name: "🏮 가져온 것들", value: `총 \`${totalCount}\` 개`, inline: true },
                { name: "💰 물건 값", value: `\`${subtotal.toLocaleString()}\` 금전`, inline: true },
                { name: "✨ 덤 (보너스)", value: `\`${bonusPercent}%\` (+\`${bonusAmount.toLocaleString()}\` 금전)`, inline: true },
                { name: "💳 최종 주머니", value: `**\`${finalPrice.toLocaleString()}\` 금전**`, inline: false }
            )
            .setColor("#FF7F50")
            .setThumbnail("https://cdn-icons-png.flaticon.com/512/2311/2311915.png")
            .setFooter({ text: "번 돈으로 맛있는 거 사 먹든가, 다시 운을 시험해 보든가! 흥!" })
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    },
};
