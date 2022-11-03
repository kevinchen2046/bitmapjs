import { Util } from "./Util";

let __pool: Color[] = [];

export class Color {
    public r: number;
    public g: number;
    public b: number;
    public a: number;
    constructor(r?: number, g?: number, b?: number, a?: number) {
        this.reset(r, g, b, a)
    }

    parse(hex: number) {
        this.r = ((hex & 0x00ff0000) >> 16);
        this.g = ((hex & 0x0000ff00)) >> 8;
        this.b = ((hex & 0x000000ff));
        this.a = ((hex >> 24) & 0xff);
        return this;
    }

    reset(r?: number, g?: number, b?: number, a?: number) {
        this.r = Math.min(255, Math.max(0, r || 255));
        this.g = Math.min(255, Math.max(0, g || 255));
        this.b = Math.min(255, Math.max(0, b || 255));
        this.a = Math.min(255, Math.max(0, a || 255));
        return this;
    }

    toHex() {
        return Util.RGBToHex32(this);
    }

    static from(r?: number, g?: number, b?: number, a?: number) {
        if (__pool.length) {
            return __pool.pop().reset(r, g, b, a);
        }
        return new Color(r, g, b, a);
    }

    static fromHex(hex: number) {
        if (__pool.length) {
            return __pool.pop().parse(hex);
        }
        return new Color().parse(hex);
    }

    static recorver(color: Color) {
        if (__pool.indexOf(color) == -1) {
            __pool.push(color.reset());
        }
    }
}