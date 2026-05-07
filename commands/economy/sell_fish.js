import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import dobak_Schema from "../../models/dobak.js";
import FishingInventory from "../../models/FishingInventory.js";
import { getMarketRate } from "../../utils/market.js";

export default {
    data: new SlashCommandBuilder()
        .setName("판매")
        .setDescription("가방에 든 생선이나 전리품들을 나츠미한테 팔아봐! (흥, 내가 특별히 사줄게!)"),
    async execute(interaction) {
        const userId = interaction.user.id;

        const inventory = await FishingInventory.findOne({ userId });
        if (!inventory || (
            inventory.goldenFish === 0 && 
            inventory.decentGoldenFish === 0 && 
            inventory.mediumFish === 0 && 
            inventory.regularFish === 0 && 
            inventory.adultItem === 0 && 
            inventory.curiousItem === 0
        )) {
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
            adultItem: 1500,
            curiousItem: 200
        };

        const counts = {
            goldenFish: inventory.goldenFish,
            decentGoldenFish: inventory.decentGoldenFish,
            mediumFish: inventory.mediumFish,
            regularFish: inventory.regularFish,
            adultItem: inventory.adultItem,
            curiousItem: inventory.curiousItem
        };

        let rawSubtotal = 0;
        let totalCount = 0;

        for (const [key, price] of Object.entries(prices)) {
            rawSubtotal += counts[key] * price;
            totalCount += counts[key];
        }

        // Apply Market Fluctuations
        const market = getMarketRate();
        const subtotal = Math.floor(rawSubtotal * market.rate);

        // Quantity Bonus Logic
        let bonusPercent = 0;
        if (totalCount >= 50) bonusPercent = 20;
        else if (totalCount >= 30) bonusPercent = 10;
        else if (totalCount >= 10) bonusPercent = 5;

        const bonusAmount = Math.floor(subtotal * (bonusPercent / 100));
        const totalSales = subtotal + bonusAmount;

        // commission 10%
        const feeRate = 0.1;
        const fee = Math.floor(totalSales * feeRate);
        const netReceived = totalSales - fee;

        // Investment Calculation (Virtual 400 per catch)
        const estInvestment = totalCount * 400;
        const profit = netReceived - estInvestment;
        const profitEmoji = profit >= 0 ? "📈" : "📉";
        const profitLabel = profit >= 0 ? "순이익" : "순손실";

        // Update Database
        await dobak_Schema.updateOne(
            { userid: userId },
            { $inc: { money: netReceived } }
        );

        // Reset Inventory counts
        inventory.goldenFish = 0;
        inventory.decentGoldenFish = 0;
        inventory.mediumFish = 0;
        inventory.regularFish = 0;
        inventory.adultItem = 0;
        inventory.curiousItem = 0;
        await inventory.save();

        const embed = new EmbedBuilder()
            .setTitle(`${market.emoji} 나츠미의 수산물 위판장`)
            .setDescription(
                `**[ 수산물 시세: ${market.trend} (x${market.rate}) ]**\n` +
                `콘콘! 가져온 물건들이 꽤 싱싱하네? 시장 상황에 맞춰서 후하게 쳐줄게!`
            )
            .addFields(
                { name: "📦 위탁 물량", value: `총 \`${totalCount.toLocaleString()}\` 개`, inline: true },
                { name: "🪙 추정 어구비", value: `\`${estInvestment.toLocaleString()}\` 금전`, inline: true },
                { name: "💵 시장 매출액", value: `\`${totalSales.toLocaleString()}\` 금전`, inline: true },
                { name: "✨ 출하 보너스", value: `\`${bonusPercent}%\` (+\`${bonusAmount.toLocaleString()}\` 금전)`, inline: true },
                { name: "💸 위탁 수수료", value: `\`-${fee.toLocaleString()}\` 금전 (10%)`, inline: true },
                { name: "💳 최종 정산금", value: `**\`${netReceived.toLocaleString()}\` 금전**`, inline: false },
                { name: `${profitEmoji} ${profitLabel}`, value: `\`${profit.toLocaleString()}\` 금전`, inline: true }
            )
            .setColor(profit >= 0 ? "#FF7F50" : "#CD5C5C")
            .setThumbnail("https://cdn-icons-png.flaticon.com/512/2311/2311915.png")
            .setFooter({ text: "시세는 5분마다 변동되니까 잘 보고 팔라구! 콘콘!" })
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    },
};
