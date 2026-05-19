import { SlashCommandBuilder, AttachmentBuilder, EmbedBuilder } from "discord.js";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import levelDB from "../../models/LevelSystem.js";
import dobakDB from "../../models/dobak.js";
import dailycheckDB from "../../models/dailycheck.js";
import featuresDB from "../../models/Features.js";
import DashboardSettings from "../../models/DashboardSettings.js";
import GameInventory from "../../models/GameInventory.js";
import GameTitle from "../../models/GameTitle.js";
import GameBadge from "../../models/GameBadge.js";
import { calculateXP } from "../../events/levels.js";
import { ensureKoreanFont } from "../../utils/fonts.js";

const withTimeout = (promise, ms, fallback = null) =>
  Promise.race([
    promise.catch(() => fallback),
    new Promise((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);

function roundedRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawTextFit(ctx, text, x, y, maxWidth) {
  let value = String(text || "");
  while (value.length > 2 && ctx.measureText(value).width > maxWidth) {
    value = `${value.slice(0, -2)}...`;
  }
  ctx.fillText(value, x, y);
}

export default {
  data: new SlashCommandBuilder()
    .setName("??겕")
    .setDescription("?쒕쾭 ?덈꺼, 寃쏀뿕移? 湲덉쟾, ?뱀긽??移?샇? 諛곗?瑜???겕移대뱶濡?蹂댁뿬以섏슂.")
    .addUserOption((option) =>
      option.setName("?좎?").setDescription("??겕移대뱶瑜??뺤씤???좎?").setRequired(false),
    ),

  /**
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    const target = interaction.options.getUser("?좎?") || interaction.user;
    const guildId = interaction.guildId;

    if (!guildId) {
      return interaction.reply({ content: "?쒕쾭 ?덉뿉?쒕쭔 ??겕移대뱶瑜?蹂????덉뼱.", ephemeral: true });
    }

    await interaction.deferReply();

    const [levelData, moneyData, attendanceData, setupData, dashboardSettings, gameInv, gameTitles, gameBadges] = await Promise.all([
      levelDB.findOne({ GuildID: guildId, UserID: target.id }).lean().catch(() => null),
      dobakDB.findOne({ userid: target.id }).lean().catch(() => null),
      dailycheckDB.findOne({ userid: target.id }).lean().catch(() => null),
      featuresDB.findOne({ GuildID: guildId }).lean().catch(() => null),
      DashboardSettings.findOne({ guildId }).lean().catch(() => null),
      GameInventory.findOne({ userId: target.id }).lean().catch(() => null),
      GameTitle.find().lean().catch(() => []),
      GameBadge.find().lean().catch(() => []),
    ]);

    const levelEnabled = dashboardSettings?.features?.level === true || setupData?.LevelSystem?.Enabled;
    if (!levelEnabled) {
      return interaction.editReply("이 서버는 아직 랭크 시스템이 켜져 있지 않아요. 관리자에게 `/나츠미서버설정`으로 대시보드에서 레벨 기능을 켜달라고 해줘.");
    }

    const level = Number(levelData?.level || 1);
    const xp = Number(levelData?.xp || 0);
    const needed = calculateXP(level);
    const progress = needed > 0 ? Math.min(1, xp / needed) : 0;
    const money = Number(moneyData?.money || 0);
    const attendance = Number(attendanceData?.count || 0);
    const ownedTitleKeys = new Set(gameInv?.titles || []);
    const ownedBadgeKeys = new Set(gameInv?.badges || []);
    const activeTitle = gameTitles.find((item) => item.key === gameInv?.activeTitle)
      || gameTitles.find((item) => ownedTitleKeys.has(item.key));
    const rankBadges = gameBadges.filter((item) => ownedBadgeKeys.has(item.key)).slice(0, 5);
    const titleText = activeTitle ? `${activeTitle.emoji || ""} ${activeTitle.name}`.trim() : "NATSUMI PLAYER";
    const badgeText = rankBadges.length
      ? rankBadges.map((item) => `${item.emoji || ""} ${item.name}`.trim()).join("  ")
      : "諛곗? ?놁쓬";

    try {
      await withTimeout(ensureKoreanFont(), 1200);

      const canvas = createCanvas(900, 300);
      const ctx = canvas.getContext("2d");

      const gradient = ctx.createLinearGradient(0, 0, 900, 300);
      gradient.addColorStop(0, "#23112f");
      gradient.addColorStop(0.45, "#42204d");
      gradient.addColorStop(1, "#ff8a4d");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 900, 300);

      ctx.globalAlpha = 0.22;
      for (let x = -40; x < 940; x += 32) {
        ctx.fillStyle = x % 64 === 0 ? "#ffd166" : "#ff7ab6";
        ctx.fillRect(x, 0, 12, 300);
      }
      ctx.globalAlpha = 1;

      ctx.fillStyle = "rgba(9, 6, 17, 0.78)";
      roundedRect(ctx, 24, 24, 852, 252, 22);
      ctx.fill();
      ctx.strokeStyle = "#ffcf5a";
      ctx.lineWidth = 5;
      ctx.stroke();

      const avatarUrl = target.displayAvatarURL({ extension: "png", size: 256 });
      const avatar = await withTimeout(loadImage(avatarUrl), 1800);
      ctx.save();
      roundedRect(ctx, 54, 70, 150, 150, 26);
      ctx.clip();
      if (avatar) {
        ctx.drawImage(avatar, 54, 70, 150, 150);
      } else {
        ctx.fillStyle = "#ff7ab6";
        ctx.fillRect(54, 70, 150, 150);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 54px NanumGothic";
        ctx.fillText("N", 105, 160);
      }
      ctx.restore();
      ctx.strokeStyle = "#ffe8a3";
      ctx.lineWidth = 5;
      roundedRect(ctx, 54, 70, 150, 150, 26);
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 34px NanumGothic";
      drawTextFit(ctx, target.globalName || target.username, 234, 78, 420);

      ctx.fillStyle = "#ffd1e7";
      ctx.font = "bold 20px NanumGothic";
      drawTextFit(ctx, titleText, 234, 112, 520);

      ctx.fillStyle = "#ffcf5a";
      ctx.font = "bold 30px NanumGothic";
      ctx.fillText(`Lv.${level}`, 720, 80);

      ctx.fillStyle = "#1a1024";
      roundedRect(ctx, 234, 135, 590, 34, 12);
      ctx.fill();
      ctx.fillStyle = "#ff8f3d";
      roundedRect(ctx, 234, 135, Math.max(18, 590 * progress), 34, 12);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 16px NanumGothic";
      ctx.textAlign = "center";
      ctx.fillText(`${xp.toLocaleString()} / ${needed.toLocaleString()} XP (${(progress * 100).toFixed(1)}%)`, 529, 158);
      ctx.textAlign = "left";

      ctx.font = "bold 18px NanumGothic";
      ctx.fillStyle = "#ffe8a3";
      ctx.fillText(`금전 ${money.toLocaleString()}`, 234, 205);
      ctx.fillStyle = "#b9fbc0";
      ctx.fillText(`출석 ${attendance.toLocaleString()}회`, 430, 205);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 16px NanumGothic";
      drawTextFit(ctx, badgeText, 234, 244, 570);

      const attachment = new AttachmentBuilder(await canvas.encode("png"), { name: `rank-${target.id}.png` });
      return interaction.editReply({ content: `${target.username}님의 랭크카드예요.`, files: [attachment] });
    } catch (error) {
      console.error("[RankCard] render failed:", error);
      const embed = new EmbedBuilder()
        .setColor("#ff7ab6")
        .setTitle(`${target.username} 랭크`)
        .setThumbnail(target.displayAvatarURL({ size: 256, dynamic: true }))
        .addFields(
          { name: "레벨", value: `Lv.${level}`, inline: true },
          { name: "경험치", value: `${xp.toLocaleString()} / ${needed.toLocaleString()} XP`, inline: true },
          { name: "금전", value: `${money.toLocaleString()} 금전`, inline: true },
          { name: "칭호", value: titleText, inline: false },
          { name: "배지", value: badgeText, inline: false },
        );
      return interaction.editReply({ content: "이미지 생성이 잠시 실패해서 텍스트 카드로 보여줄게.", embeds: [embed] });
    }
  },
};
