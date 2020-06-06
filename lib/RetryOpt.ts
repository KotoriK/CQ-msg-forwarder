export interface RetryOpt{
     readonly times:number
     /**
      * 单位秒
      *
      * @type {number}
      * @memberof RetryOpt
      */
     readonly delay:number
}