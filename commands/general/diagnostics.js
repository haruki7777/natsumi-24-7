import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { monitorEventLoopDelay } from "perf_hooks";

const eventLoopDelay = monitorEventLoopDelay({ resolution: 20 });
eventLoopDelay.enable();

const startedAt = Date.now();

const formatUptime = (seconds) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${days}d ${hours}h ${minutes}m`;
};

const classify = (ping, lag) => {
  if (lag >= 100) return "CPU/event loop pressure";
  if (ping >= 300) return "Discord/network/hosting latency";
  return "Healthy";
};

export default {
  data: new SlashCommandBuilder()
    .setName("diagnostics")
    .setDescription("Show bot latency, memory, and runtime health."),

  async execute(interaction) {
    const ping = Math.round(interaction.client.ws.ping ?? -1);
    const lag = Math.round(eventLoopDelay.mean / 1_000_000);
    const memory = process.memoryUsage();
    const rssMb = Math.round(memory.rss / 1024 / 1024);
    const heapMb = Math.round(memory.heapUsed / 1024 / 1024);
    const uptimeSeconds = Math.floor((Date.now() - startedAt) / 1000);
    const diagnosis = classify(ping, lag);

    const embed = new EmbedBuilder()
      .setTitle("Bot diagnostics")
      .setColor(diagnosis === "Healthy" ? "Green" : "Orange")
      .addFields(
        { name: "Discord ping", value: `${ping} ms`, inline: true },
        { name: "Event loop lag", value: `${lag} ms`, inline: true },
        { name: "Memory", value: `${rssMb} MB RSS / ${heapMb} MB heap`, inline: false },
        { name: "Uptime", value: formatUptime(uptimeSeconds), inline: true },
        { name: "Guilds", value: `${interaction.client.guilds.cache.size}`, inline: true },
        { name: "Likely cause", value: diagnosis, inline: false },
      )
      .setTimestamp();

    eventLoopDelay.reset();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
