import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import dobak_Schema from "../../models/dobak.js";

export default {
  data: new SlashCommandBuilder()
    .setName("광산")
    .setDescription("전설의 광산에서 대박을 노리고 곡괭이를 휘둘러보자냥!")
    .addIntegerOption((f) =>
      f
        .setName("금액")
        .setDescription("채굴 장비 대여료(베팅금)를 입력해 주라냥")
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
            content: "💰 **데이터가 없다냥!** `/출석체크`로 자본금을 먼저 마련해라냥!",
            ephemeral: true
        });
    }

    if (userData.money < bettingMoney) {
        return interaction.reply({
            content: `❌ **잔액 부족이다냥!** 현재 잔액: \`${userData.money.toLocaleString()}\`원`,
            ephemeral: true
        });
    }

    const embed = new EmbedBuilder()
        .setTitle("⛏️ 나츠미의 비밀 광산 입구")
        .setDescription(`**${interaction.user.username}**님, 채굴 준비 완료다냥!\n\n현재 대여한 장비 등급: \`${bettingMoney.toLocaleString()}원\` 상당\n\n아래 버튼을 눌러서 깊숙이 파들어가 봐라냥! 무엇이 나올지 기대된다냥~`)
        .setColor("#34495E")
        .setThumbnail("https://cdn-icons-png.flaticon.com/512/3062/3062412.png")
        .setFooter({ text: "버튼을 누르면 바로 채굴이 시작된다냥!" });

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`MiningDig_${interaction.user.id}_${bettingMoney}`)
            .setLabel("곡괭이 휘두르기!")
            .setEmoji("⛏️")
            .setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  },
};
