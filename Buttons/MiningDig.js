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
            return interaction.reply({ content: "**네 광산이나 신경 써!** 남의 대박을 훔쳐보려 하다니, 정말 파렴치하네! 콘콘!", ephemeral: true });
        }

        await interaction.deferUpdate();

        const userData = await dobak_Schema.findOne({ userid: targetUserId });
        if (!userData || userData.money < bettingMoney) {
            return interaction.editReply({ content: "**돈도 없으면서 장비를 빌리려고?** 뻔뻔함도 정도가 있지! 흥!", embeds: [], components: [] });
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
                "🦊 나츠미가 몰래 숨겨둔 비상금 주머니", "👑 여우 령의 가호가 깃든 황금 꼬리 장식", "💫 은하수에서 떨어진 별의 파편", 
                "🌈 무지개 끝에서 훔쳐온 무지개 진주", "💎 나츠미의 눈동자를 닮은 전설의 다이아몬드", "🪐 우주의 의지가 담긴 고대 금속", 
                "🎭 신들이 연회에서 쓰던 순금 술잔", "🔱 해저 문명의 오리할콘 주괴", "⚡ 제우스의 벼락이 응축된 전격 황금", 
                "🐉 잠든 용이 지키던 에인션트 골드", "🌌 차원의 틈새에서 흘러나온 에테르 금", "💖 영원한 사랑을 약속하는 아프로디테의 금장식", 
                "🧊 절대 영도에서도 빛나는 절대 금", "🪞 진실만을 비추는 헤르메스의 황금 거울", "🩸 불사조의 피로 담금질된 불멸의 금"
            ];
            mineCategory = "✨ 전설의 여우신 광산 ✨";
            itemName = items[Math.floor(Math.random() * items.length)];
            quantity = Math.floor(Math.random() * 10) + 1;
            winMultiplier = 30 + (quantity * 2);
            xpAmount = 500;
            color = "#F1C40F";
        } else if (chance <= 1.5) {
            // Mansour Mine (1.0%) - x10 to x25
            const items = [
                "🏮 나츠미의 신사에서 발견된 보물 상자", "💰 도박의 신이 잃어버린 행운의 금전", "🎿 눈 덮인 산의 정기가 서린 수정", 
                "🐎 천마의 발굽에서 떨어진 황금 편자", "🚢 전설의 보물선에서 건져 올린 장식품", "⌚ 시간을 멈추는 환상의 시계", 
                "🏺 신화 속 영웅이 쓰던 투구", "🏰 잊혀진 성의 비밀 열쇠", "🍷 요정들이 빚은 향기로운 이슬", 
                "♟️ 장인이 깎은 상아와 루비 체스 세트", "🎻 전설적인 스트라디바리우스 바이올린", "🖼️ 경매가 측정 불가의 거장 회화", 
                "🏹 오스만 제국 술탄의 황금 활", "📯 길드 창립자의 전설적인 나팔", "🗝️ 모든 행운을 연다는 마법의 열쇠"
            ];
            mineCategory = "💸 나츠미의 비밀 금고 💸";
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
            mineCategory = "⚒️ 쏠쏠한 성적표 광산 ⚒️";
            itemName = items[Math.floor(Math.random() * items.length)];
            quantity = Math.floor(Math.random() * 10) + 1;
            winMultiplier = 2 + (quantity * 0.3);
            xpAmount = 50;
            color = "#3498DB";
        } else if (chance <= 31.5) {
            // Normal Mine (20.0%) - x0.5 to x1.5
            const items = [
                "🪵 나츠미의 꼬리털(?)이 섞인 숯", "🧱 평범하지만 튼튼한 벽돌", "⛓️ 녹슨 쇠 톱니바퀴", 
                "🥣 길가에 떨어진 세라믹 조각", "🕯️ 반짝이는 구리 원석", "🏺 낡은 청동 수저", 
                "🪨 그냥 좀 예쁘게 생긴 돌", "⛏️ 부러진 곡괭이 자루", "🥫 유통기한 임박 통조림", 
                "🧼 향기나는 비누돌", "🧶 몽글몽글한 양모 뭉치", "🐚 해안가 조개껍데기", 
                "🍯 산벌이 모아둔 꿀", "🧂 짭짤한 소금 덩어리", "🍠 땅속 깊이 박혀있던 대왕 고구마"
            ];
            mineCategory = "🧱 평범한 학교 뒤뜰 🧱";
            itemName = items[Math.floor(Math.random() * items.length)];
            quantity = Math.floor(Math.random() * 10) + 1;
            winMultiplier = 0.5 + (quantity * 0.1);
            xpAmount = 20;
            color = "#95A5A6";
        } else {
            // Fail (68.5%)
            const items = [
                "💩 나츠미가 밟을 뻔했던 똥", "🪨 던지기 딱 좋은 돌멩이", "🥫 냄새나는 빈 통조림", 
                "💥 갑자기 터진 가스층", "🕸️ 끈적한 거미줄", "🕳️ 깊게 파인 허탕 구덩이", 
                "🐀 떼거지로 몰려온 지하 쥐떼", "🌧️ 천장에서 쏟아지는 찬물", "🧱 무너진 흙더미", 
                "💀 이름 모를 광부의 해골", "🌫️ 앞이 안 보이는 독가스", "🦀 집게발을 든 화난 게", 
                "🍌 미끄러운 바나나 껍질", "👟 짝 잃은 낡은 신발", "🥫 뚜껑이 안 열리는 참치캔"
            ];
            mineCategory = "💀 채굴 폭망! 💀";
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
            .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
            .setDescription(winMultiplier === -1 
                ? `💀 **바보! 꽝이야!** \`${itemName}\`만 나오고 주변이 다 무너졌잖아!\n\n건 판돈 \`${bettingMoney.toLocaleString()}\`금전은 내가 맛있게 먹을게! ♥(⸝⸝⸝ᵒ̴̶̷̥́ ᵕ ก̀⸝⸝⸝)ෆ`
                : `🎊 **대... 대박이네?** 🎊\n\n\`${itemName}\`을(를) 무려 **${quantity}개**나 찾아냈어!\n\n**별로 네가 잘해서 나온 건 아니니까 우쭐대지 마!** \n총 **${winMultiplier.toFixed(1)}배** 수익이야. 관리 잘 하라구!`)
            .addFields(
                { name: "💰 주머니 변화", value: `\`${(netGain > 0 ? "+" : "") + netGain.toLocaleString()}\` 금전`, inline: true },
                { name: "💳 총 주머니", value: `\`${(userData.money + netGain).toLocaleString()}\` 금전`, inline: true }
            )
            .setColor(color)
            .setTimestamp()
            .setFooter({ text: "나츠미의 비밀 관찰 일기: 너 좀 대단할지도?" });

        await interaction.editReply({ embeds: [resultEmbed], components: [] });
    },
};
