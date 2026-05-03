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
    const MainEmbed = new EmbedBuilder()
      .setTitle("👤 유저 정보")
      .setColor("Orange")
      .setThumbnail(user.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: "유저", value: `**${user} (${user.user.tag})**`, inline: true },
        { name: "아이디", value: `**${user.id}**`, inline: true },
        {
          name: "상태",
          value: `**${UserStatus[user.presence?.status] || "오프라인"}**`,
          inline: true,
        },
        { name: "최상단 역할", value: `**<@&${user.roles.highest.id}>**`, inline: true },
        {
          name: "계정 생성일",
          value: `**<t:${Math.round(user.user.createdTimestamp / 1000)}:f>**`,
        },
        {
          name: "서버 입장일",
          value: `**<t:${Math.round(user.joinedTimestamp / 1000)}:f>**`,
        }
      );
      
    if (user.presence?.activities.length > 0) {
      const DetailActivities = new ButtonBuilder()
        .setCustomId(`check_activity`)
        .setLabel("활동 상세정보")
        .setStyle(ButtonStyle.Primary);

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
          .setTitle("활동 상세정보")
          .setColor("Orange");
          
        user.presence.activities.forEach((act, index) => {
          CheckEmbed.addFields({
            name: `활동 ${index + 1}`,
            value: `**내용:** ${act.name}\n**상태:** ${act.state || "없음"}\n**타입:** ${ActivitiesType[act.type]}`,
          });
        });
        
        i.reply({ embeds: [CheckEmbed], ephemeral: true });
      });
    } else {
      await interaction.editReply({ embeds: [MainEmbed] });
    }
  },
};
