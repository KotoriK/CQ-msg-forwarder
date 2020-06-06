export module MsgJson {
    export interface IMsg {
        prefix: string
        contents: Array<string>
        appendix: Array<IAppendix>

    }
    export interface IAppendix {
        type: string
        data: string
    }
    /* export enum AppendixType {
        TAG,
        ANONYMOUS,
        AT,
        B_FACE,
        CUSTOM_MUSIC,
        EMOJI,
        FACE,
        IMAGE,
        MUSIC,
        RECORD,
        RPS,
        S_FACE,
        SHARE,
        TEXT,
        UNRECOGNIZED,
        ERROR,INFO
    } */
   /*  export class MsgCompiled {
        p: string; c: string[];
        a: IAppendix[];
        constructor(p: string,c: string[],a: IAppendix[]){
            this.p=p
            this.c=c
            this.a=a
        }
        static fromIMsg(msg:IMsg){
            return new MsgCompiled(msg.prefix,msg.contents,msg.appendix)
        }

    } */
}