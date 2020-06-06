import {  penguinMap, ipPenguinMap } from "./Configs/config"
import net, { Socket } from 'net'
export function startPositivly() {
    penguinMap.forEach((value, key) => {
        console.log(`r${key}:connecting to ${value.targetAddress}:${value.targetPort}`)
        value.connect().on("close",(penguin)=>{
            
        })
    })

}

export function startNegativly(listenOnPort) {
    let server = net.createServer()
    const logError = (err) => { console.warn('连接已拒绝:' + err) }
    //event listener
    server.on('connection', (socket: Socket) => {
        socket.once('error', logError)
        let match = [
            /(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)/.exec(socket.remoteAddress)[0]//ipv4
            ,
            /((([0-9A-Fa-f]{1,4}:){7}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){6}:[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){5}:([0-9A-Fa-f]{1,4}:)?[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){4}:([0-9A-Fa-f]{1,4}:){0,2}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){3}:([0-9A-Fa-f]{1,4}:){0,3}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){2}:([0-9A-Fa-f]{1,4}:){0,4}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){6}((\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b)\.){3}(\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b))|(([0-9A-Fa-f]{1,4}:){0,5}:((\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b)\.){3}(\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b))|(::([0-9A-Fa-f]{1,4}:){0,5}((\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b)\.){3}(\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b))|([0-9A-Fa-f]{1,4}::([0-9A-Fa-f]{1,4}:){0,5}[0-9A-Fa-f]{1,4})|(::([0-9A-Fa-f]{1,4}:){0,6}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){1,7}:))/i
                .exec(socket.remoteAddress)[0]//ipv6
            ,
        ]
        let nowPos = 0
        while (nowPos <= 1) {
            let penguins = ipPenguinMap.get(match[nowPos])
            if (penguins) {
                for (const i of penguins) {
                    if (i.setSocket(socket)) {
                        socket.removeListener('error', logError)
                        console.log(`新连接传入已接受:${socket.remoteAddress}:${socket.remotePort}`)
                        return
                    }
                }
                socket.destroy(new Error(`${socket.remoteAddress}:${socket.remotePort} 对应的penguin均已建立连接`))
            }
            nowPos++
        }
        socket.destroy(new Error(`${socket.remoteAddress}:${socket.remotePort} 传入连接来自未认证的客户端`))
    })
        .on("close", () => {
            console.log('socket closed')
        })
        .on('error', (err) => {
            throw err
        })
        .on("listening", () => { console.log('我在听:端口' + listenOnPort) })
        ////////
        .listen(listenOnPort)
    return server
}