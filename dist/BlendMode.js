"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.blendModeApply = exports.BlendMode = void 0;
const Color_1 = require("./Color");
var BlendMode;
(function (BlendMode) {
    BlendMode["ADD"] = "add";
    BlendMode["ALPHA"] = "alpha";
    BlendMode["DARKEN"] = "darken";
    BlendMode["DIFFERENCE"] = "difference";
    BlendMode["ERASE"] = "erase";
    BlendMode["HARDLIGHT"] = "hardlight";
    BlendMode["INVERT"] = "invert";
    BlendMode["LAYER"] = "layer";
    BlendMode["LIGHTEN"] = "lighten";
    BlendMode["MULTIPLY"] = "multiply";
    BlendMode["NORMAL"] = "normal";
    BlendMode["OVERLAY"] = "overlay";
    BlendMode["SCREEN"] = "screen";
    BlendMode["SHADER"] = "shader";
    BlendMode["SUBTRACT"] = "subtract";
})(BlendMode = exports.BlendMode || (exports.BlendMode = {}));
const halfColorMax = 0.00784313725;
class BlendModeApply {
    constructor() {
        this.__methods = {};
        this.__methods[BlendMode.ADD] = function (source, target) {
            source.r = Math.min(source.r + target.r, 255);
            source.g = Math.min(source.g + target.g, 255);
            source.b = Math.min(source.b + target.b, 255);
            return source;
        };
        this.__methods[BlendMode.SUBTRACT] = function (source, target) {
            source.r = Math.min(source.r - target.r, 255);
            source.g = Math.min(source.g - target.g, 255);
            source.b = Math.min(source.b - target.b, 255);
            return source;
        };
        this.__methods[BlendMode.INVERT] = function (source, target) {
            source.r = 255 - source.r;
            source.g = 255 - source.g;
            source.b = 255 - source.b;
            return source;
        };
        this.__methods[BlendMode.MULTIPLY] = function (source, target) {
            source.r = Math.floor(source.r * target.r / 255);
            source.g = Math.floor(source.g * target.g / 255);
            source.b = Math.floor(source.b * target.b / 255);
            return source;
        };
        this.__methods[BlendMode.LIGHTEN] = function (source, target) {
            source.r = Math.max(source.r, target.r);
            source.g = Math.max(source.g, target.g);
            source.b = Math.max(source.b, target.b);
            return source;
        };
        this.__methods[BlendMode.DARKEN] = function (source, target) {
            source.r = Math.min(source.r, target.r);
            source.g = Math.min(source.g, target.g);
            source.b = Math.min(source.b, target.b);
            return source;
        };
        this.__methods[BlendMode.DIFFERENCE] = function (source, target) {
            source.r = Math.abs(source.r * target.r);
            source.g = Math.abs(source.g * target.g);
            source.b = Math.abs(source.b * target.b);
            return source;
        };
        this.__methods[BlendMode.SCREEN] = function (source, target) {
            source.r = (255 - (((255 - source.r) * (255 - target.r)) >> 8));
            ;
            source.g = (255 - (((255 - source.g) * (255 - target.g)) >> 8));
            ;
            source.b = (255 - (((255 - source.b) * (255 - target.b)) >> 8));
            ;
            return source;
        };
        this.__methods[BlendMode.OVERLAY] = function (source, target) {
            if (target.r < 128) {
                source.r = source.r * target.r * halfColorMax;
            }
            else {
                source.r = 255 - (255 - source.r) * (255 - target.r) * halfColorMax;
            }
            if (target.g < 128) {
                source.g = source.g * target.g * halfColorMax;
            }
            else {
                source.g = 255 - (255 - source.g) * (255 - target.g) * halfColorMax;
            }
            if (target.b < 128) {
                source.b = source.b * target.b * halfColorMax;
            }
            else {
                source.b = 255 - (255 - source.b) * (255 - target.b) * halfColorMax;
            }
            return source;
        };
    }
    exec(source, target, blendMode, dest) {
        var _a, _b;
        let exec = this.__methods[blendMode];
        if (!!exec) {
            let defaultColor = Color_1.Color.fromRBG();
            let dx = (_a = dest === null || dest === void 0 ? void 0 : dest.x) !== null && _a !== void 0 ? _a : 0;
            let dy = (_b = dest === null || dest === void 0 ? void 0 : dest.y) !== null && _b !== void 0 ? _b : 0;
            source.forEachPixels((color, x, y) => {
                let targetColor = target.getPixel32(x + dx, y + dy);
                if (!targetColor)
                    targetColor = defaultColor;
                let result = exec(color, targetColor);
                source.setPixel32(x, y, result);
            });
        }
    }
}
exports.blendModeApply = new BlendModeApply();
