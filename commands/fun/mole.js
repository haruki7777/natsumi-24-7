// commands/fun/mole.js
import { 
  SlashCommandBuilder, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ComponentType 
} from "discord.js";
import dobak_Schema from "../../models/dobak.js";

export default {
  data: new SlashCommandBuilder()
    .setName("두더지")
    .setDescription("점점 빨라지는 두더지를 잡고 금전을 획득하세요!"),

  async execute(interaction) {
    const userId = interaction.user.id;
    
    // Difficulty Settings
    const difficulties = {
      safety: { label: "🛡️ 억까방지 모드", color: "#4FC3F7", baseDelay: 4000, minDelay: 3000, multiplier: 50, rewardMult: 0.5, desc: "정말 느리고 편안해! 점수는 낮지만 억까는 없지!" },
      easy: { label: "🌱 이지 모드", color: "#81C784", baseDelay: 2500, minDelay: 1500, multiplier: 100, rewardMult: 1.0, desc: "무난하게 즐길 수 있는 속도야. 연습하기 좋지!" },
      medium: { label: "🔥 노멀 모드", color: "#FFB74D", baseDelay: 1600, minDelay: 800, multiplier: 200, rewardMult: 2.0, desc: "조금씩 빨라질 거야! 집중력이 필요해!" },
      hard: { label: "💀 하드 모드", color: "#E57373", baseDelay: 1000, minDelay: 500, multiplier: 400, rewardMult: 4.0, desc: "극한의 속도! 나츠미도 이건 못 잡을걸? 콘콘!" }
    };

    const startEmbed = new EmbedBuilder()
      .setTitle("🐹 나츠미의 두더지 게임: 난이도 선택!")
      .setDescription(
        "**원하는 난이도를 선택해줘!**\n난이도가 높을수록 점수당 금전 보상이 어마어마해져!\n\n" +
        Object.values(difficulties).map(d => `**${d.label}:** ${d.desc}`).join("\n")
      )
      .setColor("#FFD700")
      .setFooter({ text: "버튼을 누르면 바로 게임이 시작돼!" });

    const startRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("diff_safety").setLabel("억까방지").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("diff_easy").setLabel("이지").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("diff_medium").setLabel("노멀").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("diff_hard").setLabel("하드").setStyle(ButtonStyle.Danger)
    );

    const menuResponse = await interaction.reply({
      embeds: [startEmbed],
      components: [startRow],
      fetchReply: true
    });

    const menuCollector = menuResponse.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 30000
    });

    menuCollector.on('collect', async (menuInteract) => {
      if (menuInteract.user.id !== userId) {
        return menuInteract.reply({ content: "네 게임은 네가 직접 시작해! 콘콘!", ephemeral: true });
      }

      const diffKey = menuInteract.customId.replace("diff_", "");
      const config = difficulties[diffKey];
      menuCollector.stop("started");

      // Game State
      const gameDuration = 40000;
      let score = 0;
      let moleIndexes = [];
      let startTime = Date.now();
      let isFinished = false;
      let currentLevel = 1;

      // Helper to build grid
      const getGrid = (activeIndexes) => {
        const rows = [];
        for (let i = 0; i < 3; i++) {
          const row = new ActionRowBuilder();
          for (let j = 0; j < 3; j++) {
            const index = i * 3 + j;
            const isMole = activeIndexes.includes(index);
            row.addComponents(
              new ButtonBuilder()
                .setCustomId(`mole_${index}`)
                .setLabel(isMole ? "🐹" : "🕳️")
                .setStyle(isMole ? ButtonStyle.Primary : ButtonStyle.Secondary)
                .setDisabled(isFinished)
            );
          }
          rows.push(row);
        }
        return rows;
      };

      const gameEmbed = new EmbedBuilder()
        .setTitle(`🏮 [ ${config.label} ] 두더지 잡기 시작!`)
        .setDescription(`**두더지를 잡아라!**\n\n**현재 레벨:** \`Lv.${currentLevel}\`\n**현재 점수:** \`${score}\`점\n**남은 시간:** \`40.0\`초`)
        .setColor(config.color);

      await menuInteract.update({
        embeds: [gameEmbed],
        components: getGrid([])
      });

      const collector = menuResponse.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: gameDuration,
      });

      const moleLoop = async () => {
        if (isFinished) return;

        const elapsed = Date.now() - startTime;
        const timeLeft = Math.max(0, (gameDuration - elapsed) / 1000).toFixed(1);
        currentLevel = Math.min(5, Math.floor(score / 40) + 1);

        const rand = Math.floor(Math.random() * 9);
        moleIndexes = [rand];

        const updateEmbed = EmbedBuilder.from(gameEmbed)
          .setDescription(`**두더지를 잡아라!**\n\n**현재 레벨:** \`Lv.${currentLevel}\`\n**현재 점수:** \`${score}\`점\n**남은 시간:** \`${timeLeft}\`초`);

        await interaction.editReply({
          embeds: [updateEmbed],
          components: getGrid(moleIndexes)
        }).catch(() => {});

        const nextDelay = Math.max(config.minDelay, config.baseDelay - (currentLevel * 150));
        setTimeout(moleLoop, nextDelay);
      };

      setTimeout(moleLoop, 500);

      collector.on('collect', async (i) => {
        if (i.user.id !== userId) return;

        const clickedIndex = parseInt(i.customId.split('_')[1]);

        if (moleIndexes.includes(clickedIndex)) {
          const addedScore = (currentLevel * 2);
          score += addedScore;
          moleIndexes = [];

          const elapsed = Date.now() - startTime;
          const timeLeft = Math.max(0, (gameDuration - elapsed) / 1000).toFixed(1);
          
          const hitEmbed = EmbedBuilder.from(gameEmbed)
            .setDescription(`**✅ 명중! (+${addedScore})**\n\n**현재 점수:** \`${score}\`점\n**남은 시간:** \`${timeLeft}\`초`)
            .setColor("#00FF00");

          await i.update({
            embeds: [hitEmbed],
            components: getGrid([])
          }).catch(() => {});
        } else {
          const penalty = currentLevel + 1;
          score = Math.max(0, score - penalty);
          
          const elapsed = Date.now() - startTime;
          const timeLeft = Math.max(0, (gameDuration - elapsed) / 1000).toFixed(1);

          const missEmbed = EmbedBuilder.from(gameEmbed)
            .setDescription(`**❌ 헛방! (-${penalty})**\n\n**현재 점수:** \`${score}\`점\n**남은 시간:** \`${timeLeft}\`초`)
            .setColor("#FF0000");

          await i.update({
            embeds: [missEmbed],
            components: getGrid(moleIndexes)
          }).catch(() => {});
        }
      });

      collector.on('end', async () => {
        isFinished = true;
        const rewardMoney = Math.floor(score * config.multiplier * config.rewardMult);
        
        let statusText = "";
        try {
          if (rewardMoney > 0) {
            const dobak_data = await dobak_Schema.findOne({ userid: userId });
            if (dobak_data) {
              await dobak_Schema.updateOne({ userid: userId }, { $inc: { money: rewardMoney } });
            } else {
              await new dobak_Schema({ userid: userId, money: rewardMoney, date: Math.round(new Date() / 1000) }).save();
            }
            statusText = `💰 **정산 완료:** \`+${rewardMoney.toLocaleString()}\` 금전 지급 완료!`;
          } else {
            statusText = `😥 **정산 실패:** 점수가 너무 낮아...`;
          }
        } catch (e) {
          statusText = "⚠️ 보상 지급 중 오류 발생!";
        }

        const resultEmbed = new EmbedBuilder()
          .setTitle(`🐹 [ ${config.label} ] 결과 정산!`)
          .setDescription(
            `**${interaction.user.username}**님의 이번 게임 결과야!\n\n` +
            `📊 **최종 점수:** \`${score}\` 점\n` +
            `${statusText}\n\n` +
            `*두더지들이 전부 도망갔어! 콘콘!*`
          )
          .setColor(config.color)
          .setThumbnail(interaction.user.displayAvatarURL())
          .setFooter({ text: "/두더지로 다시 시작할 수 있어!" })
          .setTimestamp();

        await interaction.deleteReply().catch(() => {});
        await interaction.followUp({ embeds: [resultEmbed] }).catch(() => {});
      });
    });

    menuCollector.on('end', (collected, reason) => {
      if (reason !== "started") {
        interaction.editReply({ components: [] }).catch(() => {});
      }
    });
  },
};

