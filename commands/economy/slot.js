import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import dobak_Schema from "../../models/dobak.js";
import { addXP } from "../../events/levels.js";

const slot_emojis = ["🍒", "🍋", "🍇", "🔔", "💎", "7️⃣", "🍀", "🍎", "🍐", "🍊"];

export default {
    data: new SlashCommandBuilder()
        .setName("슬롯머신")
        .setDescription("슬롯머신을 돌린다냥! 행운을 빈다냥~")
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
        const dobak_find = await dobak_Schema.findOne({
            userid: interaction.user.id,
        });

        if (!dobak_find) {
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(`${interaction.user.username}님! 데이터가 존재하지 않다냥!\n\`/출석체크\`로 먼저 돈을 받아라냥!`)
                        .setColor("Red")
                ]
            });
        }

        if (dobak_find.money < bettingMoney) {
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(`${interaction.user.username}님! 보유중인 잔액이 부족하다냥! 현재 잔액: \`${dobak_find.money.toLocaleString()}\`원`)
                        .setColor("Red")
                ]
            });
        }

        // Slot logic
        const s1 = slot_emojis[Math.floor(Math.random() * slot_emojis.length)];
        const s2 = slot_emojis[Math.floor(Math.random() * slot_emojis.length)];
        const s3 = slot_emojis[Math.floor(Math.random() * slot_emojis.length)];

        let resultText = "";
        let color = "Grey";
        let winAmount = 0;
        let xpAmount = 0;

        if (s1 === s2 && s2 === s3) {
            // Jackpot!
            if (s1 === "7️⃣") {
                winAmount = bettingMoney * 20;
                xpAmount = 100;
                resultText = `🔥 **슈퍼 잭팟!!!** 🔥\n행운의 숫자 '7'이 세 개나 나왔다냥!! 베팅 금액의 20배인 \`${winAmount.toLocaleString()}\`원을 땄다냥! 대박이다냥!!!`;
                color = "Gold";
            } else {
                winAmount = bettingMoney * 10;
                xpAmount = 50;
                resultText = `🎊 **잭팟!!** 🎊\n세 개가 모두 똑같이 나왔다냥! 베팅 금액의 10배인 \`${winAmount.toLocaleString()}\`원을 땄다냥! 축하한다냥!`;
                color = "Gold";
            }
        } else if (s1 === s2 || s2 === s3 || s1 === s3) {
            // Pair
            winAmount = Math.floor(bettingMoney * 1.5);
            xpAmount = 25;
            resultText = `✨ **당첨!** ✨\n두 개가 똑같이 나왔다냥! 베팅 금액의 1.5배인 \`${winAmount.toLocaleString()}\`원을 땄다냥!`;
            color = "Green";
        } else {
            // Loss
            winAmount = -bettingMoney;
            xpAmount = 10;
            
            const lossMessages = [
                `💀 **꽝!** 💀\n아무것도 안 맞았다냥... 베팅한 \`${bettingMoney.toLocaleString()}\`원을 잃었다냥. ㅋㅋㅋㅋ 나츠미가 맛있게 쓸게냥!`,
                `👻 **운이 없다냥!** 👻\n어쩜 이렇게 하나도 안 맞을 수가 있냥? 돈은 고맙게 잘 받겠다냥!`,
                `💔 **안타깝다냥...** 💔\n한 개도 안 똑같다냥! \`${bettingMoney.toLocaleString()}\`원이 공중분해 됐다냥!`,
                `📉 **파산 조심하라냥!** 📉\n도박은 몸에 해롭다냥? \`${bettingMoney.toLocaleString()}\`원 내놔라냥!  흥!`
            ];
            resultText = lossMessages[Math.floor(Math.random() * lossMessages.length)];
            color = "Red";
        }

        await dobak_Schema.updateOne(
            { userid: interaction.user.id },
            { money: dobak_find.money + winAmount }
        );

        if (interaction.guildId) {
            await addXP(interaction.guildId, interaction.user.id, xpAmount, interaction);
        }

        const embed = new EmbedBuilder()
            .setTitle("🎰 나츠미의 슬롯머신!")
            .setAuthor({
                name: interaction.user.tag,
                iconURL: interaction.user.displayAvatarURL({ dynamic: true })
            })
            .setDescription(`**[ ${s1} | ${s2} | ${s3} ]**\n\n${resultText}`)
            .addFields({
                name: "결과 잔액",
                value: `\`${(dobak_find.money + winAmount).toLocaleString()}\`원`,
                inline: true
            })
            .setColor(color)
            .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
    },
};
