import { CQWebSocket } from 'cq-websocket'
import { config, CoolQSourceMap } from './Configs/config'
import { MsgJson } from './proto/MsgJson';
import { Appendix } from './Appendix/Image'
import unescape from './util/unescape'
import CQCodeUtil from './util/CQCodeUtil'
//import { Msg } from './proto/msg-compiled';
const CQ_PLACEHOLDER = ''
export class Bot {
    private static readonly bot: CQWebSocket = new CQWebSocket(config.webSocket);
    static init() {
        Bot.bot.connect()
            .on('ready', () => {
                console.log('CQ connected')
                Bot.sendPrivateMsg(config.adminId, 'CQ connected')
            }).on('message.group', (e, ctx, tag) => {
                let source = CoolQSourceMap.get(ctx.group_id)
                if (source) {
                    e.stopPropagation()
                    new Promise(async (resolve, reject) => {
                        let contents: Array<string> = [], appendixes = new Array<MsgJson.IAppendix>()
                            , promiseGroup = [], prefix
                        promiseGroup.push(new Promise(async (resolve) => {
                            prefix = `${(await Bot.getGroupInfo(ctx.group_id))['data']['group_name']}<${ctx.group_id}>${(await Bot.getGroupMemberInfo(ctx.user_id, ctx.group_id))['data']['card']}`
                            resolve()
                        }))
                        if (typeof ctx.message == "string") {
                            CQCodeUtil.decodeAllCQCode(ctx.message).map((v, i) => {
                                promiseGroup.push(Bot.messageTransform(v, contents, appendixes, i))
                            })
                        } else {
                            if (Array.isArray(ctx.message)) {//消息数组
                                ctx.message.map((v, k) => {
                                    promiseGroup.push(Bot.messageTransform(v, contents, appendixes, k))
                                })
                                /* } else if (ctx.message.type) {//单个message段
                                    promiseGroup.push(Bot.messageTransform(ctx.message, contents, appendixes,0))
                                } */
                            }
                        }
                        await Promise.all(promiseGroup)
                        source.send(//Msg.create({
                            {
                                prefix: prefix,
                                contents: contents,
                                appendix: appendixes.filter((v)=>{return v?true:false}),//appendix
                            })//)
                        resolve()
                    })
                }
            })

    }
    static async sendGroupMsg(groupId: number, message: string | string[]) {
        return Bot.bot('send_group_msg', { group_id: groupId, message: message }, { timeout: 10000 })
            .then((res) => {
                //res.status TODO
                console.log(`CQ:send ${message} to ${groupId},return ${res.status}`)
                console.log(res)
            })
    }
    static sendMsgToGroups(groupIds: number[], message: string | string[]) {
        groupIds.forEach((value) => {
            Bot.sendGroupMsg(value, message)
        })
    }
    static async sendPrivateMsg(userId: number, message: string) {
        return Bot.bot('send_private_msg', { user_id: userId, message: message })
            .then((res) => {
                console.log(`CQ:send ${message} to ${userId},return ${res}`)

            })
    }
    static async getGroupInfo(groupId: number, noCache: boolean = false) {
        return Bot.bot<Object>('get_group_info', { group_id: groupId, no_cache: noCache })
    }
    static async getGroupMemberInfo(userId: number, groupId: number, noCache: boolean = false) {
        return Bot.bot<Object>('get_group_member_info', { group_id: groupId, user_id: userId, no_cache: noCache })
    }
    private static async messageTransform(message, contents: Array<string>, appendixes: Array<MsgJson.IAppendix>, index: number) {
        switch (message.type) {
            case 'image':
                appendixes[index] = {
                    type: message.type,//Msg.Appendix.AppendixType.IMAGE,
                    data: await (async (data) => {
                        let img = Appendix.Image.parseFromCQCode(data)
                        await img.analyze()
                        return JSON.stringify(img.toImgBase())
                    })(message.data)
                }
                contents[index] = CQ_PLACEHOLDER
                break
            case 'at':
                contents[index] = (CQ_PLACEHOLDER)
                appendixes[index] = {
                    type: message.type,
                    data: message.data
                }
                break
            case 'text':
                contents[index] = unescape(message.data)
                break
            default:
                contents[index] = `[CQ:${message.type},${message.data}]`
        }
    }
    /**
     *
     *
     * @static
     * @param {String} paraFile
     * @returns {Promise} data:{file:{String}}
     * @memberof Bot
     */
    static async getImageFile(paraFile: String) {
        return Bot.bot<Object>('get_image', { file: paraFile })
    }
}


