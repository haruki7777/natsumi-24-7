import { ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from "discord.js";
import NatsumiAnonIdentity from "../models/NatsumiAnonIdentity.js";

const WEBHOOK_NAME = "Natsumi Anonymous";

export const randomAnonIp = () => {
  const first = Math.floor(Math.random() * 223) + 1;
  const second = Math.floor(Math.random() * 255);
  return `${first}.${second}`;
};

export const getOrCreateAnonIp = async (guildId, userId) => {
  const existing = await NatsumiAnonIdentity.findOne({ guildId, userId }).lean().catch(() => null);
  if (existing?.anonIp) return existing.anonIp;

  const created = await NatsumiAnonIdentity.findOneAndUpdate(
    { guildId, userId },
    { guildId, userId, anonIp: randomAnonIp(), updatedAt: new Date() },
    { upsert: true, new: true }
  ).lean();

  return created?.anonIp || randomAnonIp();
};

export const resetAnonIp = async (guildId, userId) => {
  const existing = await NatsumiAnonIdentity.findOne({ guildId, userId }).lean().catch(() => null);
  let anonIp = randomAnonIp();
  for (let i = 0; i < 5 && existing?.anonIp === anonIp; i += 1) {
    anonIp = randomAnonIp();
  }

  await NatsumiAnonIdentity.findOneAndUpdate(
    { guildId, userId },
    { guildId, userId, anonIp, updatedAt: new Date() },
    { upsert: true, new: true }
  );

  return anonIp;
};

export const buildAnonGuideButtons = () => [
  new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("NatsumiAnon_open")
      .setLabel("새 메시지 작성")
      .setEmoji("🎭")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("NatsumiAnon_reset")
      .setLabel("유동 IP 초기화")
      .setEmoji("🌀")
      .setStyle(ButtonStyle.Secondary)
  ),
];

const getAnonWebhook = async (channel) => {
  const botMember = channel.guild.members.me || await channel.guild.members.fetchMe().catch(() => null);
  if (!botMember?.permissionsIn(channel).has(PermissionFlagsBits.ManageWebhooks)) return null;

  const webhooks = await channel.fetchWebhooks().catch(() => null);
  const existing = webhooks?.find((hook) => hook.name === WEBHOOK_NAME && hook.owner?.id === channel.client.user.id);
  if (existing) return existing;

  return channel.createWebhook({
    name: WEBHOOK_NAME,
    avatar: channel.client.user.displayAvatarURL(),
    reason: "Natsumi anonymous room relay",
  }).catch(() => null);
};

export const sendAnonymousPlainMessage = async ({ channel, guildId, userId, content, imageUrl = null }) => {
  const anonIp = await getOrCreateAnonIp(guildId, userId);
  const username = `ㅇㅇ(${anonIp})`;
  const text = content?.trim() || (imageUrl ? "첨부 이미지" : "");

  const webhook = await getAnonWebhook(channel);
  if (webhook) {
    return webhook.send({
      username,
      content: text,
      files: imageUrl ? [imageUrl] : [],
      allowedMentions: { parse: [] },
    }).catch(() => channel.send({
      content: `**${username}**\n${[text, imageUrl].filter(Boolean).join("\n")}`,
      allowedMentions: { parse: [] },
    }));
  }

  return channel.send({
    content: `**${username}**\n${[text, imageUrl].filter(Boolean).join("\n")}`,
    allowedMentions: { parse: [] },
  });
};
