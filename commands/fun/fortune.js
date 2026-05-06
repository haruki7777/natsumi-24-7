import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';
import { generateDistributedContent } from '../../utils/ai.js';
import { getTranslation, getLang } from '../../utils/i18n.js';

export default {
  data: new SlashCommandBuilder()
    .setName('운세')
    .setDescription('나츠미가 타로카드로 네 운명을 엿봐줄게! (별로 널 위해서 점쳐주는 건 아냐!)'),
  
  async execute(interaction) {
    const locale = interaction.locale;
    const lang = getLang(locale);
    
    const tarotCards = [
      { id: 'fool', name: { ko: '광대 (The Fool)', en: 'The Fool', ja: '愚者' }, color: '#FFFFFF' },
      { id: 'magician', name: { ko: '마법사 (The Magician)', en: 'The Magician', ja: '魔術師' }, color: '#FFD700' },
      { id: 'priestess', name: { ko: '여사제 (The High Priestess)', en: 'The High Priestess', ja: '女教皇' }, color: '#4169E1' },
      { id: 'empress', name: { ko: '여황제 (The Empress)', en: 'The Empress', ja: '女帝' }, color: '#FF69B4' },
      { id: 'emperor', name: { ko: '황제 (The Emperor)', en: 'The Emperor', ja: '皇帝' }, color: '#FF4500' },
      { id: 'hierophant', name: { ko: '교황 (The Hierophant)', en: 'The Hierophant', ja: '法王' }, color: '#DAA520' },
      { id: 'lovers', name: { ko: '연인 (The Lovers)', en: 'The Lovers', ja: '恋人' }, color: '#FF1493' },
      { id: 'chariot', name: { ko: '전차 (The Chariot)', en: 'The Chariot', ja: '戦車' }, color: '#4682B4' },
      { id: 'justice', name: { ko: '정의 (Justice)', en: 'Justice', ja: '正義' }, color: '#008080' },
      { id: 'hermit', name: { ko: '은둔자 (The Hermit)', en: 'The Hermit', ja: '隠者' }, color: '#708090' },
      { id: 'fortune', name: { ko: '운명의 수레바퀴 (Wheel of Fortune)', en: 'Wheel of Fortune', ja: '運命の輪' }, color: '#EE82EE' },
      { id: 'strength', name: { ko: '힘 (Strength)', en: 'Strength', ja: '力' }, color: '#FFA500' },
      { id: 'hanged', name: { ko: '매달린 사람 (The Hanged Man)', en: 'The Hanged Man', ja: '吊るされた男' }, color: '#87CEEB' },
      { id: 'death', name: { ko: '죽음 (Death)', en: 'Death', ja: '死神' }, color: '#000000' },
      { id: 'temperance', name: { ko: '절제 (Temperance)', en: 'Temperance', ja: '節制' }, color: '#F0E68C' },
      { id: 'devil', name: { ko: '악마 (The Devil)', en: 'The Devil', ja: '悪魔' }, color: '#4B0082' },
      { id: 'tower', name: { ko: '탑 (The Tower)', en: 'The Tower', ja: '塔' }, color: '#B22222' },
      { id: 'star', name: { ko: '별 (The Star)', en: 'The Star', ja: '星' }, color: '#ADD8E6' },
      { id: 'moon', name: { ko: '달 (The Moon)', en: 'The Moon', ja: '月' }, color: '#191970' },
      { id: 'sun', name: { ko: '태양 (The Sun)', en: 'The Sun', ja: '太陽' }, color: '#FFFF00' },
      { id: 'judgement', name: { ko: '심판 (Judgement)', en: 'Judgement', ja: '審判' }, color: '#C0C0C0' },
      { id: 'world', name: { ko: '세계 (The World)', en: 'The World', ja: '世界' }, color: '#3CB371' }
    ];

    const pick = tarotCards[Math.floor(Math.random() * tarotCards.length)];
    const cardName = pick.name[lang] || pick.name['ko'];

    const luckyData = {
      ko: {
        colors: ['코발트 블루', '에메랄드 그린', '샴페인 골드', '로즈 쿼츠', '라벤더', '텐저린', '차콜 그레이', '터콰이즈'],
        hits: ['카페 서비스 메뉴', '좋아하는 가수의 노래', '반가운 연락', '완벽한 헤어세팅', '도착하는 버스', '윙크하는 길고양이']
      },
      en: {
        colors: ['Cobalt Blue', 'Emerald Green', 'Champaign Gold', 'Rose Quartz', 'Lavender', 'Tangerine', 'Charcoal Grey', 'Turquoise'],
        hits: ['Extra service at a cafe', 'A song you like playing', 'Hearing from an old friend', 'Perfect hair day', 'Bus arriving on time', 'A friendly stray cat']
      },
      ja: {
        colors: ['コバルトブルー', 'エメラルドグリーン', 'シャンパンゴールド', 'ローズクォーツ', 'ラベンダー', 'タンジェリン', 'チャコールグレー', 'ターコイズ'],
        hits: ['カフェでのサービス', '好きな曲が流れる', '嬉しい連絡', '完璧なヘアセット', 'バスのジャスト到着', '道端の猫が見つめてくる']
      }
    };

    const currentLucky = luckyData[lang] || luckyData['ko'];
    const luckyNum = Math.floor(Math.random() * 99) + 1;
    const luckyCol = currentLucky.colors[Math.floor(Math.random() * currentLucky.colors.length)];
    const luckyHit = currentLucky.hits[Math.floor(Math.random() * currentLucky.hits.length)];
    
    const initialEmbed = new EmbedBuilder()
      .setTitle("🔮 나츠미의 신비로운 점성술")
      .setDescription("흥! 네 미래가 그렇게 궁금해? \n여우의 영력이 깃든 카드를 한 장 뽑아봐. \n**딱히 널 걱정해서 보고 싶어 하는 건 아니니까!**")
      .setColor('#FF7F50')
      .setThumbnail('https://cdn-icons-png.flaticon.com/512/1048/1048953.png')
      .setFooter({ text: "여우는 거짓말을 하지 않는다구!" });

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('reveal_tarot')
          .setLabel("운명 확인하기! 콘콘!")
          .setEmoji('🦊')
          .setStyle(ButtonStyle.Danger)
      );

    const response = await interaction.reply({
      embeds: [initialEmbed],
      components: [row],
      fetchReply: true
    });

    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60000 
    });

    collector.on('collect', async (i) => {
      if (i.user.id !== interaction.user.id) {
        return i.reply({ content: getTranslation(locale, 'fortune.otherUserError'), ephemeral: true });
      }

      if (i.customId === 'reveal_tarot') {
        const loadingEmbed = new EmbedBuilder()
          .setTitle("🏮 점술 진행 중...")
          .setDescription('나츠미가 수정구를 들여다보며 네 운명을 읽고 있어! \n**기다리는 동안 딴짓하지 마! 알겠어?** 🔮')
          .setColor('#FF7F50')
          .setThumbnail('https://i.ibb.co/vYV0Y4p/loading-oracle.gif')
          .setFooter({ text: "운명의 흐름을 거스르지 마..." });

        await i.update({
          embeds: [loadingEmbed],
          components: [] 
        });

        let aiReading = "";
        let aiFlow = "";

        try {
          const sysPrompt = `You are Natsumi (나츠미), a 17-year-old Tsundere Vulpine (Fox girl) high schooler who is also a mystical oracle. 
          Your personality: Blunt, slightly dismissive, but secretly caring. You use phrases like "흥!" (Heph!), "바보야" (Dummy), and fox sounds like "콘콘!" (Kon kon!).
          Target Language: ${lang === 'ko' ? 'Korean' : lang === 'ja' ? 'Japanese' : 'English'}.
          
          Card Drawn: ${cardName}.
          
          TASK: Provide a tarot reading in your persona. 
          Respond in Banmal (informal Korean) if in Korean.
          
          FORMAT:
          [READING]
          (3-5 concise, impactful sentences in your tsundere fox-girl voice.)
          
          [FLOW]
          (2-3 punchy sentences about energy flow.)`;

          const aiResult = await generateDistributedContent({
            contents: [{ role: "user", parts: [{ text: `Read me the fate for ${cardName}.` }] }],
            config: { 
              systemInstruction: sysPrompt, 
              temperature: 0.8, 
              maxOutputTokens: 512 
            }
          });

          const text = aiResult.text;
          
          // Enhanced Robust Parsing
          let readingPart = "";
          let flowPart = "";

          if (text.includes("[FLOW]")) {
            const parts = text.split(/\[FLOW\]/i);
            readingPart = parts[0].replace(/\[READING\]/i, '').trim();
            flowPart = parts[1]?.trim() || "";
          } else {
             // Fallback Split
             const midpoint = Math.floor(text.length * 0.7);
             readingPart = text.substring(0, midpoint);
             flowPart = text.substring(midpoint);
          }

          aiReading = readingPart || "리딩을 불러오는 데 실패했다냥..";
          aiFlow = flowPart || "운명의 흐름이 안개처럼 신비롭게 흩어져 있다냥. 하지만 곧 빛이 비출 거다냥!";

        } catch (err) {
          console.error("[Fortune AI Error]", err);
          aiReading = "별의 기운이 불안정해서 리딩을 가져오지 못했다냥... (AI Error)";
          aiFlow = "안개 속에서 길을 잃었다냥. 하지만 조만간 빛이 비출 거다냥!";
        }

        const resultEmbed = new EmbedBuilder()
          .setTitle(`🦊 [${cardName}] 너의 운명이라구!`)
          .setDescription(`### 🕯️ 나츠미의 조언\n${aiReading}`)
          .addFields(
            { name: `🌊 운명의 흐름`, value: aiFlow.substring(0, 1024) },
            { name: "🏮 나츠미가 뽑은 행운", value: `🔢 **행운의 숫자**: \`${luckyNum}\`\n🎨 **행운의 색깔**: \`${luckyCol}\`\n🎯 **행운의 사건**: \`${luckyHit}\``, inline: false }
          )
          .setColor(pick.color || '#FF7F50')
          .setAuthor({ name: `${interaction.user.username}의 운명`, iconURL: interaction.user.displayAvatarURL() })
          .setTimestamp()
          .setFooter({ text: "좋은 결과가 나왔다고 너무 좋아하지 마! 바보!" });

        await i.editReply({
          embeds: [resultEmbed]
        });
        
        collector.stop();
      }
    });

    collector.on('end', async (collected, reason) => {
      if (reason === 'time' && collected.size === 0) {
        await interaction.editReply({
          content: "기다리다 지쳤어! 바보! 다음에 다시 오든가!",
          components: []
        }).catch(() => {});
      }
    });
  },
};
