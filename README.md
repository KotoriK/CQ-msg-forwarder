# 简介
一个与其他相同协议的终端转发数据的插件，作为Minecraft聊天转发的配套存在。

目前项目没有完全开发完毕。文档会稍后补充。

# 使用方法
 0. 确认你已经有了CoolQ、CoolQ的插件CQ HTTP API、Node.js
 1. 从Github克隆或者下载下来
 2. 在根目录运行npm i
 3. 再运行npm run build
 4. 修改config.json
 5. 然后是npm run start
 
 
 注意！由于历史遗留原因，根目录下会有一个config.json。除非你在npm run build这一步前修改它，否则是没有用的。config.json要修改dist下的config.json。
 ## 关于config.json内的配置：
 ```TypeScript
/**
 * config.json的结构定义
 *
 * @author KotoriK
 * @interface ConfigType
 */
export interface ConfigType {

    webSocket: CQWebSocketOption//参见cq-websocket的配置文件

    adminId: number//指示管理员的QQ号码

    isPositivly: false,//指示是否主动连接
    listenPort: number,//使用的端口
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
 ```