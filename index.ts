import { config} from "./lib/Configs/config"
import { Bot } from "./lib/Bot"
import { startPositivly, startNegativly } from "./lib/main"
console.log('Starting...')
Bot.init()
if (config['isPositivly']) {
    startPositivly()
} else {
    startNegativly(config.listenPort)
}
