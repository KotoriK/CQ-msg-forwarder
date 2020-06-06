
import { Penguin } from './Penguin';
import { MsgJson } from '../proto/MsgJson';
export class IForwardSource {
    /**
     * Abstract method
     *
     * @param {Msg} msg
     * @memberof IForwardSource
     */

    addPenguin(penguin:Penguin){
        this.forwardTo.push(penguin)
        return this
    }

    sendReverse(msg: MsgJson.IMsg) {
        console.log(msg)
    }
    send(msg: MsgJson.IMsg) {
        this.forwardTo.map((v) => {
            //v.send(Msg.encodeDelimited(msg).finish());
            v.send(JSON.stringify(msg))
        })
    }
    forwardTo: Array<Penguin>=[]
}