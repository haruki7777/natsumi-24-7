import { ChannelType, Events } from "discord.js";
import { buildPremiumHeartPrompt, checkPremiumHeart } from "../utils/premiumHeart.js";

const HEART_REQUIRED_COMMANDS = new Set([
  "nsfw",
  "nsfw2",
  "nsfw3",
  "sfw",
  "애니짤",
]);

const needsPremiumHeart = (commandName) => {
  const normalized = String(commandName || "").toLowerCase();
  return HEART_REQUIRED_COMMANDS.has(normalized) || HEART_REQUIRED_COMMANDS.has(commandName);
};

export default {
  name: Events.InteractionCreate,

  async execute(interaction, client) {
    if (interaction.channel?.type === ChannelType.DM) {
      const msg = "**서버 안에서만 사용할 수 있어요.**";
      if (interaction.isRepliable()) {
        return interaction.reply({ content: msg, ephemeral: true });
      }
      return;
    }

    if (interaction.isChatInputCommand() || interaction.isContextMenuCommand()) {
      const startTime = Date.now();
      const commandName = interaction.commandName;
      console.log(`[InteractionLog] Command: ${commandName} | User: ${interaction.user.username} [${interaction.user.id}]`);

      const command = client.commands.get(commandName);
      if (!command) {
        console.warn(`[InteractionLog] Command not found: ${commandName}. Available: ${[...client.commands.keys()].join(", ")}`);
        if (interaction.isRepliable()) {
          await interaction.reply({
            content: `**'${commandName}' 명령어를 찾지 못했어요. 명령어 로딩 상태를 확인해줘.**`,
            ephemeral: true,
          }).catch(() => null);
        }
        return;
      }

      try {
        if (needsPremiumHeart(commandName)) {
          const heart = await checkPremiumHeart(interaction.user.id);
          if (!heart.ok) {
            return interaction.reply(buildPremiumHeartPrompt(interaction.user.id, heart)).catch(() => null);
          }
        }

        if (!interaction.deferred && !interaction.replied) {
          await command.execute(interaction, client);
        }

        const duration = Date.now() - startTime;
        if (duration > 1500) {
          console.warn(`[Performance] Command ${interaction.commandName} took ${duration}ms`);
        }
      } catch (error) {
        console.error(`Error executing command ${interaction.commandName}:`, error);
        const errorMsg = "**명령어 처리 중 오류가 발생했어요.**";
        try {
          if (interaction.deferred || interaction.replied) {
            await interaction.editReply({ content: errorMsg }).catch(() => null);
          } else {
            await interaction.reply({ content: errorMsg, ephemeral: true }).catch(() => null);
          }
        } catch (subError) {
          console.error("Secondary error in interaction error handler:", subError.message);
        }
      }
      return;
    }

    if (interaction.isButton() || interaction.isAnySelectMenu() || interaction.isModalSubmit()) {
      const customId = interaction.customId.split("_")[0];
      const handler = client.buttons.get(customId);
      if (!handler) return;

      try {
        await handler.execute(interaction, client);
      } catch (error) {
        console.error(`Error executing handler for ${customId}:`, error);
      }
    }
  },
};
