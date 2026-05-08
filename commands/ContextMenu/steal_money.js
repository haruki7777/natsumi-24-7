import {
    ContextMenuCommandBuilder,
    ApplicationCommandType,
    EmbedBuilder,
  } from "discord.js";
  import dobak_Schema from "../../models/dobak.js";
  import { addXP } from "../../events/levels.js";
  
  export default {
    data: new ContextMenuCommandBuilder()
      .setName("돈 서리하기")
      .setType(ApplicationCommandType.Message),
    /**
     * @param {import("discord.js").MessageContextMenuCommandInteraction} interaction
     */
    async execute(interaction) {
      if (!interaction.deferred && !interaction.replied) await interaction.deferReply({ ephemeral: true });
  
      const targetUser = interaction.targetMessage.author;
      const executor = interaction.user;
  
      if (targetUser.id === executor.id) {
        return interaction.editReply({ content: "❌ **자신의 지갑을 서리하겠다구? 바보야? 그건 그냥 주머니 옮기기잖아!**" });
      }
  
      if (targetUser.bot) {
        return interaction.editReply({ content: "❌ **봇의 지갑은 텅 비어있어! 쇠붙이밖에 안 나올걸?**" });
      }
  
      // Fetch both users data
      const executorData = await dobak_Schema.findOne({ userid: executor.id });
      const targetData = await dobak_Schema.findOne({ userid: targetUser.id });
  
      if (!executorData) {
        return interaction.editReply({ content: "❌ **너는 아직 빈털터리잖아! `/출석체크`부터 하고 오라구!**" });
      }
  
      if (!targetData || targetData.money < 1000) {
        return interaction.editReply({ content: "❌ **상대방이 너무 가난해서 털어갈 게 없어... 불쌍하지도 않아? 콘콘!**" });
      }
  
      const chance = Math.random() * 100;
      const success = chance <= 15; // 15% success rate (85% fail)
  
      if (success) {
        // Success: Steal 1% ~ 5% of target's money
        const stealPercent = (Math.random() * 4 + 1) / 100;
        const stealAmount = Math.floor(targetData.money * stealPercent);
        const finalSteal = Math.min(stealAmount, 50000); // 캡(Cap) 5만원
  
        await dobak_Schema.updateOne({ userid: executor.id }, { $inc: { money: finalSteal } });
        await dobak_Schema.updateOne({ userid: targetUser.id }, { $inc: { money: -finalSteal } });
  
        // Award some XP for "stealth"
        if (interaction.guildId) await addXP(interaction.guildId, executor.id, 30, interaction);
  
        const embed = new EmbedBuilder()
          .setTitle("🧤 서리 대성공! (살금살금)")
          .setDescription(`**${targetUser.username}**의 지갑에서 몰래 \`${finalSteal.toLocaleString()}\`금전을 빼냈어!\n\n나츠미는 아무것도 못 본 걸로 해줄게... (흥!)`)
          .addFields(
            { name: "💰 획득 금액", value: `\`+${finalSteal.toLocaleString()}\` 금전`, inline: true },
            { name: "💳 현재 주머니", value: `\`${(executorData.money + finalSteal).toLocaleString()}\` 금전`, inline: true }
          )
          .setColor("#2ECC71")
          .setThumbnail("https://cdn-icons-png.flaticon.com/512/1000/1000946.png")
          .setTimestamp();
  
        return interaction.editReply({ embeds: [embed] });
      } else {
        // Failure: Pay fine (20% of executor's money or min 2000)
        const fine = Math.max(2000, Math.floor(executorData.money * 0.05));
        const finalFine = Math.min(fine, 30000); // 캡(Cap) 3만원
  
        await dobak_Schema.updateOne({ userid: executor.id }, { $inc: { money: -finalFine } });
        await dobak_Schema.updateOne({ userid: targetUser.id }, { $inc: { money: finalFine } });
  
        const embed = new EmbedBuilder()
          .setTitle("🚨 서리 실패! (딱 걸렸어!)")
          .setDescription(`**${targetUser.username}**의 지갑을 건드리다가 나츠미한테 딱 걸렸네!!\n\n합의금으로 \`${finalFine.toLocaleString()}\`금전을 상대방에게 줬어. ㅋㅋㅋㅋ 꼴좋다구!`)
          .addFields(
            { name: "💸 지출 금액", value: `\`-${finalFine.toLocaleString()}\` 금전`, inline: true },
            { name: "💳 현재 주머니", value: `\`${(executorData.money - finalFine).toLocaleString()}\` 금전`, inline: true }
          )
          .setColor("#E74C3C")
          .setThumbnail("https://cdn-icons-png.flaticon.com/512/252/252030.png")
          .setTimestamp();
  
        return interaction.editReply({ embeds: [embed] });
      }
    },
  };
