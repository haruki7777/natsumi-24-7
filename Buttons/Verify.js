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
          await interaction.reply({ content: "**인증 명령어를 찾을 수 없다냥!**", ephemeral: true });
      }
    },
  };
  