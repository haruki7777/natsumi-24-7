import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import dobak_Schema from "../../models/dobak.js";
import FishingInventory from "../../models/FishingInventory.js";

export default {
    data: new SlashCommandBuilder()
        .setName("판매")
        .setDescription("가방에 있는 물고기들을 나츠미에게 팔아 돈을 번다냥!"),
    async execute(interaction) {
        const userId = interaction.user.id;

        const inventory = await FishingInventory.findOne({ userId });
        if (!inventory || (inventory.goldenFish === 0 && inventory.decentGoldenFish === 0 && inventory.mediumFish === 0 && inventory.regularFish === 0 && inventory.curiousItem === 0)) {
            return interaction.reply({
                content: "팔 물건이 하나도 없다냥! 낚시부터 하고 와라냥!",
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
            .setTitle("💰 나츠미의 수산시장 정산")
            .setDescription(`오오! 물건들이 꽤 싱싱하다냥. 나츠미가 전부 매입해주겠다냥!`)
            .addFields(
                { name: "판매 수량", value: `총 \`${totalCount}\` 개`, inline: true },
                { name: "판매 합계", value: `\`${subtotal.toLocaleString()}\` 원`, inline: true },
                { name: "대량 판매 보너스", value: `\`${bonusPercent}%\` (+\`${bonusAmount.toLocaleString()}\` 원)`, inline: true },
                { name: "최종 입금액", value: `**\`${finalPrice.toLocaleString()}\` 원**`, inline: false }
            )
            .setColor("Green")
            .setThumbnail("https://cdn-icons-png.flaticon.com/512/2311/2311915.png")
            .setFooter({ text: "번 돈으로 또 낚싯대를 사거나 도박(...)을 해도 좋다냥!" })
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    },
};
