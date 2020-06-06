/**
 * 返回一个Promise，在指定的毫秒后resolve
 * @seealso https://stackoverflow.com/questions/951021/what-is-the-javascript-version-of-sleep
 * @export
 * @param {number} ms
 * @returns
 */
export default function sleep(ms:number){
    return new Promise(resolve=>setTimeout(resolve,ms))
}
