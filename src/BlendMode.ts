import { Bitmap } from "./Bitmap";
import { Color } from "./Color";
import { Point } from "./Point";

export enum BlendMode {
    ADD = "add",
    ALPHA = "alpha",
    DARKEN = "darken",
    DIFFERENCE = "difference",
    ERASE = "erase",
    HARDLIGHT = "hardlight",
    INVERT = "invert",
    LAYER = "layer",
    LIGHTEN = "lighten",
    MULTIPLY = "multiply",
    NORMAL = "normal",
    OVERLAY = "overlay",
    SCREEN = "screen",
    SHADER = "shader",
    SUBTRACT = "subtract",
}

const halfColorMax = 0.00784313725;

class BlendModeApply {
    private __methods: { [key: string]: (pixelSource: Color, pixelTarget: Color) => Color };
    constructor() {
        this.__methods = {};
        this.__methods[BlendMode.ADD] = function (source: Color, target: Color) {
            source.r = Math.min(source.r + target.r, 255);
            source.g = Math.min(source.g + target.g, 255);
            source.b = Math.min(source.b + target.b, 255);
            return source;
        }
        this.__methods[BlendMode.SUBTRACT] = function (source: Color, target: Color) {
            source.r = Math.min(source.r - target.r, 255);
            source.g = Math.min(source.g - target.g, 255);
            source.b = Math.min(source.b - target.b, 255);
            return source;
        }
        this.__methods[BlendMode.INVERT] = function (source: Color, target: Color) {
            source.r = 255 - source.r;
            source.g = 255 - source.g;
            source.b = 255 - source.b;
            return source;
        }
        this.__methods[BlendMode.MULTIPLY] = function (source: Color, target: Color) {
            source.r = Math.floor(source.r * target.r / 255);
            source.g = Math.floor(source.g * target.g / 255);
            source.b = Math.floor(source.b * target.b / 255);
            return source;
        }
        this.__methods[BlendMode.LIGHTEN] = function (source: Color, target: Color) {
            source.r = Math.max(source.r, target.r);
            source.g = Math.max(source.g, target.g);
            source.b = Math.max(source.b, target.b);
            return source;
        }
        this.__methods[BlendMode.DARKEN] = function (source: Color, target: Color) {
            source.r = Math.min(source.r, target.r);
            source.g = Math.min(source.g, target.g);
            source.b = Math.min(source.b, target.b);
            return source;
        }
        this.__methods[BlendMode.DIFFERENCE] = function (source: Color, target: Color) {
            source.r = Math.abs(source.r * target.r);
            source.g = Math.abs(source.g * target.g);
            source.b = Math.abs(source.b * target.b);
            return source;
        }
        this.__methods[BlendMode.SCREEN] = function (source: Color, target: Color) {
            source.r = (255 - (((255 - source.r) * (255 - target.r)) >> 8));;
            source.g = (255 - (((255 - source.g) * (255 - target.g)) >> 8));;
            source.b = (255 - (((255 - source.b) * (255 - target.b)) >> 8));;
            return source;
        }
        this.__methods[BlendMode.OVERLAY] = function (source: Color, target: Color) {
            if (target.r < 128) {
                source.r = source.r * target.r * halfColorMax;
            } else {
                source.r = 255 - (255 - source.r) * (255 - target.r) * halfColorMax;
            }
            if (target.g < 128) {
                source.g = source.g * target.g * halfColorMax;
            } else {
                source.g = 255 - (255 - source.g) * (255 - target.g) * halfColorMax;
            }
            if (target.b < 128) {
                source.b = source.b * target.b * halfColorMax;
            } else {
                source.b = 255 - (255 - source.b) * (255 - target.b) * halfColorMax;
            }
            return source;
        }
    }

    exec(source: Bitmap, target: Bitmap, blendMode: BlendMode, dest?: Point) {
        let exec = this.__methods[blendMode];
        if (!!exec) {
            let defaultColor = Color.fromRBG();
            let dx = dest?.x ?? 0;
            let dy = dest?.y ?? 0;
            source.forEachPixels((color, x, y) => {
                let targetColor = target.getPixel32(x + dx, y + dy);
                if (!targetColor) targetColor = defaultColor;
                let result = exec(color, targetColor);
                source.setPixel32(x, y, result);
            });
        }
    }
}

export let blendModeApply = new BlendModeApply();