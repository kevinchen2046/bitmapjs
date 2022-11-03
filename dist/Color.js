"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Color = void 0;
const Util_1 = require("./Util");
let __pool = [];
class Color {
    constructor(r, g, b, a) {
        this.reset(r, g, b, a);
    }
    parse(hex) {
        this.r = ((hex & 0x00ff0000) >> 16);
        this.g = ((hex & 0x0000ff00)) >> 8;
        this.b = ((hex & 0x000000ff));
        this.a = ((hex >> 24) & 0xff);
        return this;
    }
    reset(r, g, b, a) {
        this.r = Math.min(255, Math.max(0, r || 255));
        this.g = Math.min(255, Math.max(0, g || 255));
        this.b = Math.min(255, Math.max(0, b || 255));
        this.a = Math.min(255, Math.max(0, a || 255));
        return this;
    }
    toHex() {
        return Util_1.Util.RGBToHex32(this);
    }
    static from(r, g, b, a) {
        if (__pool.length) {
            return __pool.pop().reset(r, g, b, a);
        }
        return new Color(r, g, b, a);
    }
    static fromHex(hex) {
        if (__pool.length) {
            return __pool.pop().parse(hex);
        }
        return new Color().parse(hex);
    }
    static recorver(color) {
        if (__pool.indexOf(color) == -1) {
            __pool.push(color.reset());
        }
    }
}
exports.Color = Color;
