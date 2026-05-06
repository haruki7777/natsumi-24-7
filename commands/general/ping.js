import { SlashCommandBuilder, EmbedBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("핑")
    .setDescription("봇의 핑을 확인한다냥!"),
  /**
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   */
  async execute(interaction, client) {
    if (interaction.replied || interaction.deferred) return;
    
    try {
      await interaction.deferReply();
    } catch (e) {
      console.error("[PingError] Failed to defer:", e.message);
      return;
    }
    
    const os = await import("os");
    const totalMem = (os.totalmem() / (1024 ** 3)).toFixed(1);
    const freeMem = (os.freemem() / (1024 ** 3)).toFixed(1);
    const usedMem = (totalMem - freeMem).toFixed(1);
    const memPercent = ((usedMem / totalMem) * 100).toFixed(1);

    const cpuModel = os.cpus()[0]?.model || "알 수 없음";
    const cpuCount = os.cpus().length;

    const gatewayPing = client.ws.ping;
    const gatewayStatus = gatewayPing < 150 ? "🟢" : (gatewayPing < 300 ? "🟠" : "🔴");
    const apiLatency = Date.now() - interaction.createdTimestamp;
    const apiStatus = apiLatency < 300 ? "🟢" : (apiLatency < 600 ? "🟠" : "🔴");
    const uptime = Math.round(client.readyTimestamp / 1000);

    const embed = new EmbedBuilder()
      .setTitle("🦊 Natsumi Vulpine Health Check")
      .setDescription(`콘콘~! 당신이 궁금해하는 것 같아서 특별히 보여주는 거야. 여우의 눈은 속일 수 없거든! 괜히 감동받아서 꼬리 흔들지 마! ♥(⸝⸝⸝ᵒ̴̶̷̥́ ᵕ ก̀⸝⸝⸝)ෆ`)
      .setColor("#FF7F50") // Coral
      .setThumbnail(client.user.displayAvatarURL())
      .addFields(
        { name: "🏮 Core Data", value: `\`\`\`yml\n이름: ${client.user.username}\n버전: v2.2.0 (Vulpine Core)\n상태: 최상 (운영 중)\`\`\``, inline: false },
        { name: "🍃 Environment", value: `**OS:** ${os.type()}\n**Uptime:** <t:${uptime}:R>`, inline: true },
        { name: "⚙️ Hardware", value: `**Memory:** ${usedMem}G / ${totalMem}G\n**Load:** ${memPercent}%`, inline: true },
        { name: "📡 Network", value: `**WS:** ${gatewayPing}ms (${gatewayStatus})\n**API:** ${apiLatency}ms (${apiStatus})`, inline: true }
      )
      .setFooter({ text: "나츠미는 항상 너를... 아니, 서버를 감시하고 있어!" })
      .setTimestamp();

    await interaction.editReply({
      embeds: [embed],
    });
  },
};
