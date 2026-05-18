import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

const DEFAULT_GAME_URL = "http://natsumi-game.kro.kr:25772";
const DEFAULT_HEART_URL = "https://c11.kr/natsumi";
const DEFAULT_DONATION_URL = "https://qr.kakaopay.com/Fa7OA44AL";

export default {
  data: new SlashCommandBuilder()
    .setName("웹상점")
    .setDescription("나츠미 게임 웹상점과 게임센터 바로가기를 보여줘요."),
  async execute(interaction) {
    const siteUrl = process.env.APP_URL || process.env.GAME_SITE_URL || process.env.NATSUMI_GAME_URL || DEFAULT_GAME_URL;
    const heartUrl = process.env.KOREANBOTS_BOT_PAGE_URL || process.env.HANDIRI_HEART_URL || process.env.HEART_URL || DEFAULT_HEART_URL;
    const donationUrl = process.env.DONATION_URL || process.env.KAKAO_PAY_URL || DEFAULT_DONATION_URL;
    const heartEnabled = String(process.env.PREMIUM_HEART_ENABLED || "true") === "true";

    const cleanUrl = siteUrl.replace(/\/$/, "");
    const rankUrl = interaction.guildId ? `${cleanUrl}/rank-card/${interaction.guildId}/${interaction.user.id}` : cleanUrl;

    const embed = new EmbedBuilder()
      .setTitle("NATSUMI Arcade & Web Shop")
      .setDescription(
        `${heartEnabled ? "먼저 하트를 눌러 참여하면 나츠미 기능을 더 편하게 쓸 수 있어요.\n" : ""}` +
        "칭호, 배지, 랭크카드, 미니게임, 후원 신청을 웹에서 확인할 수 있어요."
      )
      .setColor("#FF8A2A")
      .setFooter({ text: heartEnabled ? "하트를 누른 뒤 나츠미 게임센터로 이동해줘." : "나츠미 게임센터로 이동해요." });

    const buttons = [];
    if (heartEnabled) {
      buttons.push(new ButtonBuilder().setLabel("하트 누르기").setStyle(ButtonStyle.Link).setURL(heartUrl));
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
