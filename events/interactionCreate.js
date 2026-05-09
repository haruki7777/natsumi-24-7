import { Events, ChannelType } from "discord.js";
import ProcessedMessage from "../models/ProcessedMessage.js";
import { buildPremiumHeartPrompt, checkPremiumHeart } from "../utils/premiumHeart.js";

const HEART_REQUIRED_COMMANDS = new Set([
  "nsfw",
  "nsfw2",
  "sfw",
  "애니짤",
]);

const needsPremiumHeart = (commandName) => {
  const normalized = String(commandName || "").toLowerCase();
  return HEART_REQUIRED_COMMANDS.has(normalized) || HEART_REQUIRED_COMMANDS.has(commandName);
};

export default {
  name: Events.InteractionCreate,
  /**
   * @param {import("discord.js").Interaction} interaction
   * @param {import("discord.js").Client} client
   */
  async execute(interaction, client) {
    // DM Block
    if (interaction.channel?.type === ChannelType.DM) {
      const msg = "**흥! 숲 밖에서는 내 힘을 쓸 수 없어! (서버 내에서만 사용 가능)**";
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
        if (needsPremiumHeart(commandName)) {
          const heart = await checkPremiumHeart(interaction.user.id);
          if (!heart.ok) {
            return interaction.reply(buildPremiumHeartPrompt(interaction.user.id, heart)).catch(() => {});
          }
        }

        if (!interaction.deferred && !interaction.replied) {
           await command.execute(interaction, client);
        }
        const duration = Date.now() - startTime;
        if (duration > 1500) {
            console.warn(`[Performance] Command ${interaction.commandName} took too long: ${duration}ms`);
        }
      } catch (error) {
        console.error(`Error executing command ${interaction.commandName}:`, error);
        const errorMsg = "**으윽... 명령어를 쓰려다 영력이 꼬였어! (오류 발생) 콘콘!**";
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
