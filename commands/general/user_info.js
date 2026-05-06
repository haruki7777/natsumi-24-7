import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";

let UserStatus = {
  online: "온라인",
  idle: "자리비움",
  dnd: "다른 용무중",
  offline: "오프라인",
};

let ActivitiesType = {
  0: "하는 중",
  1: "방송 중",
  2: "듣는 중",
  3: "시청 중",
  4: "커스텀",
  5: "참가 중",
};

export default {
  data: new SlashCommandBuilder()
    .setName("유저정보")
    .setDescription("유저정보를 확인한다냥!")
    .addUserOption((op) =>
      op
        .setName("유저")
        .setDescription("정보를 조회할 유저를 선택하냥.")
        .setRequired(false)
    ),
  /**
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    await interaction.deferReply();
    const user = interaction.options.getMember("유저") || interaction.member;
    const isSelf = user.id === interaction.user.id;

    const MainEmbed = new EmbedBuilder()
      .setTitle("🦊 유저 정보 보관함")
      .setDescription(isSelf 
        ? "흥! 뭐? 네 정보가 그렇게 궁금해? 어차피 내가 다 꿰뚫어 보고 있거든! ♥(⸝⸝⸝ᵒ̴̶̷̥́ ᵕ ก̀⸝⸝⸝)ෆ" 
        : `콘콘! ${user.user.username} 녀석의 정보를 캐내려는 거야? 너도 참 취향 독특하네! 스토커는 아니겠지?`)
      .setColor("#FF7F50")
      .setThumbnail(user.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: "🏮 정체", value: `**${user.user.username}**\n(${user.user.tag})`, inline: true },
        { name: "🆔 식별 부적", value: `\`${user.id}\``, inline: true },
        {
          name: "🍃 상태",
          value: `**${UserStatus[user.presence?.status] || "어딘가 숨어있음"}**`,
          inline: true,
        },
        { name: "🎋 가장 높은 위계", value: `**<@&${user.roles.highest.id}>**`, inline: true },
        {
          name: "🐣 세상에 태어난 날",
          value: `**<t:${Math.round(user.user.createdTimestamp / 1000)}:D>**`,
          inline: true,
        },
        {
          name: "⛩️ 숲에 들어온 날",
          value: `**<t:${Math.round(user.joinedTimestamp / 1000)}:D>**`,
          inline: true,
        }
      )
      .setFooter({ text: "여우의 눈은 모든 걸 지켜보고 있다구!" });
      
    if (user.presence?.activities.length > 0) {
      const DetailActivities = new ButtonBuilder()
        .setCustomId(`check_activity`)
        .setLabel("비밀 활동 엿보기")
        .setStyle(ButtonStyle.Success);

      const msg = await interaction.editReply({
        embeds: [MainEmbed],
        components: [new ActionRowBuilder().addComponents(DetailActivities)],
      });

      const collector = msg.createMessageComponentCollector({
        filter: (i) => i.user.id === interaction.user.id,
        time: 60000,
      });

      collector.on("collect", async (i) => {
        const CheckEmbed = new EmbedBuilder()
          .setTitle("🦊 활동 상세 기록")
          .setDescription("무슨 수상한 짓을 하고 있는지 다 적혀있다구!")
          .setColor("#FF7F50");
          
        user.presence.activities.forEach((act, index) => {
          CheckEmbed.addFields({
            name: `기록 #${index + 1}`,
            value: `**내용:** ${act.name}\n**상황:** ${act.state || "평범함"}\n**타입:** ${ActivitiesType[act.type]}`,
          });
        });
        
        i.reply({ embeds: [CheckEmbed], ephemeral: true });
      });
    } else {
      await interaction.editReply({ embeds: [MainEmbed] });
    }
  },
};
