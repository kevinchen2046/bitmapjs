"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Color = void 0;
const ColorUtil_1 = require("./ColorUtil");
let __pool = [];
class Color {
    constructor(r, g, b, a) {
        this.reset(r, g, b, a);
    }
    parse32(hex) {
        let { a, r, g, b } = ColorUtil_1.ColorUtil.extract32(hex);
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
        return this;
    }
    parse(hex) {
        let { r, g, b } = ColorUtil_1.ColorUtil.extract(hex);
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = 0xFF;
        return this;
    }
    reset(r, g, b, a) {
        this.r = Math.min(255, Math.max(0, r || 255));
        this.g = Math.min(255, Math.max(0, g || 255));
        this.b = Math.min(255, Math.max(0, b || 255));
        this.a = Math.min(255, Math.max(0, a || 255));
        return this;
    }
    toNumber() {
        return ColorUtil_1.ColorUtil.mergeFrom(this);
    }
    toNumber32() {
        return ColorUtil_1.ColorUtil.mergeFrom32(this);
    }
    recorver() {
        this.reset();
        Color.recorver(this);
    }
    static fromRBG(r, g, b, a) {
        if (__pool.length) {
            return __pool.pop().reset(r, g, b, a);
        }
        return new Color(r, g, b, a);
    }
    static from32(color) {
        if (__pool.length) {
            return __pool.pop().parse32(color);
        }
        return new Color().parse32(color);
    }
    static from(color) {
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
    static recorver(color) {
        if (__pool.indexOf(color) == -1) {
            __pool.push(color.reset());
        }
    }
}
exports.Color = Color;
