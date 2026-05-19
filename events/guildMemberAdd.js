import { ChannelType, Events } from "discord.js";
import DashboardSettings from "../models/DashboardSettings.js";
import { resolveWelcomeText } from "../utils/dashboardSettings.js";
import { buildMemberCard } from "../utils/welcomeCard.js";

const cleanEnv = (value) => String(value || "").replace(/['"]/g, "").trim();

const withTimeout = (promise, ms, fallback = null) =>
  Promise.race([
    promise.catch(() => fallback),
    new Promise((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);

async function generateAiWelcome(member, prompt) {
  const apiKey = cleanEnv(process.env.MY_GEMINI_API_KEY || process.env.GEMINI_API_KEY);
  if (!apiKey || !prompt?.trim()) return null;

  return withTimeout((async () => {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const ai = new GoogleGenerativeAI(apiKey);
    const model = ai.getGenerativeModel({ model: process.env.NATSUMI_WELCOME_AI_MODEL || "gemini-1.5-flash" });
    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: [
            "Discord 서버에 새 멤버가 들어왔을 때 보낼 환영 문구를 한국어로 1~2문장만 작성해줘.",
            "멘션은 그대로 유지하고, 과한 설명이나 마크다운 남발은 피한다.",
            `서버명: ${member.guild.name}`,
            `멤버명: ${member.user.username}`,
            `멤버멘션: <@${member.user.id}>`,
            `관리자 프롬프트: ${prompt}`,
          ].join("\n"),
        }],
      }],
      generationConfig: { temperature: 0.85, maxOutputTokens: 180 },
    });
    return result.response.text().trim();
  })(), 4500);
}

export default {
  name: Events.GuildMemberAdd,

  async execute(member) {
    const settings = await DashboardSettings.findOne({ guildId: member.guild.id }).catch(() => null);
    if (!settings?.welcome?.enabled || !settings.welcome.channelId) return;

    const channel = await member.guild.channels.fetch(settings.welcome.channelId).catch(() => null);
    if (!channel || channel.type !== ChannelType.GuildText) return;

    const aiMessage = await generateAiWelcome(member, resolveWelcomeText(settings.welcome.aiPrompt, member));
    const baseMessage = aiMessage || settings.welcome.message;
    const content = resolveWelcomeText(baseMessage, member);
    const card = await buildMemberCard(member, "welcome").catch(() => null);
    const sent = await channel.send({
      content: content || `${member} 어서 와!`,
      files: card ? [card] : [],
      allowedMentions: { users: [member.id] },
    }).catch(() => null);

    if (sent && settings.welcome.cleanupOnLeave) {
      settings.welcome.lastWelcomeMessages.set(member.id, `${channel.id}:${sent.id}`);
      await settings.save().catch(() => null);
    }
  },
};
