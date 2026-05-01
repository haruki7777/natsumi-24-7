const { ActivityType } = require("discord.js");

module.exports = {
  name: "ready",
  once: true,
  execute(client) {
    let number = 0
    setInterval(() => {
        const list = ["나츠미 버전 V2",`냐하핫 현재 ${client.guilds.cache.size} 개의 서버에서 운영 중이야!!` ,"꾸벅꾸벅조는중", "/도움말","멍때리는중","귀여운 냥이 보는중", "몰래 훔쳐먹는중"] 
        if(number == list.length) number = 0
        client.user.setActivity(list[number],{
            type: ActivityType.Playing
        })
        number++
    }, 10000)
    console.log(`${client.user.tag} 봇 이 준비되었습니다.`)
  },
};