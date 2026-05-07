import { 
  SlashCommandBuilder, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ComponentType 
} from "discord.js";
import dobak_Schema from "../../models/dobak.js";
import AnimeInventory from "../../models/AnimeInventory.js";
import { ANIME_ITEMS } from "../../utils/animeItems.js";

export default {
  data: new SlashCommandBuilder()
    .setName("애니뽑기")
    .setDescription("금전을 사용하여 애니메이션 관련 특별한 아이템을 뽑습니다! (1회 5,000 금전)"),

  async execute(interaction) {
    const cost = 5000;
    const userId = interaction.user.id;

    const getInitialEmbed = (money) => {
      return new EmbedBuilder()
        .setTitle("🏮 나츠미의 애니 굿즈 가챠 머신!")
        .setDescription(
          `**원하는 버튼을 눌러서 바로 뽑아봐! 금전은 자동으로 지불될 거야!**\n\n` +
          `💰 **1회 비용:** \`${cost.toLocaleString()}\` 금전\n` +
          `👛 **내 보유액:** \`${money.toLocaleString()}\` 금전\n\n` +
          `*황금 다이아몬드 아이템을 찾으면 나츠미가 정말 놀랄걸? 콘콘!*`
        )
        .setColor("#FFD700")
        .setFooter({ text: "가방(/가방)에서 뽑은 물건들을 확인할 수 있어!" });
    };

    const initialData = await dobak_Schema.findOne({ userid: userId });
    const initialMoney = initialData?.money || 0;

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("gacha_roll")
        .setLabel("1회 뽑기")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("🏮"),
      new ButtonBuilder()
        .setCustomId("gacha_roll_10")
        .setLabel("10회 연차")
        .setStyle(ButtonStyle.Success)
        .setEmoji("🎟️"),
      new ButtonBuilder()
        .setCustomId("gacha_stop")
        .setLabel("그만두기")
        .setStyle(ButtonStyle.Danger)
        .setEmoji("✖️")
    );

    const response = await interaction.reply({
      embeds: [getInitialEmbed(initialMoney)],
      components: [row]
    });

    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 120000
    });

    collector.on('collect', async (i) => {
      if (i.user.id !== userId) {
        return i.reply({ content: "네 운은 네가 직접 시험하라고!", ephemeral: true });
      }

      if (i.customId === "gacha_stop") {
        return collector.stop("user_stop");
      }

      const rollCount = i.customId === "gacha_roll_10" ? 10 : 1;
      const totalCost = cost * rollCount;

      const currentDobak = await dobak_Schema.findOne({ userid: userId });
      if (!currentDobak || currentDobak.money < totalCost) {
        return i.reply({ content: "❌ **돈이 부족해! 얼른 벌어오라구! 바보!**", ephemeral: true });
      }

      await i.deferUpdate();

      // Deduct money & Apply small bonus (like fishing)
      const bonusMoney = rollCount * (Math.floor(Math.random() * 1001) + 500); // 500~1500 per pull
      const netCost = totalCost - bonusMoney;

      await dobak_Schema.updateOne(
        { userid: userId },
        { $inc: { money: -netCost } }
      );

      const results = [];
      for (let n = 0; n < rollCount; n++) {
        const rand = Math.random() * 100;
        let category;
        if (rand < 1) category = "GOLDEN";
        else if (rand < 6) category = "JACKPOT";
        else if (rand < 21) category = "MEDIUM";
        else if (rand < 51) category = "NORMAL";
        else if (rand < 75) category = "ADULT"; // 24% for adult stuff
        else category = "FAIL";

        const itemList = ANIME_ITEMS[category];
        const pickedItem = itemList[Math.floor(Math.random() * itemList.length)];
        results.push({ name: pickedItem, category });
      }

      // Save to Inventory
      let animeInv = await AnimeInventory.findOne({ userId });
      if (!animeInv) {
        animeInv = new AnimeInventory({ userId, items: {} });
      }

      results.forEach(res => {
        if (!res.name.includes("꽝!") && !res.name.includes("꿀밤")) {
          const currentCount = animeInv.items.get(res.name) || 0;
          animeInv.items.set(res.name, currentCount + 1);
        }
      });
      await animeInv.save();

      // Track Collection (Achievements)
      try {
        const Collection = (await import("../../models/Collection.js")).default;
        let userCol = await Collection.findOne({ userId });
        if (!userCol) userCol = new Collection({ userId, animeItems: [], fishingItems: [] });

        const newItems = results.map(r => r.name).filter(name => !userCol.animeItems.includes(name));
        if (newItems.length > 0) {
          userCol.animeItems = [...new Set([...userCol.animeItems, ...newItems])];
          await userCol.save();
        }
      } catch (colErr) {
        console.error("[Collection Tracking Error]", colErr);
      }

      // Result Embed
      const resultText = results.map(r => {
          if (r.category === "GOLDEN") return `👑 **[전설] ${r.name}**`;
          if (r.category === "JACKPOT") return `🌟 **[대박] ${r.name}**`;
          if (r.category === "MEDIUM") return `🟠 **[중급] ${r.name}**`;
          return `• ${r.name}`;
      }).join("\n");

      const resultEmbed = new EmbedBuilder()
          .setTitle(rollCount === 10 ? "🎰 10연차 가챠 결과!" : "🎰 가챠 결과!")
          .setDescription(
            `**${interaction.user.username}**님이 뽑은 아이템들이야!\n\n${resultText}\n\n` +
            `🎁 **보너스 금전:** \`+${bonusMoney.toLocaleString()}\` 금전\n` +
            `💰 **남은 금전:** \`${(currentDobak.money - netCost).toLocaleString()}\` 금전`
          )
          .setColor(results.some(r => r.category === "GOLDEN") ? "#FFD700" : "#FF8C00")
          .setThumbnail(interaction.user.displayAvatarURL())
          .setTimestamp();

      await interaction.editReply({
        embeds: [resultEmbed],
        components: [row]
      });
    });

    collector.on('end', (collected, reason) => {
        if (reason === "user_stop") {
            interaction.deleteReply().catch(() => {});
            interaction.followUp({ 
                content: "💼 **[ 수집 완료 ]**\n방금 뽑은 굿즈들은 모두 네 **도감**에 기록되었어!\n어떤 전설적인 아이템들을 모았는지 `/도감` 명령어로 확인해봐! 콘콘!", 
                ephemeral: true 
            }).catch(() => {});
        } else {
            interaction.editReply({ components: [] }).catch(() => {});
        }
    });
  }
};
