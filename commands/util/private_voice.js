import { 
  SlashCommandBuilder, 
  ChannelType, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  StringSelectMenuBuilder,
  PermissionFlagsBits
} from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("개인음성채널")
    .setDescription("개인 음성 채널 생성 시스템을 자동으로 구축합니다.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  /**
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("🏮 개인 음성 채널 시스템")
      .setDescription(
        "아래 버튼을 누르면 시스템이 자동으로 구축됩니다.\n\n" +
        "1. 전용 카테고리가 생성됩니다.\n" +
        "2. `➕ 대화방 생성` 채널이 만들어집니다.\n" +
        "3. **관리자님이 이 채널의 인원 제한을 수정하면**, 생성되는 방들도 그 인원수를 따라가요!\n" +
        "4. 채널에 입장하면 개인 방이 생기고, 모두 나가면 자동으로 사라집니다."
      )
      .setColor("#FF8C00")
      .setFooter({ text: "나츠미의 마법으로 순식간에 만들어줄게! 콘콘!" });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("privateVoiceSetup")
        .setLabel("자동 시스템 구축하기")
        .setStyle(ButtonStyle.Success)
        .setEmoji("🏮")
    );
    const limitRow = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("privateVoiceSetup_limit")
        .setPlaceholder("추가할 인원 제한 방 선택")
        .addOptions(
          { label: "2인방", value: "2", description: "기존 카테고리에 2인 트리거를 추가합니다." },
          { label: "5인방", value: "5", description: "기존 카테고리에 5인 트리거를 추가합니다." },
          { label: "10인방", value: "10", description: "기존 카테고리에 10인 트리거를 추가합니다." }
        )
    );

    await interaction.reply({ embeds: [embed], components: [row, limitRow] });
  },
};
