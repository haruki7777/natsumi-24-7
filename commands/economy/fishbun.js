import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import dobak_Schema from "../../models/dobak.js";
import { addXP } from "../../events/levels.js";

export default {
    data: new SlashCommandBuilder()
        .setName("붕어빵뽑기")
        .setDescription("뜨끈뜨끈한 붕어빵 기계에서 운을 시험해봐! 콘콘!")
        .addIntegerOption((f) =>
            f
                .setName("금액")
                .setDescription("얼마나 베팅할 거야? (최소 100냥)")
                .setMinValue(100)
                .setRequired(true)
        ),
    /**
     * @param {import("discord.js").ChatInputCommandInteraction} interaction
     */
    async execute(interaction) {
        if (!interaction.deferred && !interaction.replied) await interaction.deferReply();

        const bettingMoney = interaction.options.getInteger("금액");
        const userData = await dobak_Schema.findOne({
            userid: interaction.user.id,
        });

        if (!userData) {
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(`${interaction.user.username}님! 데이터가 존재하지 않다냥!\n\`/출석체크\`로 먼저 돈을 받아라냥!`)
                        .setColor("Red")
                ]
            });
        }

        if (userData.money < bettingMoney) {
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(`${interaction.user.username}님! 잔액이 부족하다냥! 현재 잔액: \`${userData.money.toLocaleString()}\`원`)
                        .setColor("Red")
                ]
            });
        }

        const chance = Math.random() * 100;
        let resultText = "";
        let winAmount = 0;
        let color = "Grey";
        let fishType = "";
        let xpAmount = 5;
        let quantity = 0;

        // Probabilities: 0.5% Golden, 15% Intermediate, 25% Normal, 59.5% Fail
        if (chance <= 0.5) {
            // Golden (0.5%) - 10 Types
            const goldenTypes = [
                "✨ 전설의 천상계 다이아몬드 잉어빵",
                "💫 은하수 광채를 머금은 갤럭시 잉어빵",
                "👑 고대 용의 기운이 깃든 용의 숨결 잉어빵",
                "🌈 일곱 빛깔 무지개를 삼킨 프리즘 잉어빵",
                "🌠 밤하늘의 별똥별이 가라앉은 유성 잉어빵",
                "💎 순금 99.9% 함유 황금 제왕 잉어빵",
                "🎭 신의 장난으로 빚어진 환상종 잉어빵",
                "⚡ 번개의 신이 구워낸 전율의 잉어빵",
                "☀️ 태양의 핵을 품은 초고온 잉어빵",
                "🌑 우주의 블랙홀을 막아낸 심연의 잉어빵"
            ];
            fishType = goldenTypes[Math.floor(Math.random() * goldenTypes.length)];
            quantity = Math.floor(Math.random() * 10) + 1; // 1~10 개
            
            // 배점: (베팅금 * 10) * 개수 -> 10배~100배
            winAmount = (bettingMoney * 10) * quantity;
            xpAmount = 300 + (quantity * 20);
            resultText = `🔥 **역사적인 순간이야!!!!** 🔥\n전설 속의 \`${fishType}\`을(를) 무려 **${quantity}개**나 낚아올렸어!! 대박 보너스가 터져서 총 \`${winAmount.toLocaleString()}\` 냥을 벌었어! 축하해, 바보야! 콘콘!`;
            color = "#FFD700";
        } else if (chance <= 15.5) {
            // Intermediate (15%) - 10 Types
            const intermediateTypes = [
                "🍯 꿀이 뚝뚝 흐르는 슈크림 대왕 붕어빵",
                "🍵 프리미엄 말차를 듬뿍 머금은 녹차 붕어빵",
                "🍓 상큼달콤 딸기 과즙이 터지는 핑크 붕어빵",
                "🧀 치즈가 1미터 늘어나는 피자 붕어빵",
                "🍫 초코 분수에서 갓 건져올린 다크 붕어빵",
                "🍠 할머니의 정성이 담긴 자색 고구마 붕어빵",
                "☕ 바리스타 나츠미 추천 모카 붕어빵",
                "🥐 겹겹이 층이 살아있는 페이스트리 붕어빵",
                "🍦 속이 시원한 아이스 민트초코 붕어빵",
                "🌰 알밤이 통째로 들어간 허니 밤 붕어빵"
            ];
            fishType = intermediateTypes[Math.floor(Math.random() * intermediateTypes.length)];
            quantity = Math.floor(Math.random() * 10) + 1; // 1~10 개
            
            // 배점: 베팅금 * (1 + (개수 * 0.5)) -> 1.5배~6배
            winAmount = Math.floor(bettingMoney * (1 + (quantity * 0.5)));
            xpAmount = 50 + (quantity * 5);
            resultText = `🎊 **와아! 대성공이야!!** 🎊\n퀄리티 높은 \`${fishType}\`을(를) **${quantity}개**나 뽑았어! 나츠미도 한 입만 주면 좋겠는데... (흥!) \`${winAmount.toLocaleString()}\` 냥을 챙겼어!`;
            color = "#FFA500";
        } else if (chance <= 40.5) {
            // Normal (25%) - 10 Types
            const normalTypes = [
                "🐟 바삭바삭 클래식 팥 붕어빵",
                "🥧 부드럽고 촉촉한 커스타드 붕어빵",
                "🧂 단짠단짠 매력의 소금 붕어빵",
                "🌰 씹는 맛이 일품인 호두 붕어빵",
                "🍎 달콤하고 향긋한 사과잼 붕어빵",
                "🫐 새콤한 블루베리가 톡톡 터지는 붕어빵",
                "🥛 고소한 우유 크림이 듬뿍 든 붕어빵",
                "🥞 찰떡이 들어있어 쫀득한 찹쌀 붕어빵",
                "🌽 옥수수 알갱이가 씹히는 콘 붕어빵",
                "🥨 설탕을 듬뿍 뿌린 겉바속촉 붕어빵"
            ];
            fishType = normalTypes[Math.floor(Math.random() * normalTypes.length)];
            quantity = Math.floor(Math.random() * 10) + 1; // 1~10 개
            
            // 배점: 베팅금 * (0.8 + (개수 * 0.1)) -> 0.9배~1.8배
            winAmount = Math.floor(bettingMoney * (0.8 + (quantity * 0.1)));
            xpAmount = 20 + quantity;
            resultText = `✨ **나쁘지 않네! 성공이야!** ✨\n맛있는 \`${fishType}\`을(를) **${quantity}개** 획득했어! \`${winAmount.toLocaleString()}\` 냥을 벌어들였다구! 고마워하라구!`;
            color = "#8B4513";
        } else {
            // Fail (59.5%) - 10 Types
            const failTypes = [
                "🔥 시꺼멓게 타버린 지옥의 석탄 붕어빵",
                "💧 속이 텅 빈 밀가루 반죽 덩어리",
                "🕊️ 비둘기가 낚아채 간 빈 봉투",
                "💥 옆구리 터져서 내용물 다 사망한 붕어빵",
                "🥶 이빨 나갈 정도로 딱딱한 아이스 붕어빵",
                "🌪️ 먼지만 가득한 텅 빈 붕어빵 봉투",
                "🌵 왜 들어있는지 모를 가시 돋친 선인장",
                "🧼 세제 맛이 나는 비눗방울 붕어빵",
                "🧱 먹으면 임플란트 확정인 벽돌 붕어빵",
                "👻 귀신이 속만 쏙 빼먹은 껍데기 붕어빵"
            ];
            fishType = failTypes[Math.floor(Math.random() * failTypes.length)];
            winAmount = -bettingMoney;
            xpAmount = 10;
            resultText = `💀 **이걸 돈 주고 뽑은 거야? ㅋㅋㅋ** 💀\n기계에서 나온 건 \`${fishType}\`뿐이야! 베팅금 \`${bettingMoney.toLocaleString()}\` 냥은 내가 맛있게 쓸게! ㅋㅋㅋㅋ 꼬시네!`;
            color = "#FF0000";
        }

        // Apply 정산
        const netGain = winAmount > 0 ? winAmount - bettingMoney : winAmount;

        await dobak_Schema.updateOne(
            { userid: interaction.user.id },
            { money: userData.money + netGain }
        );

        if (interaction.guildId) {
            await addXP(interaction.guildId, interaction.user.id, xpAmount, interaction);
        }

        const embed = new EmbedBuilder()
            .setTitle("🥞 나츠미의 뜨끈뜨끈 붕어빵 기계")
            .setAuthor({
                name: interaction.user.username,
                iconURL: interaction.user.displayAvatarURL({ dynamic: true })
            })
            .setDescription(`**결과: ${fishType}**\n\n${resultText}`)
            .addFields(
                { name: "베팅 금액", value: `\`${bettingMoney.toLocaleString()}\` 냥`, inline: true },
                { name: "최종 수익", value: `\`${(netGain > 0 ? "+" : "") + netGain.toLocaleString()}\` 냥`, inline: true },
                { name: "보유 잔액", value: `\`${(userData.money + netGain).toLocaleString()}\` 냥`, inline: true }
            )
            .setColor(color)
            .setFooter({ text: "적당히 즐기라고! 중독되면 꼬리로 때릴 거야! 콘콘!" })
            .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
    },
};
