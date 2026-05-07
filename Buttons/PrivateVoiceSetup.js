import { ChannelType, PermissionFlagsBits } from "discord.js";
import Schema from "../models/privateVoice.js";

export default {
  name: "privateVoiceSetup",
  /**
   * @param {import("discord.js").ButtonInteraction} interaction
   */
  async execute(interaction) {
    // 권한 확인 (관리자만 실행 가능하도록)
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: "❌ **흥! 이 작업은 서버 관리자님만 할 수 있어!**", ephemeral: true });
    }

    // 중복 방지를 위해 업데이트 처리
    await interaction.deferUpdate();

    try {
      const guild = interaction.guild;
      
      // 기존 설정 확인
      const existingSetup = await Schema.findOne({ guildId: guild.id });
      let category = null;
      let trigger = null;

      if (existingSetup) {
        category = guild.channels.cache.get(existingSetup.categoryId) || await guild.channels.fetch(existingSetup.categoryId).catch(() => null);
        trigger = guild.channels.cache.get(existingSetup.channelId) || await guild.channels.fetch(existingSetup.channelId).catch(() => null);
      }

      if (category && trigger) {
        // 이미 구축된 경우에도 기존 설정 메시지는 삭제
        await interaction.message.delete().catch(() => {});
        
        return interaction.followUp({
          content: "⚠️ **이미 시스템이 구축되어 있어! 한 서버에 하나만 만들 수 있거든!**",
          ephemeral: true
        });
      }

      // 1. 카테고리 없으면 생성
      if (!category) {
        category = await guild.channels.create({
          name: "🏮 개인 음성 채널",
          type: ChannelType.GuildCategory,
          reason: "개인 음성 채널 자동 구축"
        });
      }

      // 2. 트리거 채널(생성기) 없으면 생성
      if (!trigger) {
        trigger = await guild.channels.create({
          name: "➕ 대화방 생성",
          type: ChannelType.GuildVoice,
          parent: category.id,
          userLimit: 0, 
          reason: "개인 음성 채널 자동 구축"
        });
      }

      // 3. DB에 설정 저장 (기존 설정이 있다면 채널 정보만 정확히 갱신)
      await Schema.findOneAndUpdate(
        { guildId: guild.id },
        { 
          categoryId: category.id, 
          channelId: trigger.id,
          name: "{user}의 대화방"
        },
        { upsert: true, new: true }
      );

      // 성공 시 기존 설정 메시지 삭제
      await interaction.message.delete().catch(() => {});

      // 임시 메시지로 성공 알림
      await interaction.followUp({
        content: `**✅ ${category} 카테고리에 개인 음성 시스템 구축을 완료했어!**\n` +
                 `이제 '${trigger.name}' 채널의 **[인원 제한]** 설정을 관리자님이 앱에서 직접 수정하면, 생성되는 모든 방이 그 숫자를 따라갈 거야!`,
        ephemeral: true
      });

    } catch (error) {
      console.error("[Private Voice Setup Button Error]", error);
      await interaction.followUp({
        content: "❌ **으윽... 채널을 만드는 도중에 오류가 발생했어. 나에게 '채널 관리' 권한이 있는지 확인해 줘!**",
        ephemeral: true
      });
    }
  }
};
