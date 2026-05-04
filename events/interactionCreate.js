import { Events, ChannelType } from "discord.js";
import ProcessedMessage from "../models/ProcessedMessage.js";

export default {
  name: Events.InteractionCreate,
  /**
   * @param {import("discord.js").Interaction} interaction
   * @param {import("discord.js").Client} client
   */
  async execute(interaction, client) {
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
      const startTime = Date.now();
      const commandName = interaction.commandName;
      console.log(`[InteractionLog] Command: ${commandName} | User: ${interaction.user.username}#${interaction.user.discriminator} [${interaction.user.id}]`);
      
      const command = client.commands.get(commandName);
      if (!command) {
          console.warn(`[InteractionLog] Command not found in client.commands: ${commandName}. Available: ${[...client.commands.keys()].join(', ')}`);
          if (interaction.isRepliable()) {
              await interaction.reply({ content: `**흥! '${commandName}'(이)라는 건 나츠미가 모르는 명령어거든? (명령어 로딩 오류)**`, ephemeral: true }).catch(() => {});
          }
          return;
      }

      try {
        if (!interaction.deferred && !interaction.replied) {
           await command.execute(interaction, client);
        }
        const duration = Date.now() - startTime;
        if (duration > 1500) {
            console.warn(`[Performance] Command ${interaction.commandName} took too long: ${duration}ms`);
        }
      } catch (error) {
        console.error(`Error executing command ${interaction.commandName}:`, error);
        const errorMsg = "**명령어 실행 중 오류가 발생했다냥!**";
        try {
          if (interaction.deferred || interaction.replied) {
            await interaction.editReply({ content: errorMsg }).catch(() => {});
          } else {
            await interaction.reply({ content: errorMsg, ephemeral: true }).catch(() => {});
          }
        } catch (subError) {
          console.error("Secondary error in interaction error handler:", subError.message);
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
