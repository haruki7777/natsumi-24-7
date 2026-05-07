import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder,
  } from "discord.js";
  
  import featuresDB from "../../models/Features.js";
  
  export default {
    data: new SlashCommandBuilder()
      .setName("레벨설정")
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .setDescription("우리 숲의 서열 시스템을 관리할 거야! 콘콘!")
      .addStringOption((option) =>
        option
          .setName("상태")
          .setDescription("시스템을 작동시킬까?")
          .addChoices({ name: "작동(ON)", value: "온" }, { name: "중단(OFF)", value: "오프" })
      )
      .addStringOption((option) =>
        option
          .setName("배경화면")
          .setDescription(
            "서열 카드의 배경을 바꿔봐! (이미지 주소여야 해!)"
          )
          .setMinLength(2)
      ),
    /**
     *
     * @param {ChatInputCommandInteraction} interaction
     */
    async execute(interaction) {
      await interaction.deferReply();
      const { options, guild } = interaction;
  
      const Response = new EmbedBuilder()
        .setColor(`#FF8C00`)
        .setTitle("🏮 서열 시스템 설정")
        .setTimestamp(Date.now())
        .setDescription("여기서 현재 숲의 서열 설정을 볼 수 있어!");
  
      const background = options.getString("배경화면");
      const level_enabled = await featuresDB.findOne({ GuildID: guild.id });
      if (level_enabled) {
        const { LevelSystem } = level_enabled;
  
        if (background) {
          if (isValidHttpUrl(background)) {
            await featuresDB.findOneAndUpdate(
              { GuildID: guild.id },
              {
                $set: { "LevelSystem.Background": background }
              },
              { upsert: true }
            );
  
            Response.setDescription("🖼️ 새로운 풍경(배경)으로 바꿨어! 콘콘!").setImage(
              background
            );
          } else {
            Response.setDescription("❌ `배경화면`은 제대로 된 링크여야 한다구! 바보야?");
            return interaction.editReply({
              embeds: [Response],
              ephemeral: true,
            });
          }
        }
  
        switch (options.getString("상태")) {
          case "온":
            {
              await featuresDB.findOneAndUpdate(
                { GuildID: guild.id },
                {
                  $set: { "LevelSystem.Enabled": true }
                },
                { upsert: true }
              );
  
              Response.setDescription(
                "✅ 이제부터 활동하면 서열이 오를 거야! 콘콘!"
              );
            }
            break;
  
          case "오프":
            {
              await featuresDB.findOneAndUpdate(
                { GuildID: guild.id },
                {
                  $set: { "LevelSystem.Enabled": false }
                },
                { upsert: true }
              );
  
              Response.setDescription(
                "✅ 서열 경쟁을 멈췄어. 다들 평화롭게 지내라구! 흥!"
              );
            }
            break;
        }
      } else {
        await featuresDB.findOneAndUpdate(
          { GuildID: guild.id },
          {
            LevelSystem: {
              Enabled: false,
              Background:
                "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=1000&auto=format&fit=crop",
            },
          },
          { new: true, upsert: true }
        );
        Response.setDescription(
          "서열 시스템을 먼저 초기화했어. `/레벨설정 상태: 온`으로 시스템을 켜보든가! 배경은 `/레벨설정 배경화면:`으로 바꾸면 돼. 콘콘!"
        );
      }
  
      await interaction.editReply({ embeds: [Response], ephemeral: true });
    },
  };
  
  function isValidHttpUrl(string) {
    let url;
  
    try {
      url = new URL(string);
    } catch (_) {
      return false;
    }
  
    return url.protocol === "https:" || url.protocol === "http:";
  }
  