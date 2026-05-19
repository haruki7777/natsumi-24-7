import {
  ActionRowBuilder,
  ApplicationCommandType,
  ButtonBuilder,
  ButtonStyle,
  ContextMenuCommandBuilder,
  EmbedBuilder,
} from "discord.js";
import dobak_Schema from "../../models/dobak.js";
import { addXP } from "../../events/levels.js";

const SUCCESS_RATE = 0.03;

export default {
  data: new ContextMenuCommandBuilder()
    .setName("돈서리하기")
    .setType(ApplicationCommandType.User),

  /**
   * @param {import("discord.js").UserContextMenuCommandInteraction} interaction
   */
  async execute(interaction) {
    if (!interaction.deferred && !interaction.replied) await interaction.deferReply({ ephemeral: true });

    const targetUser = interaction.targetUser;
    const executor = interaction.user;

    if (targetUser.id === executor.id) {
      return interaction.editReply({ content: "자기 주머니는 서리할 수 없어. 그건 그냥 주머니 정리야." });
    }
    if (targetUser.bot) {
      return interaction.editReply({ content: "봇 주머니는 털 수 없어. 나츠미가 봇끼리는 봐주기로 했어." });
    }

    const [executorData, targetData, fullTarget] = await Promise.all([
      dobak_Schema.findOne({ userid: executor.id }),
      dobak_Schema.findOne({ userid: targetUser.id }),
      interaction.client.users.fetch(targetUser.id, { force: true }).catch(() => targetUser),
    ]);

    if (!executorData) {
      return interaction.editReply({ content: "`/출석체크`로 먼저 금전 정보를 만들어줘." });
    }
    if (!targetData || Number(targetData.money || 0) < 1000) {
      return interaction.editReply({ content: "상대 주머니가 너무 가벼워서 서리할 게 없어." });
    }

    const bannerUrl = fullTarget.bannerURL({ size: 1024, dynamic: true });
    const components = bannerUrl
      ? [new ActionRowBuilder().addComponents(new ButtonBuilder().setLabel("상대 배너 보기").setStyle(ButtonStyle.Link).setURL(bannerUrl))]
      : [];
    const success = Math.random() < SUCCESS_RATE;

    if (success) {
      const stealPercent = 0.005 + Math.random() * 0.015;
      const finalSteal = Math.max(1, Math.min(Math.floor(Number(targetData.money || 0) * stealPercent), 30000));

      await Promise.all([
        dobak_Schema.updateOne({ userid: executor.id }, { $inc: { money: finalSteal } }),
        dobak_Schema.updateOne({ userid: targetUser.id }, { $inc: { money: -finalSteal } }),
      ]);
      if (interaction.guildId) await addXP(interaction.guildId, executor.id, 30, interaction);

      const embed = new EmbedBuilder()
        .setColor("#22c55e")
        .setTitle("돈서리 성공")
        .setDescription(`성공 확률 3%를 뚫고 **${targetUser.username}**의 주머니에서 \`${finalSteal.toLocaleString()}\` 금전을 가져왔어.`)
        .addFields(
          { name: "성공 확률", value: "3%", inline: true },
          { name: "획득", value: `+${finalSteal.toLocaleString()} 금전`, inline: true },
          { name: "현재 금전", value: `${(Number(executorData.money || 0) + finalSteal).toLocaleString()} 금전`, inline: true },
        )
        .setThumbnail(fullTarget.displayAvatarURL({ size: 256, dynamic: true }))
        .setTimestamp();

      return interaction.editReply({ embeds: [embed], components });
    }

    const currentMoney = Math.max(0, Number(executorData.money || 0));
    const fine = Math.min(Math.max(5000, Math.floor(currentMoney * 0.08)), 50000, currentMoney);

    if (fine > 0) {
      await Promise.all([
        dobak_Schema.updateOne({ userid: executor.id }, { $inc: { money: -fine } }),
        dobak_Schema.updateOne({ userid: targetUser.id }, { $inc: { money: fine } }),
      ]);
    }

    const embed = new EmbedBuilder()
      .setColor("#ef4444")
      .setTitle("돈서리 실패")
      .setDescription(`실패 확률 97%에 걸렸어. **${targetUser.username}**에게 벌금 \`${fine.toLocaleString()}\` 금전을 물어줬어.`)
      .addFields(
        { name: "성공 확률", value: "3%", inline: true },
        { name: "실패 확률", value: "97%", inline: true },
        { name: "현재 금전", value: `${Math.max(0, currentMoney - fine).toLocaleString()} 금전`, inline: true },
      )
      .setThumbnail(fullTarget.displayAvatarURL({ size: 256, dynamic: true }))
      .setTimestamp();

    return interaction.editReply({ embeds: [embed], components });
  },
};
