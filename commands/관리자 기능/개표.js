// Commands/* 폴더에 넣어주세요

const {
    ContextMenuCommandBuilder,
    EmbedBuilder,
    ApplicationCommandType,
  } = require("discord.js");
  
  module.exports = {
    data: new ContextMenuCommandBuilder()
      .setName("개표")
      .setType(ApplicationCommandType.Message),
    description: "투표를 종료한다냥",
    ephemeral: true,
    /**
     *
     * @param {import("discord.js").ContextMenuCommandInteraction} interaction
     * @param {import("discord.js").Client} client
     */
    async execute(interaction) {
      await interaction.deferReply();
      const voteid = interaction.targetId;
      if (isNaN(voteid)) {
        return interaction.editReply({
          content: `**투표 메세지 아이디를 입력해 주라냥**`,
        });
      }
      const message = await interaction.channel.messages
        .fetch(voteid)
        .catch(() => {});
      if (!message) {
        return interaction.editReply({
          content: `**투표 메시지를 찾을 수 없다냥**`,
        });
      }
      await message.fetch();
      const good_count = message.reactions.cache.get("👍")?.count - 1;
      const bad_count = message.reactions.cache.get("👎")?.count - 1;
      if (!good_count && !bad_count) {
        return interaction.editReply({
          content: `**아무도 투표를 하지 않았다냥**`,
        });
      }
      message.reactions.removeAll();
      const beforembed = message.embeds[0].data;
      const embed = new EmbedBuilder();
      let result;
      if (good_count == bad_count) {
        result = "동점";
        embed.setColor("Grey");
      } else if (good_count < bad_count) {
        result = "반대 승리";
        embed.setColor("Red");
      } else if (good_count > bad_count) {
        result = "찬성 승리";
        embed.setColor("Green");
      }
      embed
        .setThumbnail(interaction.client.user.displayAvatarURL())
        .setTitle(`투표가 종료됨 (${result})`)
        .setDescription(beforembed.description)
        .addFields(
          {
            name: "**👍 찬성**",
            value: `\`\`\`${good_count}개\`\`\``,
            inline: true,
          },
          {
            name: "**👎 반대**",
            value: `\`\`\`${bad_count}개\`\`\``,
            inline: true,
          }
        )
        .setImage('https://media.discordapp.net/attachments/1049783329613951036/1056012003761725450/B407EE72-41AC-4125-8768-4F9D1B044BB7.png')
        .setTimestamp();
      message.edit({ embeds: [embed] });
      interaction.editReply({ content: `**개표가 완료되었다냥**` });
    },
  };