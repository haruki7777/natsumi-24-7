import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import dobak_Schema from "../../models/dobak.js";
import { addXP } from "../../events/levels.js";

export default {
    data: new SlashCommandBuilder()
        .setName("붕어빵뽑기")
        .setDescription("뜨끈뜨끈한 붕어빵 기계에서 운을 시험해봐냥!")
        .addIntegerOption((f) =>
            f
                .setName("금액")
                .setDescription("베팅하실 금액을 입력해 주라냥")
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

        // Probabilities: 1% Golden, 20% Intermediate, 30% Normal, 49% Fail
        if (chance <= 1) {
            // Golden Carp Bun (1%)
            fishType = "✨ 전설의 오로라 황금 잉어빵";
            winAmount = bettingMoney * 50;
            xpAmount = 200;
            resultText = `🔥 **TOTAL JACKPOT!!!!** 🔥\n나츠미 사전에 이런 운은 처음이다냥!! 무려 \`${winAmount.toLocaleString()}\`원을 땄다냥! 이제 넌 부자다냥!`;
            color = "#FFD700";
        } else if (chance <= 21) {
            // Intermediate (20%)
            fishType = "🍯 꿀이 뚝뚝 흐르는 슈크림 대왕 붕어빵";
            winAmount = bettingMoney * 5;
            xpAmount = 40;
            resultText = `🎊 **대성공!!** 🎊\n달콤한 슈크림이 가득한 대왕 붕어빵을 뽑았다냥! \`${winAmount.toLocaleString()}\`원을 챙겼다냥! 부럽다냥...`;
            color = "#FFA500";
        } else if (chance <= 51) {
            // Normal (30%)
            fishType = "🐟 갓 구운 바삭바삭 팥 붕어빵";
            winAmount = Math.floor(bettingMoney * 1.5);
            xpAmount = 15;
            resultText = `✨ **성공!** ✨\n가장 기본적인 팥 붕어빵이지만 맛은 일품이다냥! \`${winAmount.toLocaleString()}\`원을 땄다냥!`;
            color = "#8B4513";
        } else {
            // Fail (49%)
            const fails = [
                "🔥 시꺼멓게 타버린 석탄 붕어빵",
                "💧 속이 텅 빈 밀가루 반죽 덩어리",
                "🕊️ 비둘기가 낚아채 간 빈 봉투",
                "💥 옆구리 터져서 내용물 다 샌 붕어빵",
                "🥶 얼어붙어서 이빨 나가는 아이스 붕어빵"
            ];
            fishType = fails[Math.floor(Math.random() * fails.length)];
            winAmount = -bettingMoney;
            xpAmount = 10;
            resultText = `💀 **꽝...** 💀\n이딴 걸 돈 주고 뽑았냐냥? ㅋㅋㅋㅋ \`${bettingMoney.toLocaleString()}\`원은 나츠미의 간식비로 쓰겠다냥!`;
            color = "#FF0000";
        }

        // Apply changes
        await dobak_Schema.updateOne(
            { userid: interaction.user.id },
            { money: userData.money + winAmount }
        );

        if (interaction.guildId) {
            await addXP(interaction.guildId, interaction.user.id, xpAmount, interaction);
        }

        const embed = new EmbedBuilder()
            .setTitle("🥞 나츠미의 붕어빵 기계")
            .setAuthor({
                name: interaction.user.tag,
                iconURL: interaction.user.displayAvatarURL({ dynamic: true })
            })
            .setDescription(`**결과: ${fishType}**\n\n${resultText}`)
            .addFields(
                { name: "베팅 금액", value: `\`${bettingMoney.toLocaleString()}\`원`, inline: true },
                { name: "최종 결과", value: `\`${(winAmount > 0 ? "+" : "") + winAmount.toLocaleString()}\`원`, inline: true },
                { name: "보유 잔액", value: `\`${(userData.money + winAmount).toLocaleString()}\`원`, inline: true }
            )
            .setColor(color)
            .setFooter({ text: "운칠기삼이라냥! 적당히 즐겨라냥~" })
            .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
    },
};
