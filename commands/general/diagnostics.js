import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import {
  classifyRuntime,
  getRuntimeHealth,
  resetRuntimeLag,
  summarizeRuntimeSamples,
} from "../../utils/runtimeHealth.js";

const formatUptime = (seconds) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${days}d ${hours}h ${minutes}m`;
};

export default {
  data: new SlashCommandBuilder()
    .setName("diagnostics")
    .setDescription("Show bot latency, memory, and runtime health."),

  async execute(interaction) {
    const health = getRuntimeHealth(interaction.client);
    const summary = summarizeRuntimeSamples();
    const diagnosis = classifyRuntime(health);
    const botEnv = process.env.BOT_ENV || process.env.NODE_ENV || "unknown";
    const botName = process.env.BOT_NAME || interaction.client.user?.username || "Natsumi";

    const embed = new EmbedBuilder()
      .setTitle(`${botName} diagnostics`)
      .setColor(diagnosis === "Healthy" ? "Green" : "Orange")
      .addFields(
        { name: "Environment", value: botEnv, inline: true },
        { name: "Discord ping", value: `${health.gatewayPing} ms`, inline: true },
        { name: "Event loop lag", value: `${health.eventLoopLagMs} ms avg / ${health.eventLoopMaxMs} ms max`, inline: true },
        { name: "Memory", value: `${health.memoryRssMb} MB RSS / ${health.memoryHeapMb} MB heap`, inline: false },
        { name: "Uptime", value: formatUptime(health.uptimeSeconds), inline: true },
        { name: "Guilds", value: `${health.guilds}`, inline: true },
        {
          name: "Recent peaks",
          value: `${summary.count} samples | WS ${summary.maxGatewayPing} ms | lag ${summary.maxEventLoopLagMs}/${summary.maxEventLoopMaxMs} ms | memory ${summary.maxMemoryRssMb} MB`,
          inline: false,
        },
        { name: "Likely cause", value: diagnosis, inline: false },
      )
      .setTimestamp();

    resetRuntimeLag();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
