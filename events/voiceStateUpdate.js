// Events/voiceStateUpdate.js
import Schema from "../models/privateVoice.js";
import { ChannelType, PermissionFlagsBits } from "discord.js";

// 생성된 방 추적 전용 맵 (channelId -> ownerId)
const CreatedByBot = new Map();
// 유저별 현재 생성된 방 ID (userId -> channelId)
const UserActiveRoom = new Map();
// 생성 진행 중인 유저 잠금 (userId -> expiry timestamp)
const CreationLock = new Map();

export default {
    name: "voiceStateUpdate",
    /**
     * @param {import("discord.js").VoiceState} oldstate
     * @param {import("discord.js").VoiceState} newstate
     */
    async execute(oldstate, newstate) {
        const { guild, member } = newstate;
        if (!guild || !member || member.user.bot) return;

        const oldId = oldstate.channelId;
        const newId = newstate.channelId;

        // 마이크/스피커 상태 변화 등 이동이 아닌 경우는 무시
        if (oldId === newId) return;

        const now = Date.now();

        // --- [1] 방 생성 로직 (트리거 채널 입장 시) ---
        if (newId) {
            // 1-1. 스팸 방지 잠금 (10초간 무시)
            const lockExpiry = CreationLock.get(member.id);
            if (lockExpiry && lockExpiry > now) return;

            // 트리거 설정 확인
            const trigger = await Schema.findOne({
                guildId: guild.id,
                channelId: newId,
            }).lean();

            if (trigger) {
                // 즉시 생성 잠금 설정
                CreationLock.set(member.id, now + 10000); 

                try {
                    // 1-2. 중복 생성 완벽 차단
                    let existingRoom = null;
                    const existingId = UserActiveRoom.get(member.id);
                    
                    if (existingId) {
                        existingRoom = guild.channels.cache.get(existingId) || await guild.channels.fetch(existingId).catch(() => null);
                    }

                    // 카테고리를 직접 뒤져서 소유 채널이 있는지 최종 확인 (캐시 불일치 방지)
                    if (!existingRoom) {
                        existingRoom = guild.channels.cache.find(c => 
                            c.parentId === trigger.categoryId && 
                            c.type === ChannelType.GuildVoice &&
                            c.permissionOverwrites.cache.get(member.id)?.allow.has(PermissionFlagsBits.ManageChannels)
                        );
                    }

                    if (existingRoom) {
                        // 이미 방이 있다면 맵 업데이트 및 이동
                        UserActiveRoom.set(member.id, existingRoom.id);
                        CreatedByBot.set(existingRoom.id, member.id);
                        
                        if (member.voice.channelId !== existingRoom.id) {
                            await member.voice.setChannel(existingRoom).catch(() => {});
                        }
                        return;
                    }

                    // 1-3. 트리거 세팅 추출 (트리거 채널의 설정을 실시간으로 훔쳐옴)
                    let limitToSet = 0;
                    let bitrateToSet = 64000;
                    
                    try {
                        // API 싱크 대기를 위해 아주 짧은 지연 후 패치
                        await new Promise(r => setTimeout(r, 300));
                        
                        // 트리거 채널 정보를 API에서 강제로 다시 가져와서 사용자가 최근에 바꾼 인원제한을 반영함
                        const triggerData = await guild.channels.fetch(newId, { force: true });
                        limitToSet = triggerData.userLimit ?? 0;
                        bitrateToSet = triggerData.bitrate ?? 64000;
                    } catch (e) {
                        limitToSet = newstate.channel?.userLimit ?? 0;
                        bitrateToSet = newstate.channel?.bitrate ?? 64000;
                    }

                    console.log(`[개인채널 시스템] ${member.user.tag} 입장. 감지된 인원제한: ${limitToSet}`);

                    // 1-4. 방 이름 설정
                    const channelName = trigger.name.replace(/{user}/g, member.user.username);

                    // 1-5. 채널 생성 (생성 시 옵션 포함)
                    const privateRoom = await guild.channels.create({
                        name: channelName,
                        parent: trigger.categoryId,
                        type: ChannelType.GuildVoice,
                        bitrate: bitrateToSet,
                        userLimit: limitToSet, 
                        reason: `Natsumi: ${member.user.tag} 개인 채널 (트리거 인원제한: ${limitToSet})`
                    });

                    // 1-6. 생성 직후 즉시 한 번 더 수정 (확실한 동기화)
                    await privateRoom.edit({
                        userLimit: limitToSet,
                        bitrate: bitrateToSet
                    }).catch(() => {});

                    // 1-7. 소유자 권한 부여
                    await privateRoom.permissionOverwrites.edit(member.id, {
                        ManageChannels: true,
                        Connect: true,
                        Speak: true,
                        MoveMembers: true,
                        MuteMembers: true,
                        DeafenMembers: true,
                        PrioritySpeaker: true,
                        Stream: true
                    });

                    // 생성 1초 후 마지막으로 설정을 한 번 더 체크 및 수정 (장치별 렉 방지)
                    setTimeout(async () => {
                        try {
                            const chan = await guild.channels.fetch(privateRoom.id).catch(() => null);
                            if (chan && chan.userLimit !== limitToSet) {
                                await chan.edit({ userLimit: limitToSet }).catch(() => {});
                                console.log(`[개인채널] 인원제한 재보정 완료: ${limitToSet}`);
                            }
                        } catch (e) {}
                    }, 1000);
                    // 1-7. 트래킹 시스템 등록
                    UserActiveRoom.set(member.id, privateRoom.id);
                    CreatedByBot.set(privateRoom.id, member.id);

                    // 1-8. 유저 이동 (0.8초 지연으로 API 반영 대기)
                    setTimeout(async () => {
                        try {
                            const freshMember = await guild.members.fetch(member.id).catch(() => null);
                            if (freshMember && freshMember.voice.channelId === newId) {
                                await freshMember.voice.setChannel(privateRoom).catch(async () => {
                                    // 이동 실패 시 (방이 풀방이거나 유저가 튕김) 빈 채널이면 삭제
                                    if (privateRoom.members.size === 0) {
                                        await privateRoom.delete().catch(() => {});
                                    }
                                });
                            } else if (!freshMember || freshMember.voice.channelId !== privateRoom.id) {
                                // 유저가 생성기에는 있는데 방에는 안 들어간 경우 (또는 도망간 경우)
                                if (privateRoom.members.size === 0) {
                                    await privateRoom.delete().catch(() => {});
                                    CreatedByBot.delete(privateRoom.id);
                                    if (UserActiveRoom.get(member.id) === privateRoom.id) UserActiveRoom.delete(member.id);
                                }
                            }
                        } catch (e) {}
                    }, 800);

                } catch (error) {
                    console.error("[개인 채널 생성 실패]", error);
                    CreationLock.delete(member.id);
                }
            }
        }

        // --- [2] 채널 삭제 로직 (유저가 방에서 나갈 때) ---
        if (oldId) {
            const oldChannel = oldstate.channel || await guild.channels.fetch(oldId).catch(() => null);
            if (!oldChannel || oldChannel.type !== ChannelType.GuildVoice) return;

            // 해당 방의 카테고리가 봇이 관리하는 카테고리인지 확인
            const triggerConf = await Schema.findOne({ categoryId: oldChannel.parentId }).lean();
            
            // 트리거 채널 자체가 아니고, 관리 카테고리 내의 방이 비었을 때 삭제
            if (triggerConf && oldId !== triggerConf.channelId) {
                
                // 3초 대기 후 최종 인원 확인 (재접속 고려)
                setTimeout(async () => {
                    try {
                        const checkChan = await guild.channels.fetch(oldId).catch(() => null);
                        if (checkChan && checkChan.members.size === 0) {
                            const ownerId = CreatedByBot.get(oldId);
                            
                            // 방 삭제
                            await checkChan.delete().catch(() => {});
                            
                            // 데이터 정리
                            CreatedByBot.delete(oldId);
                            if (ownerId && UserActiveRoom.get(ownerId) === oldId) {
                                UserActiveRoom.delete(ownerId);
                            }
                        }
                    } catch (e) {
                         CreatedByBot.delete(oldId);
                    }
                }, 3000);
            }
        }
    }
};
