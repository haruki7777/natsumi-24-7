// Commands/* 폴더에 넣어주세요

import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import dobak_Schema from "../../models/dobak.js";

export default {
  data: new SlashCommandBuilder()
    .setName("잔액")
    .setDescription("네 주머니에 뭐가 들었는지 내가 다 알고 있거든? 콘콘!")
    .addUserOption((f) =>
      f
        .setName("유저")
        .setDescription("주머니를 털어볼(?) 유저를 선택해봐.")
        .setRequired(false)
    ),
  /**
   *
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    await interaction.deferReply();
    const user = interaction.options.getUser("유저") || interaction.user;
    const isSelf = user.id === interaction.user.id;
    const dobak_find = await dobak_Schema.findOne({ userid: user.id });

    if (!dobak_find) {
      return interaction.editReply({ content: isSelf 
        ? "흥! 아직 내 숲에 등록도 안 된 뜨내기네? 돈이 있을 리가 없잖아! (`/돈받기`부터 하라고!)" 
        : `보라고! ${user.username} 이 녀석은 빈털터리라구! 등록조차 안 돼 있잖아. ♥(⸝⸝⸝ᵒ̴̶̷̥́ ᵕ ก̀⸝⸝⸝)ෆ` });
    }

    const ranking =
      (
        await dobak_Schema
          .find()
          .sort([["money", "descending"]])
          .limit(500)
          .exec()
      ).findIndex((i) => i.userid == user.id) + 1;

    const embed = new EmbedBuilder()
      .setColor("#FF8C00") // Fox Orange
      .setTitle("🏮 나츠미의 장부기록")
      .setDescription(isSelf 
        ? `콘콘! 네 주머니 사정은 이래. \n**별로 널 걱정해서 세어보는 건 아니니까?**` 
        : `**\`${user.username}\`** 녀석의 주머니를 샅샅이 뒤져봤어! 🦊`)
      .addFields(
        { name: "💰 현재 잔액", value: `**${dobak_find.money.toLocaleString("ko-KR")} 냥**`, inline: true },
        { name: "🏆 재력 순위", value: `**${ranking}위** (부러우면 지는 거야!)`, inline: true }
      )
      .setFooter({ text: "여우는 돈 냄새를 아주 잘 맡는답니다~" });

    interaction.editReply({
      embeds: [embed],
    });
  },
};
