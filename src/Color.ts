import { ColorUtil } from "./ColorUtil";

let __pool: Color[] = [];

export interface IColor {
    r: number;
    g: number;
    b: number;
    a?: number;
}

export class Color implements IColor {
    public r: number;
    public g: number;
    public b: number;
    public a: number;
    constructor(r?: number, g?: number, b?: number, a?: number) {
        this.reset(r, g, b, a)
    }

    parse32(hex: number) {
        let { a, r, g, b } = ColorUtil.extract32(hex);
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
        return this;
    }

    parse(hex: number) {
        let { r, g, b } = ColorUtil.extract(hex);
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = 0xFF;
        return this;
    }

    reset(r?: number, g?: number, b?: number, a?: number) {
        this.r = Math.min(255, Math.max(0, r || 255));
        this.g = Math.min(255, Math.max(0, g || 255));
        this.b = Math.min(255, Math.max(0, b || 255));
        this.a = Math.min(255, Math.max(0, a || 255));
        return this;
    }

    toNumber() {
        return ColorUtil.mergeFrom(this);
    }

    toNumber32() {
        return ColorUtil.mergeFrom32(this);
    }

    recorver(){
        this.reset();
        Color.recorver(this);
    }

    static fromRBG(r?: number, g?: number, b?: number, a?: number) {
        if (__pool.length) {
            return __pool.pop().reset(r, g, b, a);
        }
        return new Color(r, g, b, a);
    }

    static from32(color: number) {
        if (__pool.length) {
            return __pool.pop().parse32(color);
        }
        return new Color().parse32(color);
    }

    static from(color?: number) {
        if (color == undefined) {
            if (__pool.length) {
                return __pool.pop();
            }
            return new Color();
        }
        if (__pool.length) {
            return __pool.pop().parse(color);
        }
        return new Color().parse(color);
    }

    static recorver(color: Color) {
        if (__pool.indexOf(color) == -1) {
            __pool.push(color.reset());
        }
    }
}