export default {
    name: "verify",
    /**
     * @param {import("discord.js").ButtonInteraction} interaction
     */
    async execute(interaction) {
      const command = interaction.client.commands.get("인증");
      if (command) {
          await command.execute(interaction);
      } else {
          await interaction.reply({ content: "**으악! 인증 시스템에 문제가 생겼어! (명령어 찾기 실패) 콘콘!**", ephemeral: true });
      }
    },
  };
  