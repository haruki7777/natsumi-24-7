import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import dobak_Schema from "../../models/dobak.js";
import { addXP } from "../../events/levels.js";

const slot_emojis = ["🍒", "🍋", "🍇", "🔔", "💎", "7️⃣", "🍀", "🍎", "🍐", "🍊"];

export default {
    data: new SlashCommandBuilder()
        .setName("슬롯머신")
        .setDescription("눈 돌아가는 슬롯머신 한 판 어때? (흥, 탕진해도 모른다구!)")
        .addIntegerOption((f) =>
            f
                .setName("금액")
                .setDescription("베팅할 금액을 넣어봐! (최소 100금전)")
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
                        .setDescription(`${interaction.user.username}! 너는 우리 숲에 아직 이름도 안 적었어!\n\`/출석체크\`로 먼저 등록부터 하라구!`)
                        .setColor("#ED4245")
                ]
            });
        }
  
        if (dobak_find.money < bettingMoney) {
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(`${interaction.user.username}! 주머니가 가볍네? 바보야! 현재 잔액: \`${dobak_find.money.toLocaleString()}\` 금전`)
                        .setColor("#ED4245")
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
                resultText = `🔥 **슈퍼 잭팟!!! 콘콘!!!** 🔥\n행운의 숫자 '7'이 세 개나 나왔어!! 베팅금의 20배인 \`${winAmount.toLocaleString()}\`금전을 땄어! 대박이다구!!!`;
                color = "Gold";
            } else {
                winAmount = bettingMoney * 10;
                xpAmount = 50;
                resultText = `🎊 **잭팟!! 콘콘!** 🎊\n세 개가 모두 똑같이 나왔네! 베팅금의 10배인 \`${winAmount.toLocaleString()}\`금전을 챙겼어. 축하... 한다구!`;
                color = "Gold";
            }
        } else if (s1 === s2 || s2 === s3 || s1 === s3) {
            // Pair
            winAmount = Math.floor(bettingMoney * 1.5);
            xpAmount = 25;
            resultText = `✨ **오, 당첨이야!** ✨\n두 개가 똑같이 나왔네? 베팅금의 1.5배인 \`${winAmount.toLocaleString()}\`금전을 벌었어!`;
            color = "#2ECC71";
        } else {
            // Loss
            winAmount = -bettingMoney;
            xpAmount = 10;
            
            const lossMessages = [
                `💀 **꽝이야! 바보!** 💀\n아무것도 안 맞았잖아... 베팅한 \`${bettingMoney.toLocaleString()}\`금전은 내가 맛있게 쓸게! ㅋㅋㅋㅋ`,
                `👻 **운이 없네? 콘콘!** 👻\n어쩜 이렇게 하나도 안 맞을 수가 있어? 너 설마 저주받은 거야?`,
                `💔 **안타깝네... (거짓말)** 💔\n하나도 안 똑같은걸? \`${bettingMoney.toLocaleString()}\`금전이 공중분해 됐어! 흥!`,
                `📉 **파산 조심하라구!** 📉\n도박은 몸에 해롭다고 몇 번을 말해? \`${bettingMoney.toLocaleString()}\`금전 내놔! 흥!`
            ];
            resultText = lossMessages[Math.floor(Math.random() * lossMessages.length)];
            color = "#ED4245";
        }

        await dobak_Schema.updateOne(
            { userid: interaction.user.id },
            { money: dobak_find.money + winAmount }
        );

        if (interaction.guildId) {
            await addXP(interaction.guildId, interaction.user.id, xpAmount, interaction);
        }

        const embed = new EmbedBuilder()
            .setTitle("🎰 나츠미의 호화로운 슬롯머신!")
            .setAuthor({
                name: interaction.user.username,
                iconURL: interaction.user.displayAvatarURL({ dynamic: true })
            })
            .setDescription(`**[ ${s1} | ${s2} | ${s3} ]**\n\n${resultText}`)
            .addFields({
                name: "💳 남은 주머니",
                value: `\`${(dobak_find.money + winAmount).toLocaleString()}\` 금전`,
                inline: true
            })
            .setColor(color)
            .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
    },
};
