const { Events, ChannelType } = require("discord.js");
const client = require("../index");

module.exports = {
  name: Events.InteractionCreate,
  /**
   * @param {import("discord.js").Interaction} interaction
   */
  async execute(interaction) {
    // DM Block
    if (interaction.channel?.type === ChannelType.DM) {
      const msg = "**봇의 기능은 서버 내에서만 사용하실 수 있습니다냥!**";
      if (interaction.isRepliable()) {
        return interaction.reply({ content: msg, ephemeral: true });
      }
      return;
    }

    // Slash Command Handling
    if (interaction.isChatInputCommand() || interaction.isContextMenuCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      // Note: We don't automatically defer here because some commands might use Modals
      // And we want to avoid double deferring since commands already call it.
      
      try {
        await command.execute(interaction, client);
      } catch (error) {
        console.error(`Error executing command ${interaction.commandName}:`, error);
        const errorMsg = "**명령어 실행 중 오류가 발생했다냥!**";
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply({ content: errorMsg });
        } else {
          await interaction.reply({ content: errorMsg, ephemeral: true });
        }
      }
      return;
    }

    // Button, Select Menu, Modal Submit Handling
    if (interaction.isButton() || interaction.isAnySelectMenu() || interaction.isModalSubmit()) {
      // The current system uses customId split by _ as the key
      const customId = interaction.customId.split("_")[0];
      const handler = client.buttons.get(customId);
      
      if (!handler) {
          // If no specific handler, maybe it's a dynamic customId logic inside another command (like inquiry)
          // Those are handled via collectors inside the commands themselves.
          return;
      }

      try {
        await handler.execute(interaction, client);
      } catch (error) {
        console.error(`Error executing handler for ${customId}:`, error);
      }
      return;
    }
  },
};
