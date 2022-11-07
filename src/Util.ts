import * as fs from "fs";
import { Bitmap } from "./Bitmap";

export class Util {
    /**
     * 导出成网页格式
     * @param {String} path 
     * @param {...Bitmap[]} bitmaps 
     */
    static async exportToHTML(path: string, ...buffers: Buffer[]) {
        var coontent = `<head></head>\r\n<body>\r\n`;
        for (var buffer of buffers) {
            coontent += `<img src="${this.toDataURL(buffer)}" />\r\n`;
        }
        coontent += `</body>`
        fs.writeFileSync(path, coontent, 'utf-8');
    }

    /**
    * 转换成Base64编码
    * @returns 
    */
    static toBase64(buffer: Buffer) {
        return Util.encodeBase64Image(buffer);
    }

    /**
    * 转换成DataURL
    * @returns 
    */
    static toDataURL(buffer: Buffer) {
        return `data:image/png;base64,${this.toBase64(buffer)}`;
    }

    static encodeBase64Image(data: Uint8Array) {
        return Buffer.from(data).toString("base64");
    }

    static decodeBase64Image(base64: string) {
        return Buffer.from(base64, 'base64');
    }

    static getBase64Size(base64: string) {
        const data = base64.substring(20, 32);
        const base64Characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        const nums = [];
        for (const c of data) {
            nums.push(base64Characters.indexOf(c));
        }
        const bytes = [];
        for (let i = 0; i < nums.length; i += 4) {
            bytes.push((nums[i] << 2) + (nums[i + 1] >> 4));
            bytes.push(((nums[i + 1] & 15) << 4) + (nums[i + 2] >> 2));
            bytes.push(((nums[i + 2] & 3) << 6) + nums[i + 3]);
        }
        const width = (bytes[1] << 24) + (bytes[2] << 16) + (bytes[3] << 8) + bytes[4];
        const height = (bytes[5] << 24) + (bytes[6] << 16) + (bytes[7] << 8) + bytes[8];
        return { width, height }
    }

    /**
     * 弧度转角度
     * @param {Number} radian 
     * @returns 
     */
    static radianToAngle(radian: number) {
        return radian * (180.0 / Math.PI);
    }

    /**
     * 角度转弧度
     * @param {Number} angle 
     * @returns 
     */
    static angleToRadian(angle: number) {
        return Math.PI * angle / 180.0;
    }


    // 256-value binary Vector struct
    static histogramVector(n) {
        var v = [];
        for (var i = 0; i < 256; i++) { v[i] = n; }
        return v;
    }

}
