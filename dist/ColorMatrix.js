'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.ColorMatrix = void 0;
const ColorUtil_1 = require("./ColorUtil");
class ColorMatrix {
    constructor(matrix) {
        this.matrix = matrix || [
            1, 0, 0, 0, 0,
            0, 1, 0, 0, 0,
            0, 0, 1, 0, 0,
            0, 0, 0, 1, 0
        ];
    }
    /**
     * 获取亮度矩阵
     * @param value 0-255
     * @returns
     */
    static getBrightness(value) {
        return this.$presets["brightness"] || (this.$presets["brightness"] = new ColorMatrix([
            1, 0, 0, 0, value,
            0, 1, 0, 0, value,
            0, 0, 1, 0, value,
            0, 0, 0, 1, 0
        ]));
    }
    /**
     * 获取饱和度矩阵
     * @param value 0-2
     * @returns
     */
    static getSaturation(value) {
        return this.$presets["saturation"] || (this.$presets["saturation"] = new ColorMatrix([
            0.3086 * (1 - value) + value, 0.6094 * (1 - value), 0.0820 * (1 - value), 0, 0,
            0.3086 * (1 - value), 0.6094 * (1 - value) + value, 0.0820 * (1 - value), 0, 0,
            0.3086 * (1 - value), 0.6094 * (1 - value), 0.0820 * (1 - value) + value, 0, 0,
            0, 0, 0, 1, 0
        ]));
    }
    /**
     * 获取对比度矩阵
     * @param value 0-10
     * @returns
     */
    static getContrast(value) {
        return this.$presets["contrast"] || (this.$presets["contrast"] = new ColorMatrix([
            value, 0, 0, 0, 128 * (1 - value),
            0, value, 0, 0, 128 * (1 - value),
            0, 0, value, 0, 128 * (1 - value),
            0, 0, 0, 1, 0
        ]));
    }
    /**
     * 获取阈值矩阵
     * @param value 0-255
     * @returns
     */
    static getThreshold(value) {
        return this.$presets["threshold"] || (this.$presets["threshold"] = new ColorMatrix([
            0.3086 * 256, 0.6094 * 256, 0.0820 * 256, 0, -256 * value,
            0.3086 * 256, 0.6094 * 256, 0.0820 * 256, 0, -256 * value,
            0.3086 * 256, 0.6094 * 256, 0.0820 * 256, 0, -256 * value,
            0, 0, 0, 1, 0
        ]));
    }
    static get gray() {
        return this.$presets["gray"] || (this.$presets["gray"] = new ColorMatrix([
            0.3086, 0.6094, 0.0820, 0, 0,
            0.3086, 0.6094, 0.0820, 0, 0,
            0.3086, 0.6094, 0.0820, 0, 0,
            0, 0, 0, 1, 0
        ]));
    }
    static get black() {
        return this.$presets["black"] || (this.$presets["black"] = new ColorMatrix([
            0, 0, 0, 0, 0,
            0, 0, 0, 0, 0,
            0, 0, 0, 0, 0,
            0, 0, 0, 1, 0
        ]));
    }
    static get revert() {
        return this.$presets["revert"] || (this.$presets["revert"] = new ColorMatrix([
            -1, 0, 0, 0, 255,
            0, -1, 0, 0, 255,
            0, 0, -1, 0, 255,
            0, 0, 0, 1, 0
        ]));
    }
    /**
     * 从给点颜色创建颜色矩阵
     * @param color
     * @param alpha
     * @return
     */
    static from(color) {
        if (typeof color == "number") {
            const { r, g, b } = ColorUtil_1.ColorUtil.extract(color);
            return this.create(r, g, b, 1);
        }
        return this.create(color.r, color.g, color.b, 1);
    }
    /**
     * 从给点32颜色创建颜色矩阵
     * @param color
     * @param alpha
     * @return
     */
    static from32(color) {
        if (typeof color == "number") {
            const { a, r, g, b } = ColorUtil_1.ColorUtil.extract32(color);
            return this.create(r, g, b, a);
        }
        return this.create(color.r, color.g, color.b, color.a);
    }
    /**
     * 生成颜色矩阵
     * @param r
     * @param g
     * @param b
     * @param alpha
     * @return
     */
    static create(r, g, b, a) {
        return [a, 0, 0, 0, r, 0, a, 0, 0, g, 0, 0, a, 0, b, 0, 0, 0, 1, 0];
    }
    exec(pixel) {
        let m = this.matrix;
        let r = pixel.r;
        let g = pixel.g;
        let b = pixel.b;
        let a = pixel.a;
        pixel.r = Math.max(0, Math.min(255, (m[0] * r) + (m[1] * g) + (m[2] * b) + (m[3] * a) + m[4]));
        pixel.g = Math.max(0, Math.min(255, (m[5] * r) + (m[6] * g) + (m[7] * b) + (m[8] * a) + m[9]));
        pixel.b = Math.max(0, Math.min(255, (m[10] * r) + (m[11] * g) + (m[12] * b) + (m[13] * a) + m[14]));
        pixel.a = Math.max(0, Math.min(255, (m[15] * r) + (m[16] * g) + (m[17] * b) + (m[18] * a) + m[19]));
        return pixel;
    }
    clone() {
        return new ColorMatrix(this.matrix);
    }
}
exports.ColorMatrix = ColorMatrix;
ColorMatrix.$presets = {};
