//Events 폴더에 넣어주세요
const Channel_delete = "2"; //생성된 채널에서 유저가 나갔을 때 몇 초 안에 다시 안 들어오면 채널이 삭제되게 할 건가요? 1 = 1초
if (!Channel_delete) {
  return console.log("음성채널 생성 코드 에러 : 음성채널 세팅을 완료해 주세요");
}

import Schema from "../models/privateVoice.js";
import { ChannelType } from "discord.js";
const Channel_list = new Set();
export default {
  name: "voiceStateUpdate",
  /**
   *
   * @param {import("discord.js").VoiceState} oldstate
   * @param {import("discord.js").VoiceState}  newstate
   */
  async execute(oldstate, newstate) {
    if (newstate.channel && !oldstate.channel) {
      //유저가 들어왔을 때 실행되는 코드
      const find = await Schema.findOne({
        guildId: newstate.guild.id,
        channelId: newstate.channelId,
      });
      if (!find) return;
      const channel = await newstate.guild.channels.create({
        name: `${find.name.replace(/{user}/g, newstate.member.user.username)}`,
        parent: find.categoryId,
        type: ChannelType.GuildVoice,
        bitrate: newstate.channel.bitrate,
      });
      await channel.permissionOverwrites.edit(newstate.member.user.id, {
        ManageChannels: true,
      });
      await newstate.member?.voice.setChannel(channel);
      Channel_list.add(channel.id);
      return;
    }
    if (!newstate.channel && oldstate.channel) {
      //유저가 나갔을 때 실행되는 코드
      if (!Channel_list.has(oldstate.channelId)) return;
      if (oldstate.channel?.members.size == 0) {
        setTimeout(() => {
          if (oldstate.channel?.members.size == 0) {
            oldstate.channel.delete();
            Channel_list.delete(oldstate.channel.id);
          }
        }, Number(Channel_delete) * 1000);
      }
      return;
    }
  },
};