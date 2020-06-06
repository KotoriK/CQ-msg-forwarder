
import { Bot } from "../Bot"
import {imageSize} from 'image-size'
export namespace Appendix {
    export class Image {
        paraFile: string
        localUrl: string
        url: string
        size: ISize
        isGif: boolean
        isBase64: boolean
        /**
         *Creates an instance of Image.
         * @param {string} paraFile 收到的图片文件名（CQ 码的 file 参数），如 6B4DE3DFD1BD271E3297859D41C530F5.jpg
         * @param {string} url 对应在QQ服务器的url
         * @memberof Image
         */
        constructor(paraFile: string, url: string) {
            this.url = url
            this.paraFile = paraFile
        }
        /**
         *直接返回本地地址
         *
         * @param {string} paraFile
         * @memberof Image
         */
        static getLocalUrl(paraFile: string) {
            return Bot.getImageFile(paraFile).then((data) => {
                return data.data['file']
            })
        }
        analyze() {
            return new Promise(async (resolve, reject) => {
                this.localUrl = await Image.getLocalUrl(this.paraFile)

                let result = imageSize(this.localUrl)
                this.isGif = (result.type == "gif")
                this.size = { width: result.width, height: result.height }
                resolve(this)
            })
        }
        static parseFromCQCode(data) {
            if (data.file && data.url) {
                return new Image(data.file, data.url)
            } else {
                return undefined
            }

        }
        /**
         *
         *
         * @returns IImgBase
         * @memberof Image
         */
        toImgBase(){
            return {size:this.size,isGif:this.isGif,url:this.url}
        }

    }
    export interface ISize {
        width: number
        height: number

    }
    export interface IImgBase{
        size:ISize
        isGif:boolean
        url:string
    }

}