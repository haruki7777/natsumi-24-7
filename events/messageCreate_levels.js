import { Events, EmbedBuilder } from 'discord.js';
import featuresSchema from '../models/Features.js';
import levelSchema from '../models/LevelSystem.js';

export default {
  name: Events.MessageCreate,
  async execute(message) {
    if (message.author.bot || !message.guild) return;

    const guildConfig = await featuresSchema.findOne({ GuildID: message.guild.id });
    if (!guildConfig || !guildConfig.LevelSystem?.Enabled) return;

    const xpToAdd = 5;
    const result = await levelSchema.findOneAndUpdate(
      { GuildID: message.guild.id, UserID: message.author.id },
      { $inc: { xp: xpToAdd } },
      { upsert: true, new: true }
    );

    const neededXP = result.level * result.level * 100;
    if (result.xp >= neededXP) {
      await levelSchema.updateOne(
        { GuildID: message.guild.id, UserID: message.author.id },
        { $inc: { level: 1 }, $set: { xp: 0 } }
      );

      const embed = new EmbedBuilder()
        .setTitle("🎉 레벨 업!")
        .setDescription(`${message.author.username}님, 축하한다냥! **레벨 ${result.level + 1}**이(가) 되었다냥!`)
        .setColor("Orange");
      
      message.reply({ embeds: [embed] }).catch(() => {});
    }
  }
};
