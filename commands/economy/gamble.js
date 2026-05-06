import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import dobak_Schema from "../../models/dobak.js";

export default {
  data: new SlashCommandBuilder()
    .setName("광산")
    .setDescription("전설의 광산에서 대박을 노려봐! 콘콘! (별로 널 부자로 만들어주려는 건 아냐!)")
    .addIntegerOption((f) =>
      f
        .setName("금액")
        .setDescription("판돈을 걸어봐! (최소 100금전)")
        .setMinValue(100)
        .setRequired(true)
    ),
  /**
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    const bettingMoney = interaction.options.getInteger("금액");
    const userData = await dobak_Schema.findOne({ userid: interaction.user.id });

    if (!userData) {
        return interaction.reply({
            content: "💰 **누구세요?** 가입도 안 하고 돈을 벌겠다는 거야? `/출석체크`부터 하고 오라구!",
            ephemeral: true
        });
    }

    if (userData.money < bettingMoney) {
        return interaction.reply({
            content: `❌ **거지네?** 잔액이 부족하잖아! \`${userData.money.toLocaleString()}\`금전밖에 없으면서 욕심은 많아가지구...`,
            ephemeral: true
        });
    }

    const embed = new EmbedBuilder()
        .setTitle("⛏️ 나츠미의 비밀 광산 입구")
        .setDescription(`**${interaction.user.username}**, 채굴 준비는 됐어?\n\n건 판돈: \`${bettingMoney.toLocaleString()} 금전\`\n\n아래 버튼을 눌러서 깊숙이 파들어가 봐! \n뭐가 나올지는 나도 몰라! **착각하지 마, 널 위해 판 건 아니니까!** ♥(⸝⸝⸝ᵒ̴̶̷̥́ ᵕ ก̀⸝⸝⸝)ෆ`)
        .setColor("#FF7F50")
        .setThumbnail("https://cdn-icons-png.flaticon.com/512/3062/3062412.png")
        .setFooter({ text: "여우의 마법이 깃든 장비야, 소중히 다루라구!" });

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`MiningDig_${interaction.user.id}_${bettingMoney}`)
            .setLabel("곡괭이질 시작!")
            .setEmoji("🦊")
            .setStyle(ButtonStyle.Danger)
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  },
};
