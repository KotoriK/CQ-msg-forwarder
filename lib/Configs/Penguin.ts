import net from "net"
import { Socket } from "net"
//import { Msg } from '../proto/msg-compiled'
import { IForwardSource } from "./IForwardSource"
import { MsgJson } from '../proto/MsgJson'
import { Messager } from '@nelts/tcp-stick'
import { config } from "./config"
import { PenguinNotReadyException } from "../Exceptions"
import sleep from "../util/sleep"
/**
 * @description 负责与目标(target)和转发源(IForwardSource)通信，转发消息(Msg)的类。
 * 
 * 根据这一功能，原来是想取英文的鸽子🕊的，但是记错英文把原始阶段的Receiver全都改完名后才发觉有什么不对，就这样吧（毕竟还要去改java那边
 * 
 * 检查了最早的开发文档才发现这个错误一直持续了这么久
 * @export
 * @class Penguin
 */
export class Penguin {
    public readonly name: string
    public readonly targetAddress: string
    public readonly targetPort: number
    public readonly usingSSL: boolean
    public readonly sslOptions: Object
    public socket: Socket//TODO 
    private _isReady: boolean = false;
    public source: Array<IForwardSource> = []
    private _onCloseCallBacks: Array<Function> = []
    private _onFailedCallBacks: Array<Function> = []
    private messager: Messager
    /**
     * 指示是否在等待心跳回复
     *
     * @private
     * @type {boolean}
     * @memberof Penguin
     */
    private _onWait: boolean = false
    public get isReady(): boolean {
        return this._isReady;
    }
    /**
     *隔多久没有活动时触发timeout，单位为毫秒ms
     *
     * @type {number}
     * @memberof Penguin
     */
    public readonly IDLE_TIME: number//ms
    constructor(props: PenguinProps = { name: "default_Penguin", targetAddress: "127.0.0.1", targetPort: 0, usingSSL: false, sslOptions: {}, timeout: 10 }) {
        this.name = props.name
        this.targetAddress = props.targetAddress
        this.targetPort = props.targetPort
        this.usingSSL = props.usingSSL
        this.sslOptions = props.sslOptions
        this.IDLE_TIME = props.timeout
    }
    addSource(source: IForwardSource) {
        this.source.push(source)
    }
    /**
     *应当使用这个方法设置socket以设置_isReady标志
     *
     * @param {Socket} socket
     * @memberof Penguin
     * @returns boolean
     */
    setSocket(socket: Socket) {
        if (this._isReady) {
            return false;
        } else {
            this.socket = socket
            this._onConnected()
            return true
        }
    }
    connect() {
        if (!this._isReady) {
            this.socket = net.createConnection(this.targetPort, this.targetAddress, () => this._onConnected())
        }
        return this
    }
    send(msg: string | Uint8Array): Promise<string> {
        return new Promise((resolve, reject) => {
            if (this._isReady) {
                this.socket?.write(this.messager.publish(msg), "utf-8", (e) => {
                    console.log('send:' + msg)
                    if (e) {
                        reject(e)
                    } else {
                        resolve('send:' + msg)
                    }
                })
            } else {
                //TODO not ready yet
                throw new PenguinNotReadyException(`Penguin:${this.name} is not ready!`)
            }
        })

    }
    toString() { return `Penguin:${this.name}(target:${this.targetAddress}:${this.targetPort})` }
    private _onConnected() {
        this.messager = new Messager()
        this._onWait = false
        this._isReady = true
        console.log(`Connected to ${this.targetAddress}:${this.targetPort}`)

        this.socket.setTimeout(this.IDLE_TIME)
            .on('data', (data: Buffer) => {
                this._onWait = false
                this.messager.putData(data)
                console.log(`Receive from Socket:${data}`)
            })

            .on('timeout', () => config.isPositivly ? this._timeoutClientMode() : this._timeoutServerMode())
            .on('close', (had_error) => {
                console.log(`${this.toString()}:Connection Closed`)
                for (const i of this.source) {
                    i.sendReverse({
                        prefix: '!reserved!',
                        contents: [`Penguin ${this.name}:Connection with ${this.targetAddress}:${this.targetPort} closed.`],
                        appendix: [{ type: had_error ? 'error' : 'info', data: 'close' }]
                    })
                }
                this._isReady = false
                this.messager.removeAllListeners()
                this.messager = null
                for (const f of this._onCloseCallBacks) {
                    f(this)
                }
                this.socket=null
            })
            .on('error', (e: Error) => {
                console.warn(`${this.toString()}:Connection Error : ${e.message}`)
                let msg: MsgJson.IMsg = {
                    prefix: '!reserved!',
                    contents: [e.name, e.message],
                    appendix: [{ type: 'error', data: '' }]
                }
                for (const i of this.source) {
                    i.sendReverse(msg)
                }
            })

        this.messager.on('data', (data) => {
            let get = data.toString()
            console.log(get)
            if (this.source.length > 0) {
                try {
                    //let msg: Msg = Msg.decodeDelimited(data)
                    let msg: MsgJson.IMsg = JSON.parse(get)
                    if (msg.prefix == "!reserved!" && msg.contents.length>0) {
                        //心跳包
                      if(msg.contents[0]==="0")  this._sendDokiPack(1)
                    } else {
                        for (const i of this.source) {
                            i.sendReverse(msg)
                        }
                    }

                } catch (e) {
                    console.warn(e)
                }
            } else {
                console.warn(`Send to where?Msg:${get},from Penguin:${this.toString()}`)
            }

        })
    }
    /**
     * 发送心跳包，以及处理逻辑
     * @param dokiCount 表示心跳包是主动发送的（0），还是被动发送的。
     * @private
     */
    private _sendDokiPack(dokiCount: number) {
        this.send(JSON.stringify({
            prefix: "!reserved!",
            contents: [dokiCount.toString()],
            appendix: []
        })).then(() => {
            if (dokiCount === 0) sleep(this.IDLE_TIME).then(() => {
                if (this._onWait) {
                    this.close("timeout")
                }
            })
        }, (reason) => {
            if (dokiCount === 0) this.close(reason)
        })
    }
    private _timeoutClientMode() {
        this._sendDokiPack(0)
    }
    private _timeoutServerMode() {
this._sendDokiPack (0)   }
    close(reason?: Error | string) {
        //释放资源
        this.socket.destroy(reason ? typeof reason == "string" ? new Error(reason) : reason : undefined)
    }
    on(type: 'close' | 'failed', cbFunc: (penguin: Penguin) => void) {
        if (type === 'close') {
            this._onCloseCallBacks.push(cbFunc)
        } else {
            this._onFailedCallBacks.push(cbFunc)
        }
    }
    off(type: 'close' | 'failed', cbFunc: (penguin: Penguin) => void) {
        if (type === 'close') {
            this._onCloseCallBacks.splice(
                this._onCloseCallBacks.findIndex((value) => {
                    return value == cbFunc
                }), 1)
        } else {
            this._onFailedCallBacks.splice(
                this._onCloseCallBacks.findIndex((value) => {
                    return value == cbFunc
                }), 1)
        }
    }
}

export interface PenguinProps {
    /**
     *友好名称
     *
     * @type {string}
     * @memberof PenguinProps
     */
    name: string,
    /**
     * 目标地址
     *
     * @type {string}
     * @memberof PenguinProps
     */
    targetAddress: string,
    /**
     * 目标端口
     *
     * @type {number}
     * @memberof PenguinProps
     */
    targetPort: number,
    /**
     * 指示消息传递是否使用SSL
     *
     * @type {boolean}
     * @memberof PenguinProps
     */
    usingSSL: boolean,
    /**
     * SSL的具体设置
     *
     * @type {Object}
     * @memberof PenguinProps
     */
    sslOptions: Object,
    /**
     * 设定多少毫秒以后超时
     *
     * @type {number}
     * @memberof PenguinProps
     */
    timeout: number,
}