import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("웹상점")
    .setDescription("나츠미 게임 웹상점과 게임센터 바로가기를 보여줘요."),
  async execute(interaction) {
    const siteUrl = process.env.APP_URL || process.env.GAME_SITE_URL || process.env.NATSUMI_GAME_URL;
    const heartUrl = process.env.KOREANBOTS_BOT_PAGE_URL || process.env.HANDIRI_HEART_URL || process.env.HEART_URL || "https://c11.kr/natsumi";
    const donationUrl = process.env.DONATION_URL || process.env.KAKAO_PAY_URL || "https://qr.kakaopay.com/Fa7OA44AL";
    const heartEnabled = String(process.env.PREMIUM_HEART_ENABLED || "true") === "true";

    if (!siteUrl || siteUrl === "MY_APP_URL") {
      return interaction.reply({
        content: "아직 웹상점 주소가 설정되지 않았어! `.env`에 `APP_URL=https://너의-나츠미-게임사이트주소` 를 넣어줘. GitHub 저장소 주소 말고 실제로 열리는 사이트 주소야. 흥!",
        ephemeral: true,
      });
    }

    const cleanUrl = siteUrl.replace(/\/$/, "");
    const rankUrl = interaction.guildId ? `${cleanUrl}/rank-card/${interaction.guildId}/${interaction.user.id}` : cleanUrl;

    const embed = new EmbedBuilder()
      .setTitle("🦊 NATSUMI Arcade & Web Shop")
      .setDescription(
        `${heartEnabled ? "웹게임은 한디리 하트를 눌러야 참여할 수 있어!\n" : ""}` +
        "칭호, 프로필 뱃지, 슬롯머신, 붕어빵뽑기, 광산, 낚시까지 웹에서 즐길 수 있다구.\n" +
        "후원하면 후원자 전용 프로필/뱃지도 준비할 수 있어. 딱히 고마워서 그런 건 아니지만!"
      )
      .setColor("#FF8A2A")
      .setFooter({ text: heartEnabled ? "먼저 하트를 누르고 나츠미 게임센터로 와!" : "나츠미 게임센터로 이동해봐!" });

    const buttons = [];
    if (heartEnabled) {
      buttons.push(new ButtonBuilder().setLabel("한디리 하트 누르기").setStyle(ButtonStyle.Link).setURL(heartUrl));
    }
    buttons.push(
      new ButtonBuilder().setLabel("웹상점 열기").setStyle(ButtonStyle.Link).setURL(cleanUrl),
      new ButtonBuilder().setLabel("내 랭크카드").setStyle(ButtonStyle.Link).setURL(rankUrl),
      new ButtonBuilder().setLabel("후원하기").setStyle(ButtonStyle.Link).setURL(donationUrl)
    );

    const row = new ActionRowBuilder().addComponents(...buttons);
    await interaction.reply({ embeds: [embed], components: [row] });
  },
};
