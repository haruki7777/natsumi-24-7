import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from "discord.js";
import dobak_Schema from "../../models/dobak.js";
import FishingInventory from "../../models/FishingInventory.js";

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
                .setDescription("엄청난 힘이 느껴진다구!! 빨리 낚아올려! 뭐 해!!!")
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

                    const itemLists = {
                        golden: [
                            "✨ 전설의 황금 나츠미 연어", "✨ 여우신의 보물 황금 잉어", "✨ 신화 속 황금 고래", "✨ 은하수 황금 참치", "✨ 영원한 생명의 황금어",
                            "✨ 바다의 심장 황금 상어", "✨ 태양을 삼킨 황금 멸치", "✨ 아틀란티스의 황금 장어", "✨ 보석 박힌 황금 가오리", "✨ 투명한 황금 복어",
                            "✨ 거대 황금 문어", "✨ 신성한 황금 도미", "✨ 전설의 황금 돗돔", "✨ 꿈을 먹는 황금 갈치", "✨ 황금 비늘의 농어",
                            "✨ 천년 묵은 황금 거북", "✨ 바다 신의 황금 삼치", "✨ 보물 지도를 품은 황금 조기", "✨ 영롱한 빛의 황금 민어", "✨ 궁극의 황금 블랙배스"
                        ],
                        decentGolden: [
                            "🌟 반짝이는 나츠미 미꾸라지", "🌟 작지만 빛나는 황금 송어", "🌟 그럭저럭 큰 황금 우럭", "🌟 평범한 황금 고등어", "🌟 빛바랜 황금 광어",
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
                        bonus = 100000;
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
                        .setTitle("🎉 낚시 성공! 콘콘!")
                        .setDescription(`**${fishType}**을(를) 낚아올리다니, 제법이네? \n**별로 널 칭찬하는 건 아니니까 착각하지 마!** ♥(⸝⸝⸝ᵒ̴̶̷̥́ ᵕ ก̀⸝⸝⸝)ෆ`)
                        .addFields(
                            { name: "💰 챙겨준 냥", value: `\`${bonus.toLocaleString()}\` 냥`, inline: true },
                            { name: "💳 총 주머니", value: `\`${(userData.money + bonus).toLocaleString()}\` 냥`, inline: true }
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
                            { name: "💸 수리비 패널티", value: `\`-${penalty.toLocaleString()}\` 냥`, inline: true },
                            { name: "💳 남은 주머니", value: `\`${Math.max(0, userData.money - penalty).toLocaleString()}\` 냥`, inline: true }
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
