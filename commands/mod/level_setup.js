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
      .setDescription("레벨업 설정을 한다냐")
      .addStringOption((option) =>
        option
          .setName("상태")
          .setDescription("시스템을 킨다냥")
          .addChoices({ name: "온", value: "온" }, { name: "오프", value: "오프" })
      )
      .addStringOption((option) =>
        option
          .setName("배경화면")
          .setDescription(
            "랭킹 배경을 바꾼다냥! (유효한 링크여야한다냥! )"
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
        .setColor(`Orange`)
        .setTitle("✨ 설정")
        .setTimestamp(Date.now())
        .setDescription("여기서 현재 설정을 볼 수 있습니다!");
  
      const background = options.getString("배경화면");
      const level_enabled = await featuresDB.findOne({ GuildID: guild.id });
      if (level_enabled) {
        const { LevelSystem } = level_enabled;
  
        if (background) {
          if (isValidHttpUrl(background)) {
            await featuresDB.findOneAndUpdate(
              { GuildID: guild.id },
              {
                LevelSystem: {
                  Enabled: LevelSystem ? LevelSystem.Enabled : false,
                  Background: background,
                },
              },
              { new: true, upsert: true }
            );
  
            Response.setDescription("🖼️ 새로운 배경화면 설정!").setImage(
              background
            );
          } else {
            Response.setDescription("❌ `배경화면` 유효한 링크여야 한다냥!");
            return interaction.reply({
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
                  LevelSystem: {
                    Enabled: true,
                    Background: LevelSystem
                      ? LevelSystem.Background
                      : "https://cdn.discordapp.com/attachments/965674056080826368/1003622130921001040/background.png",
                  },
                },
                { new: true, upsert: true }
              );
  
              Response.setDescription(
                "✅ 레벨 시스템을 성공적으로 활성화했다냥!"
              );
            }
            break;
  
          case "오프":
            {
              await featuresDB.findOneAndUpdate(
                { GuildID: guild.id },
                {
                  LevelSystem: {
                    Enabled: false,
                    Background: LevelSystem
                      ? LevelSystem.Background
                      : "https://cdn.discordapp.com/attachments/965674056080826368/1003622130921001040/background.png",
                  },
                },
                { new: true, upsert: true }
              );
  
              Response.setDescription(
                "✅ 레벨 시스템을 성공적으로 비활성화했다냥!"
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
                "https://cdn.discordapp.com/attachments/965674056080826368/1003622130921001040/background.png",
            },
          },
          { new: true, upsert: true }
        );
        Response.setDescription(
          "레벨 시스템을 설정하고, `/레벨설정 상태: 온`을 사용하여 키라냥,  '/레벨설정 배경화면: 'url''을 사용하여 랭크카드 배경을 변경하라냥!"
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
  