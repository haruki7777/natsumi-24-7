import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from "discord.js";
import dobak_Schema from "../../models/dobak.js";
import FishingInventory from "../../models/FishingInventory.js";

export default {
    data: new SlashCommandBuilder()
        .setName("낚시")
        .setDescription("강가에서 물고기를 낚아보자냥! (5초 반응 필수!)"),
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
                content: `너무 자주 낚시하면 물고기가 도망간다냥! \`${remaining}\`초 후에 다시 시도해라냥!`,
                ephemeral: true
            });
        }

        // 2. Check Money Data
        let userData = await dobak_Schema.findOne({ userid: userId });
        if (!userData) {
            return interaction.reply({
                content: "나츠미 뱅크에 계좌가 없다냥! `/출석체크`로 먼저 가입하고 돈을 받아라냥!",
                ephemeral: true
            });
        }

        // Update last fishing time to prevent double-starts during the process
        inventory.lastFishingTime = now;
        await inventory.save();

        const initialEmbed = new EmbedBuilder()
            .setTitle("🎣 낚시 시작!")
            .setDescription("나츠미가 낚싯대를 던졌다냥... 물고기가 입질할 때까지 가만히 기다려라냥.")
            .setColor("Blue")
            .setThumbnail("https://cdn-icons-png.flaticon.com/512/2855/2855140.png")
            .setFooter({ text: "입질이 오면 5초 안에 버튼을 눌러야 한다냥!" });

        await interaction.reply({ embeds: [initialEmbed] });

        // 3. Wait for bite (2-5 seconds random)
        const waitTime = Math.floor(Math.random() * 3000) + 2000;
        
        setTimeout(async () => {
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('reel_in')
                        .setLabel('지금이다! 낚아올리기!!')
                        .setEmoji('🎣')
                        .setStyle(ButtonStyle.Primary)
                );

            const biteEmbed = new EmbedBuilder()
                .setTitle("❗ 입질이 왔다냥!")
                .setDescription("지금이다냥!! 물속에서 엄청난 힘이 느껴진다냥! 빨리 낚아올려라냥!!!")
                .setColor("Yellow")
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
                    return i.reply({ content: "남의 낚싯대를 건드리면 안 된다냥!", ephemeral: true });
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
                    let color = "Green";

                    const itemLists = {
                        golden: [
                            "✨ 전설의 황금 연어", "✨ 고대 황금 잉어", "✨ 신화 속 황금 고래", "✨ 은하수 황금 참치", "✨ 영원한 생명의 황금어",
                            "✨ 바다의 심장 황금 상어", "✨ 태양을 삼킨 황금 멸치", "✨ 아틀란티스의 황금 장어", "✨ 보석 박힌 황금 가오리", "✨ 투명한 황금 복어",
                            "✨ 거대 황금 문어", "✨ 신성한 황금 도미", "✨ 전설의 황금 돗돔", "✨ 꿈을 먹는 황금 갈치", "✨ 황금 비늘의 농어",
                            "✨ 천년 묵은 황금 거북", "✨ 바다 신의 황금 삼치", "✨ 보물 지도를 품은 황금 조기", "✨ 영롱한 빛의 황금 민어", "✨ 궁극의 황금 블랙배스"
                        ],
                        decentGolden: [
                            "🌟 반짝이는 황금 미꾸라지", "🌟 작지만 빛나는 황금 송어", "🌟 그럭저럭 큰 황금 우럭", "🌟 평범한 황금 고등어", "🌟 빛바랜 황금 광어",
                            "🌟 인공 황금 도루묵", "🌟 어린 황금 방어", "🌟 도금된 황금 망둥어", "🌟 노란빛 황금 꽁치", "🌟 황색 황금 전어",
                            "🌟 샛노란 황금 정어리", "🌟 장식용 황금 비단잉어", "🌟 연한 황금빛 숭어", "🌟 반짝이는 황금 빙어", "🌟 금빛 도는 황금 가재",
                            "🌟 금색 무늬 황금 해파리", "🌟 유행하는 황금 조개", "🌟 나츠미가 색칠한 황금 물고기", "🌟 유리 조각 같은 황금 빙어", "🌟 보석 눈을 가진 황금 붕어"
                        ],
                        medium: [
                            "🐟 통통한 참돔", "🐟 힘 좋은 방어", "🐟 싱싱한 광어", "🐟 거대한 연어", "🐟 맛있는 농어",
                            "🐟 커다란 참치", "🐟 쫄기한 문어", "🐟 살오른 우럭", "🐟 기름진 삼치", "🐟 귀한 옥돔",
                            "🐟 커다란 갈치", "🐟 튼실한 민어", "🐟 힘찬 장어", "🐟 도톰한 도미", "🐟 화려한 쏠종개",
                            "🐟 무게감 있는 달고기", "🐟 활발한 능성어", "🐟 거대 블랙배스", "🐟 신선한 돌돔", "🐟 묵직한 가다랑어"
                        ],
                        regular: [
                            "🐠 평범한 고등어", "🐠 흔한 전치", "🐠 작은 조기", "🐠 매끈한 꽁치", "🐠 은빛 정어리",
                            "🐠 갈색 망둥어", "🐠 작은 멸치", "🐠 평범한 송어", "🐠 붕어 한 마리", "🐠 흔하디 흔한 미꾸라지",
                            "🐠 작은 보리멸", "🐠 갯지렁이 먹은 복어", "🐠 날씬한 학공치", "🐠 작은 가재", "🐠 흔한 동자개",
                            "🐠 평범한 잉어", "🐠 작고 귀여운 피라미", "🐠 흙냄새 나는 꺽지", "🐠 평범한 가시고기", "🐠 강가의 흔한 메기"
                        ],
                        curious: [
                            "📦 녹슨 상자", "📦 젖은 종이 뭉치", "📦 낡은 낚시찌", "📦 금 간 유리병", "📦 이끼 낀 돌멩이",
                            "📦 구멍 난 양말", "📦 빈 통조림 캔", "📦 찢어진 그물 조각", "📦 부러진 안경테", "📦 낡은 동전 한 닢",
                            "📦 축축한 장화 한 짝", "📦 찌그러진 페트병", "📦 뜯어진 루어 미끼", "📦 이끼 낀 보물지도 조각", "📦 낡은 편지 봉투",
                            "📦 녹슨 열쇠", "📦 젖은 인형 머리", "📦 깨진 사발 조각", "📦 낡은 머리핀", "📦 나츠미가 잃어버린 리본"
                        ],
                        junk: [
                            "👞 다 떨어진 운동화", "👞 냄새나는 장화", "👞 찢어진 슬리퍼", "👞 한 짝뿐인 구두", "👞 낡은 등산화",
                            "👞 모래 가득한 샌들", "👞 곰팡이 핀 단화", "👞 굽 빠진 하이힐", "👞 작아진 아기 신발", "👞 물 빠진 캔버스화",
                            "👞 낡은 고무신", "👞 털 빠진 슬리퍼", "👞 흙투성이 작업화", "👞 밑창 떨어진 워커", "👞 끈 없는 스니커즈",
                            "👞 낡은 목욕탕 슬리퍼", "👞 찢어진 실내화", "👞 누더기가 된 오리발", "👞 축 늘어진 조리", "👞 나츠미가 던진 실내화"
                        ]
                    };

                    const getRandomItem = (list) => list[Math.floor(Math.random() * list.length)];

                    if (chance <= 0.5) {
                        fishType = getRandomItem(itemLists.golden);
                        bonus = 100000; // Increased bonus for legend
                        field = "goldenFish";
                        color = "#FFD700";
                    } else if (chance <= 1.5) {
                        fishType = getRandomItem(itemLists.decentGolden);
                        bonus = 20000;
                        field = "decentGoldenFish";
                        color = "#DAA520";
                    } else if (chance <= 11.5) {
                        fishType = getRandomItem(itemLists.medium);
                        bonus = 3000;
                        field = "mediumFish";
                        color = "#4682B4";
                    } else if (chance <= 31.5) {
                        fishType = getRandomItem(itemLists.regular);
                        bonus = 800;
                        field = "regularFish";
                        color = "#87CEEB";
                    } else if (chance <= 61.5) {
                        fishType = getRandomItem(itemLists.curious);
                        bonus = 300;
                        field = "curiousItem";
                        color = "#A9A9A9";
                    } else {
                        fishType = getRandomItem(itemLists.junk);
                        bonus = 50;
                        color = "#8B4513";
                    }

                    // Update Data
                    if (field) {
                        inventory[field] += 1;
                        await inventory.save();
                    }

                    await dobak_Schema.updateOne(
                        { userid: userId },
                        { $inc: { money: bonus } }
                    );

                    const successEmbed = new EmbedBuilder()
                        .setTitle("🎉 낚시 성공!")
                        .setDescription(`축하한다냥!! **${fishType}**(을)를 낚아올렸다냥!`)
                        .addFields(
                            { name: "획득 보너스", value: `\`${bonus.toLocaleString()}\`원`, inline: true },
                            { name: "나츠미 뱅크 잔액", value: `\`${(userData.money + bonus).toLocaleString()}\`원`, inline: true }
                        )
                        .setColor(color)
                        .setThumbnail("https://cdn-icons-png.flaticon.com/512/1152/1152912.png")
                        .setFooter({ text: "가방에 잘 보관해뒀다냥! 나중에 판매해라냥~" });

                    await interaction.editReply({ embeds: [successEmbed], components: [] });

                } else {
                    // FAIL CASE (TIMEOUT)
                    const penalty = 1000;
                    await dobak_Schema.updateOne(
                        { userid: userId },
                        { $inc: { money: -penalty } }
                    );

                    const failEmbed = new EmbedBuilder()
                        .setTitle("❌ 낚시 실패...")
                        .setDescription("너무 늦었다냥!! 물고기가 낚싯대를 끌고 도망가버렸다냥...")
                        .addFields(
                            { name: "패널티 (장비 수리비)", value: `\`-${penalty.toLocaleString()}\`원`, inline: true },
                            { name: "나츠미 뱅크 잔액", value: `\`${Math.max(0, userData.money - penalty).toLocaleString()}\`원`, inline: true }
                        )
                        .setColor("Red")
                        .setThumbnail("https://cdn-icons-png.flaticon.com/512/1198/1198402.png")
                        .setFooter({ text: "반응 속도를 더 키워와라냥!" });

                    await interaction.editReply({ embeds: [failEmbed], components: [] });
                }
            });
        }, waitTime);
    },
};
