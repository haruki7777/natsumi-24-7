import { SlashCommandBuilder, AttachmentBuilder } from "discord.js";
import levelDB from "../../models/LevelSystem.js";
import dobakDB from "../../models/dobak.js";
import dailycheckDB from "../../models/dailycheck.js";
import featuresDB from "../../models/Features.js";
import { calculateXP } from "../../events/levels.js";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { ensureKoreanFont } from "../../utils/fonts.js";

export default {
  data: new SlashCommandBuilder()
    .setName("랭크")
    .setDescription("여우의 눈으로 너의 위업과 주머니 사정을 감시하겠어! 콘콘!")
    .addUserOption((option) =>
      option.setName("유저").setDescription("정보를 엿볼 대상을 골라봐!")
    ),
  /**
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    await interaction.deferReply();
    const target = interaction.options.getUser("유저") || interaction.user;
    const guildId = interaction.guildId;

    if (!guildId) {
      return interaction.editReply("이봐! 개인 메시지에서 내 눈을 피하려고? 소용없어! (서버에서만 가능해)");
    }

    // Fetch all data in parallel
    const [levelData, moneyData, attendanceData, setupData] = await Promise.all([
      levelDB.findOne({ GuildID: guildId, UserID: target.id }).lean(),
      dobakDB.findOne({ userid: target.id }).lean(),
      dailycheckDB.findOne({ userid: target.id }).lean(),
      featuresDB.findOne({ GuildID: guildId }).lean(),
    ]);

    if (!setupData || !setupData.LevelSystem?.Enabled) {
      return interaction.editReply("흥! 이 서버는 아직 내 랭크 시스템을 받아들일 준비가 안 됐나 보네. \n관리자보고 `/레벨설정 상태: 온`이라고 시켜봐! ♥(⸝⸝⸝ᵒ̴̶̷̥́ ᵕ ก̀⸝⸝⸝)ෆ");
    }

    const level = levelData?.level || 1;
    const xp = levelData?.xp || 0;
    const money = moneyData?.money || 0;
    const count = attendanceData?.count || 0;
    const needed = calculateXP(level);
    
    // Background Image
    let backgroundUrl = setupData?.LevelSystem?.Background || "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=1000&auto=format&fit=crop";
    
    // Safety check for known broken Discord link
    if (backgroundUrl.includes("cdn.discordapp.com/attachments/965674056080826368/1003622130921001040/background.png")) {
        backgroundUrl = "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=1000&auto=format&fit=crop";
    }

    // Ensure fonts are ready
    await ensureKoreanFont();

    // Canvas Generation
    const canvas = createCanvas(900, 300);
    const ctx = canvas.getContext("2d");

    // Helper to draw background
    const drawBackground = async () => {
        try {
            const bg = await loadImage(backgroundUrl);
            ctx.drawImage(bg, 0, 0, 900, 300);
        } catch (error) {
            console.warn(`[Canvas] Background load failed (${backgroundUrl}): drawing fallback color`);
            ctx.fillStyle = "#2c2f33"; // Discord dark grey
            ctx.fillRect(0, 0, 900, 300);
        }
    };

    // Helper to draw avatar
    const drawAvatar = async () => {
        try {
            const avatarUrl = target.displayAvatarURL({ extension: "png", size: 256 });
            const avatar = await loadImage(avatarUrl);
            ctx.save();
            ctx.beginPath();
            ctx.arc(100, 150, 70, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(avatar, 30, 80, 140, 140);
            ctx.restore();
        } catch (error) {
            console.warn(`[Canvas] Avatar load failed for ${target.tag}: drawing fallback circle`);
            ctx.fillStyle = "#FFB6C1";
            ctx.beginPath();
            ctx.arc(100, 150, 70, 0, Math.PI * 2, true);
            ctx.fill();
        }
    };

    try {
        await drawBackground();

        // Semi-transparent overlay
        ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
        ctx.fillRect(20, 20, 860, 260);

        await drawAvatar();

        // Draw Username
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 36px NanumGothic";
        ctx.fillText(target.username, 200, 80);

        // Draw Level
        ctx.fillStyle = "#FF7F50"; // Coral (Fox Theme)
        ctx.font = "bold 24px NanumGothic";
        ctx.fillText(`📊 위계: ${level}`, 200, 120);

        // Draw XP Progress Bar
        const progress = Math.min(1, xp / needed);
        const barWidth = 600;
        const barHeight = 30;
        const barX = 200;
        const barY = 140;

        // Bar background
        ctx.fillStyle = "#444444";
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // Bar fill
        ctx.fillStyle = "#FF8C00"; // Dark Orange
        ctx.fillRect(barX, barY, barWidth * progress, barHeight);

        // Bar text
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "18px NanumGothic";
        ctx.textAlign = "center";
        ctx.fillText(`${xp.toLocaleString()} / ${needed.toLocaleString()} 영력 (${Math.floor(progress * 100)}%)`, barX + barWidth / 2, barY + 22);
        ctx.textAlign = "left";

        // Draw Money and Attendance
        ctx.fillStyle = "#FFD700"; // Gold
        ctx.font = "bold 22px NanumGothic";
        ctx.fillText(`💰 주머니: ${money.toLocaleString()} 금전`, 200, 210);

        ctx.fillStyle = "#00FF7F"; // Spring Green
        ctx.font = "bold 22px NanumGothic";
        ctx.fillText(`📅 성실도: ${count}회 출석`, 200, 250);

        const attachment = new AttachmentBuilder(await canvas.encode("png"), { name: `rank-${target.id}.png` });
        await interaction.editReply({ 
            content: `콘콘! ${target.username}의 정보를 가져왔어. 별로 네가 알고 싶어서 찾아본 건 아니니까! ♥(⸝⸝⸝ᵒ̴̶̷̥́ ᵕ ก̀⸝⸝⸝)ෆ`,
            files: [attachment] 
        });

    } catch (error) {
        console.error("Canvas Error:", error);
        await interaction.editReply("으익! 랭크 카드를 그리다가 붓이 부러졌어! (오류 발생) 대신 정보만 알려줄게! 흥!");
        // Fallback to text embed if canvas fails
        // (Existing logic could go here)
    }
  },
};
