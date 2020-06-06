export default class CQCodeUtil {
    public static readonly regGetCQ: RegExp = new RegExp(/(\[CQ:[^\]]+\])/gi)
    private static readonly regGetCQType: RegExp = new RegExp(/\[CQ:([^,]+)/i)
    private static readonly regGetData: RegExp = new RegExp(/^([a-z_]+)=([^\]]+)/i)

    public static decode(CQCode: string) {
        let array = CQCode.split(',')
        let regResult: RegExpExecArray = this.regGetCQType.exec(array.shift())
        let result = { type: '', data: undefined }
        if (regResult) {
            result.type = regResult[1]
            let match: RegExpMatchArray, tempData = {}
            for (const i of array) {
                match = i.match(this.regGetData)
                if (match) {
                    tempData[match[1]] = match[2]
                }
            }
            result.data = tempData
        } else {
            throw new Error('Decode Failed.CQCode not correct: ' + CQCode)
        }
        return result
    }
    public static decodeAllCQCode(str: string) {
        //Javascript什么时候支持emoji变量？decodeAllCQ🐴
        let buf: Array<string> = [], buf2: Array<string> = [],codes=[]
        let inBracket
        for (const c of str) {
            switch (c) {//默认[]已经被转义了
                case '[':
                    if(inBracket){
                        throw new Error('Syntax Error')
                    }else{
                        inBracket=true
                        buf2=[]
                        if(buf.length>1){
                            codes.push({type:'text',data:buf.join('')})
                        }
                        buf=[]
                    }
                    break
                case ']':
                    if(inBracket){
                        inBracket=false
                        codes.push(this.decode(`[${buf2.join('')}]`))
                        buf2=[]
                    }else{
                        throw new Error('Syntax Error')
                    }                   
                     break
                    default:
                        if(inBracket){
                            buf2.push(c)
                        }else{
                            buf.push(c)
                        }

            }
           
        } 
        if(buf.length>0){
                codes.push({type:'text',data:buf.join('')})
            }
        return codes

    }
}