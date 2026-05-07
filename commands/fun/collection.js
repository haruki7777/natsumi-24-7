import { 
  SlashCommandBuilder, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ComponentType 
} from "discord.js";
import Collection from "../../models/Collection.js";
import { ANIME_ITEMS } from "../../utils/animeItems.js";
import { FISHING_ITEMS } from "../../utils/fishingItems.js";

export default {
  data: new SlashCommandBuilder()
    .setName("도감")
    .setDescription("지금까지 수집한 전설적인 전리품들을 확인합니다! 한 번 얻으면 영원히 기록돼요!"),

  async execute(interaction) {
    const userId = interaction.user.id;
    let userCol = await Collection.findOne({ userId });

    if (!userCol) {
      userCol = { animeItems: [], fishingItems: [] };
    }

    const getFishingColEmbed = (page = 0) => {
      const categories = ["GOLDEN", "JACKPOT", "MEDIUM", "NORMAL", "ADULT", "FAIL"];
      const category = categories[page % categories.length];
      const categoryLabels = {
          GOLDEN: "✨ 전설 (GOLDEN)",
          JACKPOT: "🌟 대박 (JACKPOT)",
          MEDIUM: "🐟 중급 (MEDIUM)",
          NORMAL: "🐠 일반 (NORMAL)",
          ADULT: "🔞 성인 (ADULT)",
          FAIL: "📦 잡동사니 (FAIL)"
      };

      const items = FISHING_ITEMS[category];
      let text = `### [ ${categoryLabels[category]} ]\n`;
      
      items.forEach(item => {
          const isUnlocked = userCol.fishingItems.includes(item);
          text += `${isUnlocked ? "✅" : "🔓"} ${item}\n`;
      });

      return new EmbedBuilder()
        .setTitle(`📖 ${interaction.user.username}의 낚시 도감`)
        .setDescription("지금까지 낚아본 전설적인 생선들이야! 콘콘!\n\n" + text)
        .setColor("#4FC3F7")
        .setThumbnail(interaction.user.displayAvatarURL())
        .setFooter({ text: `총 ${userCol.fishingItems.length}종의 생선을 낚았어! (${page + 1}/${categories.length} 페이지)` });
    };

    const getAnimeColEmbed = (page = 0) => {
        const categories = ["GOLDEN", "JACKPOT", "MEDIUM", "NORMAL", "ADULT"];
        const category = categories[page % categories.length];
        const categoryLabels = {
            GOLDEN: "👑 전설 (GOLDEN)",
            JACKPOT: "🌟 대박 (JACKPOT)",
            MEDIUM: "🟠 중급 (MEDIUM)",
            NORMAL: "⚪ 일반 (NORMAL)",
            ADULT: "🔞 성인 (ADULT)"
        };

        const items = ANIME_ITEMS[category];
        let text = `### [ ${categoryLabels[category]} ]\n`;
        
        items.forEach(item => {
            const isUnlocked = userCol.animeItems.includes(item);
            text += `${isUnlocked ? "✅" : "🔓"} ${item}\n`;
        });

        const embed = new EmbedBuilder()
            .setTitle(`📖 ${interaction.user.username}의 애니 굿즈 도감`)
            .setDescription("수집했던 모든 굿즈가 기록되는 마법의 도감이야! 콘콘!\n\n" + text)
            .setColor("#FFD700")
            .setThumbnail(interaction.user.displayAvatarURL())
            .setFooter({ text: `총 ${userCol.animeItems.length}종의 굿즈를 수집했어! (${page + 1}/${categories.length} 페이지)` });
        
        return embed;
    };

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("col_fish")
            .setLabel("낚시 도감")
            .setEmoji("🎣")
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId("col_anime")
            .setLabel("애니 도감")
            .setEmoji("🏮")
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId("col_next")
            .setLabel("다음 페이지")
            .setEmoji("➡️")
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId("col_close")
            .setLabel("그만보기")
            .setEmoji("✖️")
            .setStyle(ButtonStyle.Danger)
    );

    let animePage = 0;
    let fishPage = 0;
    let currentMode = "fish";

    const response = await interaction.reply({
        embeds: [getFishingColEmbed(fishPage)],
        components: [row],
        fetchReply: true
    });

    const collector = response.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 120000
    });

    collector.on("collect", async (i) => {
        if (i.user.id !== userId) {
            return i.reply({ content: "네 도감은 네가 직접 보라고! 콘콘!", ephemeral: true });
        }

        if (i.customId === "col_fish") {
            currentMode = "fish";
            await i.update({ embeds: [getFishingColEmbed(fishPage)], components: [row] });
        } else if (i.customId === "col_anime") {
            currentMode = "anime";
            await i.update({ embeds: [getAnimeColEmbed(animePage)], components: [row] });
        } else if (i.customId === "col_next") {
            if (currentMode === "fish") {
                const totalFishPages = 6;
                fishPage = (fishPage + 1) % totalFishPages;
                await i.update({ embeds: [getFishingColEmbed(fishPage)], components: [row] });
            } else {
                const totalAnimePages = 5;
                animePage = (animePage + 1) % totalAnimePages;
                await i.update({ embeds: [getAnimeColEmbed(animePage)], components: [row] });
            }
        } else if (i.customId === "col_close") {
            collector.stop("closed");
        }
    });

    collector.on("end", async (collected, reason) => {
        if (reason === "closed") {
            await interaction.deleteReply().catch(() => {});
            await interaction.followUp({ 
                content: "💼 **[ 판매 안내 ]**\n• 낚시 전리품 판매: `/판매` (또는 `/sell_fish`)\n• 애니 굿즈 판매: `/굿즈판매` (10% 수수료)\n\n다음에 또 보러 와! 콘콘!", 
                ephemeral: true 
            }).catch(() => {});
        } else {
            interaction.editReply({ components: [] }).catch(() => {});
        }
    });
  }
};
