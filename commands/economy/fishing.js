import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from "discord.js";
import dobak_Schema from "../../models/dobak.js";
import FishingInventory from "../../models/FishingInventory.js";
import { FISHING_ITEMS } from "../../utils/fishingItems.js";

export default {
    data: new SlashCommandBuilder()
        .setName("낚시")
    .setDescription("콘콘! 강가에서 물고기를 낚아보자! (주의: 여우는 생선을 아주 좋아해!)"),
    async execute(interaction) {
        const userId = interaction.user.id;
        const cooldownTime = 30 * 1000; // 30 seconds

        // 1. Check/Create Inventory & Cooldown
        let inventory = await FishingInventory.findOne({ userId });
        if (!inventory) {
            inventory = await FishingInventory.create({ userId });
        }

        const now = Date.now();
        if (now - inventory.lastFishingTime < cooldownTime) {
            const remaining = Math.ceil((cooldownTime - (now - inventory.lastFishingTime)) / 1000);
            return interaction.reply({
                content: `**급할수록 돌아가라고!** 물고기들도 쉴 시간이 필요하단 말야. \`${remaining}\`초 후에 다시 오든가! 흥!`,
                ephemeral: true
            });
        }

        // 2. Check Money Data
        let userData = await dobak_Schema.findOne({ userid: userId });
        if (!userData) {
            return interaction.reply({
                content: "누구신지? 숲에 이름도 안 적어놓고 낚시를 하겠다구? `/출석체크`부터 하고 와!",
                ephemeral: true
            });
        }

        // Update last fishing time to prevent double-starts during the process
        inventory.lastFishingTime = now;
        await inventory.save();

        const initialEmbed = new EmbedBuilder()
            .setTitle("🎣 낚시 시작!")
            .setDescription("나츠미가 낚싯대를 던졌어... 물고기가 입질할 때까지 조용히 해! 🦊")
            .setColor("#FF7F50")
            .setThumbnail("https://cdn-icons-png.flaticon.com/512/2855/2855140.png")
            .setFooter({ text: "입질이 오면 5초 안에 버튼을 눌러! 안 누르면 꼬리로 때릴 거야!" });

        await interaction.reply({ embeds: [initialEmbed] });

        // 3. Wait for bite (2-5 seconds random)
        const waitTime = Math.floor(Math.random() * 3000) + 2000;
        
        setTimeout(async () => {
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('reel_in')
                        .setLabel('지금이야! 잡아당겨!!')
                        .setEmoji('🦊')
                        .setStyle(ButtonStyle.Success)
                );

            const biteEmbed = new EmbedBuilder()
                .setTitle("❗ 지금이야, 바보야!")
                .setDescription("엄청난 영력이 느껴진다구!! 빨리 낚아올려! 뭐 해!!!")
                .setColor("#FFD700")
                .setThumbnail("https://cdn-icons-png.flaticon.com/512/3241/3241951.png");

            const response = await interaction.editReply({
                embeds: [biteEmbed],
                components: [row]
            });

            // 4. Collector for button
            const collector = response.createMessageComponentCollector({
                componentType: ComponentType.Button,
                time: 5000 // 5 seconds
            });

            collector.on('collect', async (i) => {
                if (i.user.id !== userId) {
                    return i.reply({ content: "**남의 생선을 탐내다니!** 정말 매너 없네! 콘콘!", ephemeral: true });
                }

                collector.stop('success');
            });

            collector.on('end', async (collected, reason) => {
                if (reason === 'success') {
                    // SUCCESS CASE
                    const chance = Math.random() * 100;
                    let fishType = "";
                    let bonus = 0;
                    let field = "";
                    let color = "#FF7F50";

                    const itemLists = FISHING_ITEMS;

                    const getRandomItem = (list) => list[Math.floor(Math.random() * list.length)];

                    if (chance <= 0.5) {
                        fishType = getRandomItem(itemLists.GOLDEN);
                        bonus = 100000;
                        field = "goldenFish";
                        color = "#FFD700";
                    } else if (chance <= 1.5) {
                        fishType = getRandomItem(itemLists.JACKPOT);
                        bonus = 20000;
                        field = "decentGoldenFish";
                        color = "#DAA520";
                    } else if (chance <= 11.5) {
                        fishType = getRandomItem(itemLists.MEDIUM);
                        bonus = 3000;
                        field = "mediumFish";
                        color = "#4682B4";
                    } else if (chance <= 31.5) {
                        fishType = getRandomItem(itemLists.NORMAL);
                        bonus = 800;
                        field = "regularFish";
                        color = "#87CEEB";
                    } else if (chance <= 41.5) {
                        fishType = getRandomItem(itemLists.ADULT);
                        bonus = 1500;
                        field = "adultItem";
                        color = "#FF69B4";
                    } else if (chance <= 61.5) {
                        fishType = getRandomItem(itemLists.FAIL);
                        bonus = 300;
                        field = "curiousItem";
                        color = "#A9A9A9";
                    } else {
                        fishType = getRandomItem(itemLists.JUNK);
                        bonus = 50;
                        color = "#8B4513";
                    }

                    // Update Data
                    if (field) {
                        inventory[field] += 1;
                        await inventory.save();

                        // Track Collection (Achievements)
                        try {
                            const Collection = (await import("../../models/Collection.js")).default;
                            let userCol = await Collection.findOne({ userId });
                            if (!userCol) userCol = new Collection({ userId, animeItems: [], fishingItems: [] });

                            if (!userCol.fishingItems.includes(fishType)) {
                                userCol.fishingItems.push(fishType);
                                await userCol.save();
                            }
                        } catch (colErr) {
                            console.error("[Collection Tracking Error]", colErr);
                        }
                    }

                    await dobak_Schema.updateOne(
                        { userid: userId },
                        { $inc: { money: bonus } }
                    );

                    const successEmbed = new EmbedBuilder()
                        .setTitle("🎉 낚시 성공! 콘콘!")
                        .setDescription(`**${fishType}**을(를) 낚아올리다니, 제법이네? \n**별로 널 칭찬하는 건 아니니까 착각하지 마!** ♥(⸝⸝⸝ᵒ̴̶̷̥́ ᵕ ก̀⸝⸝⸝)ෆ`)
                        .addFields(
                            { name: "💰 챙겨준 금전", value: `\`${bonus.toLocaleString()}\` 금전`, inline: true },
                            { name: "💳 총 주머니", value: `\`${(userData.money + bonus).toLocaleString()}\` 금전`, inline: true }
                        )
                        .setColor(color)
                        .setThumbnail("https://cdn-icons-png.flaticon.com/512/1152/1152912.png")
                        .setFooter({ text: "가방에 잘 넣어뒀어! 내 생선은... 없네? 흥!" });

                    await interaction.editReply({ embeds: [successEmbed], components: [] });

                } else {
                    // FAIL CASE (TIMEOUT)
                    const penalty = 1000;
                    await dobak_Schema.updateOne(
                        { userid: userId },
                        { $inc: { money: -penalty } }
                    );

                    const failEmbed = new EmbedBuilder()
                        .setTitle("❌ 낚시 실패... 한심해!")
                        .setDescription("바보야! 그렇게 굼떠서 어떡해? 물고기가 비웃으면서 도망갔잖아! 콘콘!")
                        .addFields(
                            { name: "💸 수리비 패널티", value: `\`-${penalty.toLocaleString()}\` 금전`, inline: true },
                            { name: "💳 남은 주머니", value: `\`${Math.max(0, userData.money - penalty).toLocaleString()}\` 금전`, inline: true }
                        )
                        .setColor("#ED4245")
                        .setThumbnail("https://cdn-icons-png.flaticon.com/512/1198/1198402.png")
                        .setFooter({ text: "잠이 덜 깬 거야? 정신 똑바로 차려!" });

                    await interaction.editReply({ embeds: [failEmbed], components: [] });
                }
            });
        }, waitTime);
    },
};
