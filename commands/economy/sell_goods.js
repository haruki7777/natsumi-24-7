import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import dobak_Schema from "../../models/dobak.js";
import AnimeInventory from "../../models/AnimeInventory.js";
import { getItemCategory, ANIME_PRICES } from "../../utils/animeItems.js";
import { getMarketRate } from "../../utils/market.js";

export default {
  data: new SlashCommandBuilder()
    .setName("굿즈판매")
    .setDescription("보유한 애니 굿즈들을 나츠미에게 팔아 금전을 획득합니다!"),

  async execute(interaction) {
    const userId = interaction.user.id;
    const animeInv = await AnimeInventory.findOne({ userId });

    if (!animeInv || (animeInv.items && animeInv.items.size === 0)) {
      return interaction.reply({
        content: "어라? 팔 물건이 하나도 없는데? 가방이 텅텅 비었어! 바보!",
        ephemeral: true
      });
    }

    let rawTotal = 0;
    let itemCount = 0;

    // Calculate total price based on base prices
    for (const [name, qty] of animeInv.items) {
      if (qty > 0) {
        const category = getItemCategory(name);
        const price = ANIME_PRICES[category] || 0;
        rawTotal += price * qty;
        itemCount += qty;
      }
    }

    if (rawTotal === 0) {
      return interaction.reply({
        content: "팔 수 있는 가치 있는 물건이 없네... 🗑️ 잡동사니만 한가득이야! (이것도 나츠미가 안 사줘!)",
        ephemeral: true
      });
    }

    // Apply Market Fluctuations
    const market = getMarketRate();
    const totalEarned = Math.floor(rawTotal * market.rate);

    const feeRate = 0.1; // 10% commission
    const fee = Math.floor(totalEarned * feeRate);
    const netReceived = totalEarned - fee;
    
    // Calculate Profit/Loss based on 5,000/gacha cost
    const gachaCost = 5000;
    const estInvestment = itemCount * gachaCost;
    const profit = netReceived - estInvestment;
    const profitEmoji = profit >= 0 ? "📈" : "📉";
    const profitLabel = profit >= 0 ? "순이익" : "순손실";

    // Update DB
    await dobak_Schema.updateOne(
      { userid: userId },
      { $inc: { money: netReceived } }
    );

    // Clear Anime Items
    animeInv.items = new Map();
    await animeInv.save();

    const embed = new EmbedBuilder()
      .setTitle(`${market.emoji} 굿즈 시장 정산 리포트`)
      .setDescription(
        `**[ 시장 현황: ${market.trend} (x${market.rate}) ]**\n` +
        `**${interaction.user.username}**님이 모아온 굿즈들의 현재 가치를 정산했어!\n\n` +
        `📦 **판매 수량:** \`${itemCount.toLocaleString()}\`개\n` +
        `🪙 **추정 투자금:** \`${estInvestment.toLocaleString()}\` 금전\n` +
        `💵 **시장 매출액:** \`${totalEarned.toLocaleString()}\` 금전 (변동 반영)\n` +
        `💸 **나츠미 수수료 (10%):** \`-${fee.toLocaleString()}\` 금전\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `✨ **실제 정산액:** \`+${netReceived.toLocaleString()}\` 금전\n` +
        `${profitEmoji} **${profitLabel}:** \`${profit.toLocaleString()}\` 금전\n\n` +
        `*${profit >= 0 ? "와! 이번 장사는 대박인데? 꽤 짭짤해! 콘콘!" : "음... 이번엔 운이 좀 없었나 봐. 시장가가 너무 낮아...!"}*`
      )
      .setColor(profit >= 0 ? "#FFD700" : "#FF0000")
      .setThumbnail(interaction.user.displayAvatarURL())
      .setFooter({ text: "나츠미의 굿즈 거래소는 5분마다 시세가 변동돼!" });

    return interaction.reply({ embeds: [embed] });
  }
};
