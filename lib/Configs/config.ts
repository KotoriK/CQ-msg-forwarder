import config from '../../config.json'
console.group("Loaded Config")
console.log(JSON.stringify(config))
console.groupEnd()
import { Penguin, PenguinProps } from './Penguin.js'
import { RetryOpt } from '../RetryOpt.js'
import { CoolQForwardSource } from './CoolQForwardSource.js';
import { promises } from 'dns'
import { CQWebSocketOption } from 'cq-websocket';
const dnsResolver = promises
let CoolQSourceMap = new Map<number, CoolQForwardSource>(),
    penguinMap = new Map<String, Penguin>(),
    retryOpt: RetryOpt = { times: config['penguinRetryOpt'].times, delay: config['penguinRetryOpt'].delay },
    ipPenguinMap = new Map<string, Penguin[]>();

function setupPenguin(i: ConfigPenguin, targetAddress: string, index: number) {
    let r = new Penguin({
        name: i.name ? i.name : `Penguin_${index}`,
        targetAddress: i.targetAddress,
        targetPort: i.targetPort,
        usingSSL: i.usingSSL,
        sslOptions: i.sslOptions,
        timeout: i.timeoutInMinute * 60 * 1000,
    })

    penguinMap.set(i.name, r)
    let value = ipPenguinMap.get(targetAddress)
    ipPenguinMap.set(targetAddress, value ? (() => { value.push(r); return value })() : [r])
    if (i.targetAddressAlias) {
        let value = ipPenguinMap.get(i.targetAddressAlias)
        ipPenguinMap.set(i.targetAddressAlias, value ? (() => { value.push(r); return value })() : [r])
    }
}
function initPenguinMap() {
    var tasks = []
    config['penguins'].map((i, index) => {
        if (i.useDnsLookup) {
            if (i.dnsServer && i.dnsServer.length > 0) {
                dnsResolver.setServers(i.dnsServer)
            }
            tasks.push(dnsResolver.lookup(i.targetAddress, i.useIpv6 ? 0 : 4).then(
                (value) => { setupPenguin(i, value.address, index) },
                (reason) => {
                    console.error(`为Penguin(${i.name})解析域名(${i.targetAddress})的ip地址时出错,${reason}`)
                }))
        } else {
            setupPenguin(i, i.targetAddress, index)
        }
    })
    return Promise.all(tasks)
}
function initForwardSources() {
    for (const i of config.forwardSources) {
        let r = penguinMap.get(i.forwardTo)
        if (!r) { throw Error('unknown Penguin:' + i.forwardTo) }
        switch (i.type) {
            case 'CoolQ':
                if (i.group_id) {
                    let source = new CoolQForwardSource(i.group_id,i.doNotSend)
                    CoolQSourceMap.set(i.group_id, source)
                    source.addPenguin(r)
                    r.addSource(source)
                } else {
                    throw new Error('config.json的配置不正确。没有group_id')
                }
                break;
            default:
                throw new Error('config.json的配置不正确。不支持的PenguinType')
        }
    }
}
//config main
initPenguinMap().then(() => {
    initForwardSources()
})
//
/**
 * config.json的结构定义
 *
 * @author KotoriK
 * @interface ConfigType
 */
export interface ConfigType {

    webSocket: CQWebSocketOption
    /**
     * 指示管理员的QQ号码
     *
     * @type {number}
     * @memberof Config
     */
    adminId: number
    /**
     *指示是否主动连接
     * @type {false}
     * @memberof Config
     */
    isPositivly: false,
    listenPort: number,
    forwardSources: [{
        type: string,
        group_id: number,
        forwardTo: string,
        doNotSend:boolean
    }
    ],
    penguins: Array<PenguinProps>,
    penguinRetryOpt: RetryOpt
}
/**
 * CQ-WebSocket侧的默认配置
 */
/* const default_ConfigCQWebSocket:Partial<CQWebSocketOption>= {
    host:  "127.0.0.1",
    port:  6700,
    enableAPI:  true,
    enableEvent:  true,
    accessToken:  "",
    reconnection:  true,
    reconnectionAttempts: 10,
    reconnectionDelay: 5000
} */
export interface ConfigPenguin {
    name: string;
    targetAddress: string;
    useDnsLookup: boolean;
    dnsServer: any[];
    useIpv6: boolean;
    targetAddressAlias: string;
    targetPort: number;
    usingSSL: boolean;
    sslOptions: {};
    timeoutInMinute: number;
}

export {
    config, CoolQSourceMap, penguinMap, ipPenguinMap,
}
