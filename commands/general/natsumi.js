import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from "discord.js";
import NatsumiGuildSetup from "../../models/NatsumiGuildSetup.js";
import { createNatsumiChannels } from "../../utils/natsumiChannelSetup.js";

export default {
  data: new SlashCommandBuilder()
    .setName("나츠미")
    .setDescription("나츠미 전용 서버 설정을 관리해요.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName("자동셋업")
        .setDescription("카미봇처럼 나츠미 전용 채널을 자동으로 생성합니다.")
    )
    .addSubcommandGroup((group) =>
      group
        .setName("일반채팅")
        .setDescription("AI 호출어를 일반 채널에서도 사용할지 설정합니다.")
        .addSubcommand((sub) => sub.setName("켜기").setDescription("일반 채널에서도 나츠미 호출어를 허용합니다."))
        .addSubcommand((sub) => sub.setName("끄기").setDescription("AI채팅 채널에서만 나츠미 호출어를 허용합니다."))
    )
    .addSubcommand((sub) =>
      sub
        .setName("상태")
        .setDescription("현재 나츠미 채널 설정 상태를 확인합니다.")
    ),

  async execute(interaction) {
    const group = interaction.options.getSubcommandGroup(false);
    const sub = interaction.options.getSubcommand();

    if (sub === "자동셋업") {
      await interaction.deferReply({ ephemeral: true });
      const result = await createNatsumiChannels(interaction.guild, interaction.user.id);

      if (result.already) {
        return interaction.editReply("이미 나츠미 채널 구성이 만들어져 있어. 또 만들면 복잡해지거든 😤");
      }

      return interaction.editReply([
        "✅ 나츠미 전용 채널을 만들었어!",
        "🤖 AI채팅 채널에서만 `나츠미` 호출어가 기본 동작해.",
        "일반 채널에서도 쓰고 싶으면 `/나츠미 일반채팅 켜기`를 사용해줘.",
      ].join("\n"));
    }

    if (group === "일반채팅") {
      const enabled = sub === "켜기";
      await NatsumiGuildSetup.findOneAndUpdate(
        { guildId: interaction.guildId },
        { guildId: interaction.guildId, aiGlobalEnabled: enabled },
        { upsert: true, new: true }
      );

      return interaction.reply({
        content: enabled
          ? "✅ 이제 일반 채널에서도 나츠미 호출어를 사용할 수 있어. 그래도 너무 막 부르진 마 😤"
          : "✅ 이제 AI채팅 채널에서만 나츠미 호출어가 동작해. 질서정연해서 좋네 😼",
        ephemeral: true,
      });
    }

    if (sub === "상태") {
      const setup = await NatsumiGuildSetup.findOne({ guildId: interaction.guildId }).lean();
      const aiChannels = setup?.aiChannelIds?.length ? setup.aiChannelIds.map((id) => `<#${id}>`).join(", ") : "미설정";

      const embed = new EmbedBuilder()
        .setColor("#ff7aa8")
        .setTitle("🦊 나츠미 설정 상태")
        .addFields(
          { name: "AI채팅 채널", value: aiChannels, inline: false },
          { name: "일반채팅 호출어", value: setup?.aiGlobalEnabled ? "켜짐" : "꺼짐", inline: true },
          { name: "자동셋업", value: setup?.featureCategoryId ? "완료" : "미완료", inline: true }
        )
        .setTimestamp();

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
