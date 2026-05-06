import { ActivityType } from "discord.js";

export default {
  name: "ready",
  once: true,
  execute(client) {
    let number = 0
    setInterval(() => {
        const list = [
            "여우 숲의 여왕",
            `콘콘! ${client.guilds.cache.size}개 숲을 감시 중!`,
            "꼬리 손질하는 중",
            "/도움말 (흥, 가르쳐줄게!)",
            "인간들 구경하는 중",
            "유부초밥 훔쳐먹는 중",
            "흥! 착각하지 마!"
        ] 
        if(number == list.length) number = 0
        client.user.setActivity(list[number],{
            type: ActivityType.Custom
        })
        number++
    }, 10000)
    console.log(`${client.user.tag} 봇이 준비되었습니다. 콘콘!`)
  },
};