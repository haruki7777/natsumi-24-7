import { EmbedBuilder } from "discord.js";
import dobak_Schema from "../models/dobak.js";
import { addXP } from "../events/levels.js";

export default {
    name: "MiningDig", // Matches the prefix of CustomId
    /**
     * @param {import("discord.js").ButtonInteraction} interaction
     * @param {import("discord.js").Client} client
     */
    async execute(interaction, client) {
        const [idPrefix, targetUserId, bettingMoneyStr] = interaction.customId.split("_");
        const bettingMoney = parseInt(bettingMoneyStr);

        // Security check
        if (interaction.user.id !== targetUserId) {
            return interaction.reply({ content: "**자신의 광산에서만 캘 수 있다냥!!** 남의 거 탐내면 못쓴다냥~", ephemeral: true });
        }

        await interaction.deferUpdate();

        const userData = await dobak_Schema.findOne({ userid: targetUserId });
        if (!userData || userData.money < bettingMoney) {
            return interaction.editReply({ content: "**잔액이 부족하거나 데이터가 사라졌다냥!**", embeds: [], components: [] });
        }

        const chance = Math.random() * 100;
        let mineCategory = "";
        let itemName = "";
        let winMultiplier = 0;
        let quantity = 0;
        let color = "#7F8C8D";
        let xpAmount = 10;

        // Probabilities: 0.5% Gold, 1% Mansour, 10% Intermediate, 20% Normal, 68.5% Fail
        if (chance <= 0.5) {
            // Golden Mine (0.5%) - x30 to x100
            const items = [
                "🔱 아틀란티스의 신화적 포세이돈 금괴", "👑 나츠미 왕궁의 국보급 황금관", "💫 초신성 폭발로 생성된 항성핵 금속", 
                "🌈 무지개 끝에서 발견된 레프리콘의 황금단지", "💎 1,000캐럿짜리 태고의 다이아몬드 원석", "🪐 목성의 기압으로 압축된 초고밀도 금석", 
                "🎭 신들이 연회에서 쓰던 순금 술잔", "🔱 해저 문명의 오리할콘 주괴", "⚡ 제우스의 벼락이 응축된 전격 황금", 
                "🐉 잠든 용이 지키던 에인션트 골드", "🌌 차원의 틈새에서 흘러나온 에테르 금", "💖 영원한 사랑을 약속하는 아프로디테의 금장식", 
                "🧊 절대 영도에서도 빛나는 절대 금", "🪞 진실만을 비추는 헤르메스의 황금 거울", "🩸 불사조의 피로 담금질된 불멸의 금"
            ];
            mineCategory = "✨ 전설의 황금 광산 ✨";
            itemName = items[Math.floor(Math.random() * items.length)];
            quantity = Math.floor(Math.random() * 10) + 1;
            winMultiplier = 30 + (quantity * 2);
            xpAmount = 500;
            color = "#F1C40F";
        } else if (chance <= 1.5) {
            // Mansour Mine (1.0%) - x10 to x25
            const items = [
                "🛢️ 중동 석유 부자의 은밀한 개인 금고", "💰 스위스 은행 지하 암실의 무기명 금괴", "🎿 두바이 실내 스키장의 인공 눈 속 다이아몬드", 
                "🐎 순종 아랍마의 황금 편자", "🚢 초호화 크루즈 객실의 황금 수도꼭지", "⌚ 억만장자 전용 한정판 플래티넘 시계", 
                "🏺 로마 황제의 무덤에서 발굴된 보물함", "🏰 중세 성주의 비밀 통로에 숨겨진 보물", "🍷 한 병에 수천만원 하는 빈티지 와인병", 
                "♟️ 장인이 깎은 상아와 루비 체스 세트", "🎻 전설적인 스트라디바리우스 바이올린", "🖼️ 경매가 측정 불가의 거장 회화", 
                "🏹 오스만 제국 술탄의 황금 활", "📯 길드 창립자의 전설적인 나팔", "🗝️ 모든 행운을 연다는 마법의 열쇠"
            ];
            mineCategory = "💸 적당한 만수르 광산 💸";
            itemName = items[Math.floor(Math.random() * items.length)];
            quantity = Math.floor(Math.random() * 10) + 1;
            winMultiplier = 10 + (quantity * 1.5);
            xpAmount = 200;
            color = "#E67E22";
        } else if (chance <= 11.5) {
            // Intermediate Mine (10.0%) - x2 to x5
            const items = [
                "⚙️ 정교하게 가공된 고순도 티타늄", "🧪 신소재 연구소의 그래핀 결정체", "🔋 미래형 에너지 코어 리튬 주괴", 
                "🛰️ 우주 정류장에서 떨어진 고성능 부품", "🗡️ 장인이 벼린 고탄소강 명검", "🔭 천문학자의 특수 렌즈 수정", 
                "🕯️ 심해에서 채취한 희귀 자석 조개", "🏺 고요한 숲속의 고결한 은 비늘", "🧩 고대 문명의 암호가 새겨진 점토판", 
                "🗝️ 잊혀진 저택의 골동품 열쇠", "🧪 연금술사의 실패작이지만 값비싼 액체", "🕯️ 빛을 머금은 희귀 형광석", 
                "🧊 만년설 속에서 얼어붙은 수정 꽃", "💨 바람의 정령이 머물던 투명한 돌", "🌿 대지의 마력이 깃든 에메랄드 원석"
            ];
            mineCategory = "⚒️ 수익성 좋은 중간 광산 ⚒️";
            itemName = items[Math.floor(Math.random() * items.length)];
            quantity = Math.floor(Math.random() * 10) + 1;
            winMultiplier = 2 + (quantity * 0.3);
            xpAmount = 50;
            color = "#3498DB";
        } else if (chance <= 31.5) {
            // Normal Mine (20.0%) - x0.5 to x1.5
            const items = [
                "🪵 단단하고 결이 고운 참나무 숯", "🧱 건축용으로 쓰이는 구운 벽돌", "⛓️ 튼튼하게 제련된 무쇠 톱니바퀴", 
                "🥣 장인이 빚은 수제 세라믹 타일", "🕯️ 동굴 입구에서 흔히 보이는 구리 원석", "🏺 낡았지만 쓸만한 청동 수저", 
                "🪨 정원에서 주워온 듯한 수석", "⛏️ 누군가 버리고 간 무쇠 곡괭이 날", "🥫 오래된 보급 창고의 통조림", 
                "🧼 반짝이는 거품이 나는 비누돌", "🧶 부드러운 감촉의 양모 뭉치", "🐚 해안가에서 주운 예쁜 조개껍데기", 
                "🍯 숲에서 채집한 야생 꿀단지", "🧂 히말라야의 핑크 솔트 덩어리", "🍠 땅속 깊이 박혀있던 대왕 고구마"
            ];
            mineCategory = "🧱 평범한 일반 광산 🧱";
            itemName = items[Math.floor(Math.random() * items.length)];
            quantity = Math.floor(Math.random() * 10) + 1;
            winMultiplier = 0.5 + (quantity * 0.1);
            xpAmount = 20;
            color = "#95A5A6";
        } else {
            // Fail (68.5%)
            const items = [
                "💩 거대한 곰이 남기고 간 따끈한 똥", "🪨 그냥 평범하고 무거운 돌덩이", "🥫 내용물이 썩어버린 통조림", 
                "💥 갑자기 터져버린 가스층", "🕸️ 끈적거리는 대왕 거미줄", "🕳️ 파도 파도 끝이 없는 빈 구멍", 
                "🐀 곡괭이를 갉아먹는 지하 쥐떼", "🌧️ 광산 천장에서 쏟아지는 찬물", "🧱 무너져 내려버린 갱도 벽", 
                "💀 전설의 광부가 남긴 오래된 뼈", "🌫️ 앞이 안 보이는 자욱한 독가스", "🦀 왜 여기 있는지 모를 화난 게", 
                "🍌 누군가 먹고 버린 바나나 껍질", "👟 잃어버린 지 오래된 낡은 장화", "🥫 뚜껑이 안 열리는 참치캔"
            ];
            mineCategory = "💀 채굴 실패! 💀";
            itemName = items[Math.floor(Math.random() * items.length)];
            winMultiplier = -1; // Lose all
            xpAmount = 5;
            color = "#C0392B";
        }

        const totalWin = winMultiplier === -1 ? -bettingMoney : Math.floor(bettingMoney * winMultiplier);
        const netGain = totalWin; // The amount to add to balance (could be negative)

        await dobak_Schema.updateOne({ userid: targetUserId }, { money: userData.money + netGain });

        if (interaction.guildId) {
            await addXP(interaction.guildId, targetUserId, xpAmount, interaction);
        }

        const resultEmbed = new EmbedBuilder()
            .setTitle(mineCategory)
            .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
            .setDescription(winMultiplier === -1 
                ? `💀 **꽝이다냥!** \`${itemName}\`만 나오고 주변이 무너졌다냥!\n\n베팅한 \`${bettingMoney.toLocaleString()}\`원을 잃었다냥.`
                : `🎊 **대박 수확이다냥!!** 🎊\n\n\`${itemName}\`을(를) 무려 **${quantity}개**나 발견했다냥!\n\n광산 종류와 수량에 따른 보너스가 적용되어 총 **${winMultiplier.toFixed(1)}배**의 수익을 올렸다냥!`)
            .addFields(
                { name: "💰 획득 금액", value: `\`${(netGain > 0 ? "+" : "") + netGain.toLocaleString()}\`원`, inline: true },
                { name: "💳 보유 잔액", value: `\`${(userData.money + netGain).toLocaleString()}\`원`, inline: true }
            )
            .setColor(color)
            .setTimestamp()
            .setFooter({ text: "나츠미 광업에 오신 것을 환영한다냥!" });

        await interaction.editReply({ embeds: [resultEmbed], components: [] });
    },
};
