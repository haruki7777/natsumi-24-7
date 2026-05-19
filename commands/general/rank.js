import { SlashCommandBuilder, AttachmentBuilder, EmbedBuilder } from "discord.js";
import levelDB from "../../models/LevelSystem.js";
import dobakDB from "../../models/dobak.js";
import dailycheckDB from "../../models/dailycheck.js";
import featuresDB from "../../models/Features.js";
import GameInventory from "../../models/GameInventory.js";
import GameTitle from "../../models/GameTitle.js";
import GameBadge from "../../models/GameBadge.js";
import { calculateXP } from "../../events/levels.js";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { ensureKoreanFont } from "../../utils/fonts.js";

// Memory cache for background images to reduce network load
const imageCache = new Map();
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes

async function getCachedImage(url) {
    if (imageCache.has(url)) {
        const cached = imageCache.get(url);
        if (Date.now() - cached.timestamp < CACHE_TTL) {
            return cached.image;
        }
    }
    try {
        // Load with 3 second timeout
        const imgPromise = loadImage(url);
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Image Load Timeout")), 3000)
        );
        const img = await Promise.race([imgPromise, timeoutPromise]);
        
        imageCache.set(url, { image: img, timestamp: Date.now() });
        return img;
    } catch (e) {
        console.warn(`[Canvas] Failed to load ${url}: ${e.message}`);
        return null;
    }
}

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
    const target = interaction.options.getUser("유저") || interaction.user;
    const guildId = interaction.guildId;

    if (!guildId) {
      return interaction.reply({ content: "이봐! 서버에서만 내 눈을 피하려고? 소용없어!", ephemeral: true });
    }

    await interaction.deferReply();

    // Fetch all data in parallel
    const [levelData, moneyData, attendanceData, setupData, gameInv, gameTitles, gameBadges] = await Promise.all([
      levelDB.findOne({ GuildID: guildId, UserID: target.id }).lean(),
      dobakDB.findOne({ userid: target.id }).lean(),
      dailycheckDB.findOne({ userid: target.id }).lean(),
      featuresDB.findOne({ GuildID: guildId }).lean(),
      GameInventory.findOne({ userId: target.id }).lean().catch(() => null),
      GameTitle.find().lean().catch(() => []),
      GameBadge.find().lean().catch(() => []),
    ]);

    if (!setupData || !setupData.LevelSystem?.Enabled) {
      return interaction.editReply("흥! 이 서버는 아직 내 랭크 시스템을 받아들일 준비가 안 됐나 보네. \n관리자보고 `/레벨설정 상태: 온`이라고 시켜봐! ♥(⸝⸝⸝ᵒ̴̶̷̥́ ᵕ ก̀⸝⸝⸝)ෆ");
    }

    const level = levelData?.level || 1;
    const xp = levelData?.xp || 0;
    const money = moneyData?.money || 0;
    const count = attendanceData?.count || 0;
    const needed = calculateXP(level);
    const ownedTitleKeys = new Set(gameInv?.titles || []);
    const ownedBadgeKeys = new Set(gameInv?.badges || []);
    const activeTitle = gameTitles.find((item) => item.key === gameInv?.activeTitle)
      || gameTitles.find((item) => ownedTitleKeys.has(item.key));
    const rankBadges = gameBadges.filter((item) => ownedBadgeKeys.has(item.key)).slice(0, 5);
    const activeTitleText = activeTitle ? `${activeTitle.emoji || ""} ${activeTitle.name}`.trim() : "NATSUMI PLAYER";
    const badgeText = rankBadges.length
      ? rankBadges.map((item) => `${item.emoji || ""} ${item.name}`.trim()).join("  ")
      : "배지 없음";
    
    // Background Selection
    const defaultBG = "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=1000&auto=format&fit=crop";
    let backgroundUrl = setupData?.LevelSystem?.Background;
    
    // Validate background URL - omit if clearly placeholder or invalid
    if (!backgroundUrl || backgroundUrl === "default" || backgroundUrl.length < 10) {
        backgroundUrl = defaultBG;
    }
    
    // Safety check for known broken Discord link template
    if (backgroundUrl.includes("cdn.discordapp.com/attachments/965674056080826368/1003622130921001040/background.png")) {
        backgroundUrl = defaultBG;
    }
    
    // Ensure fonts are ready (Async check)
    await ensureKoreanFont();

    // Canvas Generation
    const canvas = createCanvas(900, 300);
    const ctx = canvas.getContext("2d");

    // Drawing Logic
    try {
        // Helper to draw rounded rectangle using standard paths
        const drawRoundedRect = (ctx, x, y, width, height, radius) => {
            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + width - radius, y);
            ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
            ctx.lineTo(x + width, y + height - radius);
            ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
            ctx.lineTo(x + radius, y + height);
            ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.closePath();
        };

        // 1. Draw Background
        let bgImg = null;
        if (backgroundUrl !== defaultBG) {
            bgImg = await getCachedImage(backgroundUrl);
        }
        if (!bgImg) {
            bgImg = await getCachedImage(defaultBG);
        }

        if (bgImg) {
            // Center crop/fill background
            const scale = Math.max(canvas.width / bgImg.width, canvas.height / bgImg.height);
            const x = (canvas.width - bgImg.width * scale) / 2;
            const y = (canvas.height - bgImg.height * scale) / 2;
            ctx.drawImage(bgImg, x, y, bgImg.width * scale, bgImg.height * scale);
        } else {
            ctx.fillStyle = "#2c2f33";
            ctx.fillRect(0, 0, 900, 300);
        }

        // 2. Semi-transparent overlay
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        drawRoundedRect(ctx, 20, 20, 860, 260, 15);
        ctx.fill();

        // 3. Draw Avatar
        const avatarUrl = target.displayAvatarURL({ extension: "png", size: 256 }) || target.defaultAvatarURL;
        const avatar = await loadImage(avatarUrl).catch(() => null);
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(110, 150, 70, 0, Math.PI * 2);
        ctx.clip();
        if (avatar) {
            ctx.drawImage(avatar, 40, 80, 140, 140);
        } else {
            ctx.fillStyle = "#FF7F50";
            ctx.fill();
        }
        ctx.restore();

        // 4. Draw Texts
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 34px NanumGothic";
        ctx.fillText(target.username, 210, 85);

        ctx.fillStyle = "#FF7F50";
        ctx.font = "bold 22px NanumGothic";
        ctx.fillText(`📊 위계: ${level}`, 210, 125);
        ctx.fillStyle = "#FFD1E7";
        ctx.font = "bold 18px NanumGothic";
        ctx.fillText(activeTitleText, 350, 124);

        // Progress Bar
        const progress = Math.min(1, xp / needed);
        const barWidth = 630;
        const barHeight = 35;
        const barX = 210;
        const barY = 145;

        // Trace
        ctx.fillStyle = "#333333";
        drawRoundedRect(ctx, barX, barY, barWidth, barHeight, 5);
        ctx.fill();

        // Fill
        if (progress > 0) {
            ctx.fillStyle = "#FF8C00";
            drawRoundedRect(ctx, barX, barY, Math.max(10, barWidth * progress), barHeight, 5);
            ctx.fill();
        }

        // XP Text
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "16px NanumGothic";
        ctx.textAlign = "center";
        ctx.fillText(`${xp.toLocaleString()} / ${needed.toLocaleString()} 영력 (${(progress * 100).toFixed(1)}%)`, barX + barWidth/2, barY + 23);
        ctx.textAlign = "left";

        // 5. Money & Attendance
        ctx.font = "bold 20px NanumGothic";
        ctx.fillStyle = "#FFD700";
        ctx.fillText(`💰 주머니: ${money.toLocaleString()} 금전`, 210, 215);

        ctx.fillStyle = "#00FF7F";
        ctx.fillText(`📅 성실도: ${count}회 출석`, 210, 255);
        ctx.fillStyle = "#FFE8A3";
        ctx.font = "bold 16px NanumGothic";
        ctx.fillText(badgeText, 430, 255);

        const attachment = new AttachmentBuilder(await canvas.encode("png"), { name: `rank-${target.id}.png` });
        await interaction.editReply({ 
            content: `콘콘! ${target.username}의 서열 기록을 확인했어! 별로 관심 있는 건 아니지만 말이야! ♥(⸝⸝⸝ᵒ̴̶̷̥́ ᵕ ก̀⸝⸝⸝)ෆ`,
            files: [attachment] 
        });

    } catch (error) {
        console.error("[Rank Optimization Error]", error);
        
        const progressRaw = needed > 0 ? xp / needed : 0;
        const progressPercent = (Math.min(1, progressRaw) * 100).toFixed(1);

        const fallbackEmbed = new EmbedBuilder()
            .setTitle("🏮 서열 정보 (이미지 로드 실패)")
            .setDescription(`**${target.username}** 녀석의 기록을 이미지로 그리려다 실패했어! 대신 정보만 알려줄게!\n\n` + 
                `**위계:** Lv.${level}\n` +
                `**영력:** ${xp.toLocaleString()} / ${needed.toLocaleString()} (${progressPercent}%)\n` +
                `**금전:** ${money.toLocaleString()} 금전\n` +
                `**출석:** ${count}회`)
            .setThumbnail(target.displayAvatarURL())
            .setColor("#FF7F50")
            .setFooter({ text: "흥! 붓이 미끄러진 거니까 착각하지 마!" });

        await interaction.editReply({ 
            content: "으익! 붓이 미끄러졌어! (이미지 생성 오류) 대신 정보만 알려줄게! 콘콘!",
            embeds: [fallbackEmbed],
            files: []
        });
    }
  },
};
