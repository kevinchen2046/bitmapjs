'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.ColorTransform = void 0;
class ColorTransform {
    constructor(redMultiplier, greenMultiplier, blueMultiplier, alphaMultiplier, redOffset, greenOffset, blueOffset, alphaOffset) {
        this.redMultiplier = redMultiplier == undefined ? 1 : redMultiplier;
        this.greenMultiplier = greenMultiplier == undefined ? 1 : greenMultiplier;
        this.blueMultiplier = blueMultiplier == undefined ? 1 : blueMultiplier;
        this.alphaMultiplier = alphaMultiplier == undefined ? 1 : alphaMultiplier;
        this.redOffset = redOffset || 0;
        this.greenOffset = greenOffset || 0;
        this.blueOffset = blueOffset || 0;
        this.alphaOffset = alphaOffset || 0;
    }
    exec(pixel) {
        pixel.r = Math.max(0, Math.min(255, pixel.r * this.redMultiplier + this.redOffset));
        pixel.g = Math.max(0, Math.min(255, pixel.g * this.greenMultiplier + this.greenOffset));
        pixel.b = Math.max(0, Math.min(255, pixel.b * this.blueMultiplier + this.blueOffset));
        pixel.a = Math.max(0, Math.min(255, pixel.a * this.alphaMultiplier + this.alphaOffset));
        return pixel;
    }
}
exports.ColorTransform = ColorTransform;
