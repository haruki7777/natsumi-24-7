import DashboardSettings from "../models/DashboardSettings.js";

const normalize = (value = "") => String(value).trim().toLowerCase();

export async function getGuildDashboardSettings(guildId) {
  if (!guildId) return null;
  return DashboardSettings.findOne({ guildId }).lean().catch(() => null);
}

export async function isCommandDisabled(guildId, commandName) {
  const settings = await getGuildDashboardSettings(guildId);
  if (!settings?.disabledCommands?.length) return false;
  const command = normalize(commandName);
  return settings.disabledCommands.map(normalize).includes(command);
}

export function resolveWelcomeText(template = "", member) {
  const guild = member.guild;
  const created = Math.floor(member.user.createdTimestamp / 1000);
  const joined = Math.floor(Date.now() / 1000);
  const vars = {
    "{user}": member.user.username,
    "{user.name}": member.user.username,
    "{user.tag}": member.user.tag,
    "{user.id}": member.user.id,
    "{user.mention}": `<@${member.user.id}>`,
    "{server}": guild.name,
    "{server.name}": guild.name,
    "{server.id}": guild.id,
    "{server.count}": String(guild.memberCount ?? "알 수 없음"),
    "{member.count}": String(guild.memberCount ?? "알 수 없음"),
    "{account.created}": `<t:${created}:R>`,
    "{joined.at}": `<t:${joined}:R>`,
    "{owner.id}": guild.ownerId || "",
    "{random.welcome}": ["어서 와!", "잘 왔어!", "기다렸잖아.", "환영해!"][Math.floor(Math.random() * 4)],
  };
  return Object.entries(vars).reduce((text, [key, value]) => text.split(key).join(value), template || "");
}
