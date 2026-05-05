import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import {
  classifyRuntime,
  getRuntimeHealth,
} from "../../utils/runtimeHealth.js";

export default {
  data: new SlashCommandBuilder()
    .setName("핑")
    .setDescription("봇의 핑을 확인한다냥!"),
  /**
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   */
  async execute(interaction, client) {
    if (interaction.replied || interaction.deferred) return;
    
    const deferStart = Date.now();
    try {
      await interaction.deferReply();
    } catch (e) {
      console.error("[PingError] Failed to defer:", e.message);
      return;
    }
    
    const apiLatency = Date.now() - deferStart;
    const dispatchLatency = deferStart - interaction.createdTimestamp;
    const health = getRuntimeHealth(client);
    const gatewayPing = health.gatewayPing;
    const likelyCause = classifyRuntime(health);
    
    let gatewayStatus;
    if (gatewayPing < 150) gatewayStatus = "🟢";
    else if (gatewayPing < 300) gatewayStatus = "🟠";
    else gatewayStatus = "🔴";

    let apiStatus;
    if (apiLatency < 300) apiStatus = "🟢";
    else if (apiLatency < 600) apiStatus = "🟠";
    else apiStatus = "🔴";

    const embed_color = {
      "🟢": "#57F287",
      "🟠": "#FEE75C",
      "🔴": "#ED4245",
    };
    
    const uptime = Math.round(client.readyTimestamp / 1000);
    const embed = new EmbedBuilder()
      .setTitle("🏓 퐁!")
      .addFields(
        {
          name: `📡 게이트웨이 (WS)`,
          value: `**${gatewayPing}ms** (${gatewayStatus})`,
          inline: true,
        },
        {
          name: `⚡ API 응답 (REST)`,
          value: `**${apiLatency}ms** (${apiStatus})`,
          inline: true,
        },
        {
          name: `처리 대기`,
          value: `**${dispatchLatency}ms**`,
          inline: true,
        },
        {
          name: `런타임`,
          value: `lag ${health.eventLoopLagMs}/${health.eventLoopMaxMs}ms | ${health.memoryRssMb}MB | ${likelyCause}`,
        },
        {
          name: `⏰ 업타임`,
          value: `<t:${uptime}:D> (<t:${uptime}:R>)`,
        }
      )
      .setColor(embed_color[gatewayStatus])
      .setFooter({
        iconURL: client.user.displayAvatarURL(),
        text: `나츠미 최적화 모드 작동 중!`,
      })
      .setThumbnail(client.user.displayAvatarURL())
      .setTimestamp();
      
    await interaction.editReply({
      embeds: [embed],
    });
  },
};
