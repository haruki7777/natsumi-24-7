import { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ComponentType 
} from "discord.js";
import FishingInventory from "../../models/FishingInventory.js";
import AnimeInventory from "../../models/AnimeInventory.js";
import { getItemCategory } from "../../utils/animeItems.js";

export default {
    data: new SlashCommandBuilder()
        .setName("가방")
        .setDescription("네가 지금까지 뭘 모았는지 확인해볼까? 콘콘!"),
    async execute(interaction) {
        const userId = interaction.user.id;

        const fishInv = await FishingInventory.findOne({ userId });
        const animeInv = await AnimeInventory.findOne({ userId });

        const hasFish = fishInv && (fishInv.goldenFish > 0 || fishInv.decentGoldenFish > 0 || fishInv.mediumFish > 0 || fishInv.regularFish > 0 || fishInv.curiousItem > 0);
        const hasAnime = animeInv && animeInv.items && animeInv.items.size > 0;

        // Helper: Create Fishing Embed
        const getFishingEmbed = () => {
            const embed = new EmbedBuilder()
                .setTitle(`🎒 ${interaction.user.username}의 낚시 가방`)
                .setDescription("네가 열심히... 아니, 대충 낚아 올린 것들이야! 콘콘!")
                .setColor("#4FC3F7")
                .setThumbnail(interaction.user.displayAvatarURL())
                .addFields(
                    { name: "🎣 [ 낚시 전리품 ]", value: 
                        `✨ **황금물고기**: \`${fishInv?.goldenFish || 0}\` 마리\n` +
                        `🌟 **빛나는 생선**: \`${fishInv?.decentGoldenFish || 0}\` 마리\n` +
                        `🐟 **괜찮은 생선**: \`${fishInv?.mediumFish || 0}\` 마리\n` +
                        `🐠 **흔한 생선**: \`${fishInv?.regularFish || 0}\` 마리\n` +
                        `🔞 **성인 용품**: \`${fishInv?.adultItem || 0}\` 개\n` +
                        `📦 **잡동사니**: \`${fishInv?.curiousItem || 0}\` 개` 
                    }
                )
                .setFooter({ text: "낚시 전리품은 /판매 명령어로 팔 수 있어!" });
            return embed;
        };

        // Helper: Create Anime Embed
        const getAnimeEmbed = () => {
            let animeSummary = { GOLDEN: 0, JACKPOT: 0, MEDIUM: 0, NORMAL: 0, ADULT: 0, FAIL: 0 };
            if (animeInv && animeInv.items) {
                for (const [name, qty] of animeInv.items) {
                    const category = getItemCategory(name);
                    animeSummary[category] += qty;
                }
            }

            const animeFieldText = 
                `💎 **전설 굿즈**: \`${animeSummary.GOLDEN}\`개\n` +
                `🌟 **대박 굿즈**: \`${animeSummary.JACKPOT}\`개\n` +
                `🟠 **중급 굿즈**: \`${animeSummary.MEDIUM}\`개\n` +
                `⚪ **일반 굿즈**: \`${animeSummary.NORMAL}\`개\n` +
                `🔞 **성인 용품**: \`${animeSummary.ADULT}\`개\n` +
                `🗑️ **잡동사니**: \`${animeSummary.FAIL}\`개`;

            const embed = new EmbedBuilder()
                .setTitle(`🎒 ${interaction.user.username}의 애니 컬렉션`)
                .setDescription("나츠미의 뽑기 머신에서 나온 한정판 굿즈들이야! 콘콘!")
                .setColor("#FFD700")
                .setThumbnail(interaction.user.displayAvatarURL())
                .addFields({ name: "🏮 [ 컬렉션 현황 ]", value: animeFieldText })
                .setFooter({ text: "애니 굿즈는 /굿즈판매 명령어로 팔 수 있어!" });
            return embed;
        };

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("inv_fish")
                .setLabel("낚시 전리품")
                .setEmoji("🎣")
                .setStyle(ButtonStyle.Primary)
                .setDisabled(false),
            new ButtonBuilder()
                .setCustomId("inv_anime")
                .setLabel("애니 컬렉션")
                .setEmoji("🏮")
                .setStyle(ButtonStyle.Success)
                .setDisabled(false),
            new ButtonBuilder()
                .setCustomId("inv_close")
                .setLabel("그만보기")
                .setEmoji("✖️")
                .setStyle(ButtonStyle.Danger)
        );

        const initialEmbed = getFishingEmbed(); // Default to fishing as requested

        const response = await interaction.reply({
            embeds: [initialEmbed],
            components: [row],
            fetchReply: true
        });

        const collector = response.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 60000
        });

        collector.on("collect", async (i) => {
            if (i.user.id !== userId) {
                return i.reply({ content: "남의 가방 훔쳐보지 마! 콘콘!", ephemeral: true });
            }

            if (i.customId === "inv_fish") {
                await i.update({ embeds: [getFishingEmbed()], components: [row] });
            } else if (i.customId === "inv_anime") {
                await i.update({ embeds: [getAnimeEmbed()], components: [row] });
            } else if (i.customId === "inv_close") {
                collector.stop("closed");
            }
        });

        collector.on("end", async (collected, reason) => {
            if (reason === "closed") {
                await interaction.deleteReply().catch(() => {});
                await interaction.followUp({ 
                    content: "💼 **[ 판매 안내 ]**\n• 낚시 전리품 판매: `/판매` (또는 `/sell_fish`)\n• 애니 굿즈 판매: `/굿즈판매` (10% 수수료)\n\n가방 정리는 잘 끝냈어? 다음에 또 봐! 콘콘!", 
                    ephemeral: true 
                }).catch(() => {});
            } else {
                interaction.editReply({ components: [] }).catch(() => {});
            }
        });
    },
};
