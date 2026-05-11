import { Events, PermissionFlagsBits } from "discord.js";
import NatsumiGuildSetup from "../models/NatsumiGuildSetup.js";
import ProcessedMessage from "../models/ProcessedMessage.js";

const CALLWORDS = ["나츠미", "나쯔미", "낫쯔미", "츠미짱", "츠미야", "나츠", "나츠짱", "츠미"];

const isCalled = (message, client) => {
  const content = (message.content || "").trim().toLowerCase();
  return message.mentions.has(client.user.id) || CALLWORDS.some((word) => content.includes(word.toLowerCase()));
};

export default {
  name: Events.MessageCreate,
  async execute(message, client) {
    if (!message.guild || message.author.bot) return;
    if (!isCalled(message, client)) return;

    const setup = await NatsumiGuildSetup.findOne({ guildId: message.guild.id }).lean().catch(() => null);
    if (!setup?.aiChannelIds?.length) return;

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
      content: `나츠미 호출은 ${aiMention} 에서만 가능해. 아무 데서나 부르지 말라구, 흥 😤`,
      allowedMentions: { repliedUser: false },
    }).catch(() => {});
  },
};
