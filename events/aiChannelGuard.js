import { Events, PermissionFlagsBits } from "discord.js";
import NatsumiGuildSetup from "../models/NatsumiGuildSetup.js";
import ProcessedMessage from "../models/ProcessedMessage.js";

const CALLWORDS = ["나츠미", "나쯔미", "낫쯔미", "츠미짱", "츠미야", "나츠", "나츠짱", "츠미"];

const isCalled = (message, client) => {
  const content = (message.content || "").trim().toLowerCase();
  return message.mentions.has(client.user.id) || CALLWORDS.some((word) => content.includes(word.toLowerCase()));
};

const hasManageGuild = (member) => {
  return Boolean(
    member?.permissions?.has(PermissionFlagsBits.ManageGuild) ||
    member?.permissions?.has(PermissionFlagsBits.Administrator)
  );
};

const handleAdminMode = async (message, setup) => {
  const content = (message.content || "").replace(/\s+/g, "");
  const isAdminMode = content.includes("관리자모드") || content.includes("관리자모드로");
  const isGlobalChat = content.includes("일반채팅") || content.includes("일반채널");
  if (!isAdminMode || !isGlobalChat) return false;
  if (!hasManageGuild(message.member)) {
    await message.reply({ content: "관리자 권한이 있어야 설정을 바꿀 수 있어. 흥, 아무나 만지면 곤란하거든 😤", allowedMentions: { repliedUser: false } }).catch(() => {});
    return true;
  }

  const enable = content.includes("켜") || content.includes("활성화") || content.includes("사용");
  const disable = content.includes("꺼") || content.includes("비활성화") || content.includes("막아") || content.includes("차단");
  if (!enable && !disable) return false;

  await NatsumiGuildSetup.findOneAndUpdate(
    { guildId: message.guild.id },
    { guildId: message.guild.id, aiGlobalEnabled: enable },
    { upsert: true, new: true }
  );

  await ProcessedMessage.findOneAndUpdate(
    { messageId: message.id },
    { $setOnInsert: { messageId: message.id, processedAt: new Date() } },
    { upsert: true, new: false }
  ).catch(() => {});

  await message.reply({
    content: enable
      ? "✅ 일반 채널에서도 나츠미 호출어를 사용할 수 있게 켰어. 그래도 너무 막 부르진 마 😤"
      : "✅ 일반 채널 호출어를 껐어. 이제 AI채팅 채널에서만 부를 수 있어 😼",
    allowedMentions: { repliedUser: false },
  }).catch(() => {});
  return true;
};

export default {
  name: Events.MessageCreate,
  async execute(message, client) {
    if (!message.guild || message.author.bot) return;
    if (!isCalled(message, client)) return;

    const setup = await NatsumiGuildSetup.findOne({ guildId: message.guild.id }).lean().catch(() => null);
    const handledAdminMode = await handleAdminMode(message, setup);
    if (handledAdminMode) return;

    if (!setup?.aiChannelIds?.length) return;
    if (setup.aiGlobalEnabled) return;

    const allowed = setup.aiChannelIds.includes(message.channel.id);
    if (allowed) return;

    await ProcessedMessage.findOneAndUpdate(
      { messageId: message.id },
      { $setOnInsert: { messageId: message.id, processedAt: new Date() } },
      { upsert: true, new: false }
    ).catch(() => {});

    const canSend = message.channel.permissionsFor(client.user)?.has(PermissionFlagsBits.SendMessages);
    if (!canSend) return;

    const aiMention = setup.aiChannelIds.map((id) => `<#${id}>`).join(", ");
    await message.reply({
      content: `나츠미 호출은 ${aiMention} 에서만 가능해. 일반 채널에서도 쓰고 싶으면 \`/나츠미 일반채팅 켜기\`를 사용해줘 😤`,
      allowedMentions: { repliedUser: false },
    }).catch(() => {});
  },
};
