
import { IForwardSource } from './IForwardSource'
import { Bot } from '../Bot';
import { MsgJson } from '../proto/MsgJson';
/**
 * 方向是：source→Receiver
 *
 * @export
 * @class CoolQForwardSource
 * @extends {IForwardSource}
 */
export class CoolQForwardSource extends IForwardSource {
    groupId: number
    constructor(groupId:number,doNotSend:boolean) {
        super()
        this.groupId = groupId
        this.send=(msg)=>{
            
        }
    }
    sendReverse(msg: MsgJson.IMsg) {
        if (msg.prefix == "!reserved!") {
            switch(msg.appendix[0].type){
                case "close":
                    Bot.sendGroupMsg(this.groupId, `服务器${msg.appendix[0].data}已关闭。`)   
                break
            default:
                if (msg.appendix[0].data == "close") {
                    Bot.sendGroupMsg(this.groupId, "与Minecraft服务器的连接已断开。")   
                }
            }          
        } else {
            Bot.sendGroupMsg(this.groupId, `${msg.prefix ? `${msg.prefix}: ` : ''}${msg.contents}`)
        }
    }

}