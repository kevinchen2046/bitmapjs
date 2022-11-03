"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bitmap = void 0;
const gifuct_js_1 = require("gifuct-js");
const jpegjs = require("jpeg-js");
const pngjs_1 = require("pngjs");
const fs = require("fs");
const path = require("path");
const hash = require("node-object-hash");
const Color_1 = require("./Color");
const Util_1 = require("./Util");
const Rectangle_1 = require("./Rectangle");
const ColorTransform_1 = require("./ColorTransform");
const BitmapChannel_1 = require("./BitmapChannel");
const PRNG_1 = require("./PRNG");
const SimplexNoise_1 = require("./SimplexNoise");
const Point_1 = require("./Point");
const stream_1 = require("stream");
let hasher = hash({ coerce: { set: true, symbol: true } });
class Bitmap extends pngjs_1.PNG {
    constructor(width, height, params) {
        super(Object.assign({ width: width, height: height }, params));
        this.rect = new Rectangle_1.Rectangle(0, 0, width, height);
    }
    get hash() { return this.__hash; }
    /**
     * from url load
     * @param {String} url
     * @returns {Promise<Bitmap>}
     */
    static fromURL(url) {
        return __awaiter(this, void 0, void 0, function* () {
            let ext = path.extname(url);
            let result;
            switch (ext) {
                case ".png":
                    result = yield Bitmap.fromPng(url);
                    break;
                case ".jpeg":
                case ".jpg":
                    result = Bitmap.fromJpeg(url);
                    break;
                case ".gif":
                    result = Bitmap.fromGif(url);
                    break;
            }
            return result;
        });
    }
    static fromPng(url) {
        var buffer = fs.readFileSync(url);
        return new Promise((reslove, reject) => {
            let bitmap = new Bitmap(undefined, undefined, { filterType: 4 });
            bitmap.parse(buffer, function (error, png) {
                if (error) {
                    reject(error);
                    return;
                }
                bitmap.__hash = hasher.hash(bitmap.data);
                bitmap.rect.set(0, 0, bitmap.width, bitmap.height);
                reslove(bitmap);
            });
        });
    }
    static fromJpeg(url) {
        var buffer = fs.readFileSync(url);
        var jpeg = jpegjs.decode(buffer, { useTArray: true, formatAsRGBA: true });
        let bitmap = new Bitmap(jpeg.width, jpeg.height);
        bitmap.fillJPEG(jpeg.data);
        bitmap.__hash = hasher.hash(bitmap.data);
        return bitmap;
    }
    static fromGif(url) {
        var buffer = fs.readFileSync(url);
        let gif = (0, gifuct_js_1.parseGIF)(buffer);
        let frames = (0, gifuct_js_1.decompressFrames)(gif, true);
        return frames.map((v, i) => {
            let bitmap = new Bitmap(v.dims.width, v.dims.height);
            bitmap.fillGIF(v.pixels, v.colorTable);
            bitmap.__hash = hasher.hash(bitmap.data);
            return bitmap;
        });
    }
    fillPNG(data) {
        this.data = data;
    }
    fillGIF(pixels, colorTable) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                let index = pixels[y * this.width + x];
                let [r, g, b] = colorTable[index];
                this.setPixel(x, y, Color_1.Color.from(r, g, b));
            }
        }
    }
    fillJPEG(data) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                let index = y * this.width + x;
                let i = index * 4;
                this.setPixel(x, y, Color_1.Color.from(data[i++], data[i++], data[i++], data[i++]));
            }
        }
    }
    getPixel(x, y) {
        let idx = (this.width * y + x) << 2;
        if (idx < 0 || idx > this.data.length)
            return null;
        let r = this.data[idx + 0];
        let g = this.data[idx + 1];
        let b = this.data[idx + 2];
        let a = this.data[idx + 3];
        return Color_1.Color.from(r, g, b, a);
    }
    setPixel(x, y, color) {
        if (typeof color == "number") {
            color = Color_1.Color.fromHex(color);
        }
        let idx = (this.width * y + x) << 2;
        if (idx < 0 || idx > this.data.length)
            return;
        this.data[idx + 0] = color.r;
        this.data[idx + 1] = color.g;
        this.data[idx + 2] = color.b;
        this.data[idx + 3] = color.a;
    }
    colorForEach(method) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                let idx = (this.width * y + x) << 2;
                method(Color_1.Color.from(this.data[idx + 0], this.data[idx + 1], this.data[idx + 2], this.data[idx + 3]), x, y);
            }
        }
    }
    clear(rect) {
        rect = rect || this.rect;
        for (let y = rect.top; y <= rect.bottom; y++) {
            for (let x = rect.left; x <= rect.right; x++) {
                let idx = (this.width * y + x) << 2;
                this.data[idx + 0] = 0;
                this.data[idx + 1] = 0;
                this.data[idx + 2] = 0;
                this.data[idx + 3] = 0;
            }
        }
    }
    clone() {
        let instance = new Bitmap(this.width, this.height);
        instance.data = Buffer.alloc(this.data.length);
        this.data.copy(instance.data);
        return instance;
    }
    /**
     * @param mask:uint — 一个十六进制值，指定要考虑的 ARGB 颜色的位。通过使用 & (bitwise AND) 运算符，将颜色值与此十六进制值合并。
     * @param color:uint — 一个十六进制值，指定要匹配（如果 findColor 设置为 true）或不 匹配（如果 findColor 设置为 false）的 ARGB 颜色。
     * @param findColor:boolean (default = true) — 如果该值设置为 true，则返回图像中颜色值的范围。如果该值设置为 false，则返回图像中不存在此颜色的范围。
     * @return Rectangle — 指定颜色的图像区域。
     */
    getColorBoundsRect(mask, color, findColor = true) {
        let rect = this.rect;
        let data = this.data;
        let xMax = rect.width;
        let yMax = rect.height;
        let maskargb = Util_1.Util.hexToRGB32(mask);
        function test(argb) {
            var a = argb.a & maskargb.a;
            var r = argb.r & maskargb.r;
            var g = argb.g & maskargb.g;
            var b = argb.b & maskargb.b;
            var s = Util_1.Util.RGBToHex32({ a: a, r: r, g: g, b: b });
            return findColor ? (s | color) : !(s | color);
        }
        function forEach(method, direct = 'top') {
            switch (direct) {
                case 'top':
                    {
                        aa: for (var y = 0; y < yMax; y++) {
                            for (var x = 0; x < xMax; x++) {
                                if (method(x, y)) {
                                    break aa;
                                }
                            }
                        }
                    }
                    break;
                case 'bottom':
                    {
                        dd: for (var y = yMax - 1; y >= 0; y--) {
                            for (var x = 0; x < xMax; x++) {
                                if (method(x, y)) {
                                    break dd;
                                }
                            }
                        }
                    }
                    break;
                case 'left':
                    {
                        bb: for (var x = 0; x < xMax; x++) {
                            for (var y = 0; y < yMax; y++) {
                                if (method(x, y)) {
                                    break bb;
                                }
                            }
                        }
                    }
                    break;
                case 'right':
                    {
                        cc: for (var x = xMax - 1; x >= 0; x--) {
                            for (var y = 0; y < yMax; y++) {
                                if (method(x, y)) {
                                    break cc;
                                }
                            }
                        }
                    }
                    break;
            }
        }
        function getPixel32RGB(x, y) {
            var i = (x + y * xMax) * 4;
            return { r: data[i + 0], g: data[i + 1], b: data[i + 2], a: data[i + 3] };
        }
        var top = 0;
        var right = 0;
        var left = 0;
        var bottom = 0;
        forEach((x, y) => {
            if (test(getPixel32RGB(x, y))) {
                top = y;
                return true;
            }
            return false;
        }, 'top');
        forEach((x, y) => {
            if (test(getPixel32RGB(x, y))) {
                left = x;
                return true;
            }
            return false;
        }, 'left');
        forEach((x, y) => {
            if (test(getPixel32RGB(x, y))) {
                right = x;
                return true;
            }
            return false;
        }, 'right');
        forEach((x, y) => {
            if (test(getPixel32RGB(x, y))) {
                bottom = y;
                return true;
            }
            return false;
        }, 'bottom');
        return new Rectangle_1.Rectangle(left, top, right - left, bottom - top);
    }
    colorTransform(rect, colorTransform) {
        rect = rect || this.rect;
        colorTransform = colorTransform || new ColorTransform_1.ColorTransform();
        var data = this.data;
        var xMax = rect.x + rect.height;
        var yMax = rect.y + rect.height;
        for (var y = rect.y; y < yMax; y++) {
            for (var x = rect.x; x < xMax; x++) {
                var r = (y * this.width + x) * 4;
                var g = r + 1;
                var b = r + 2;
                var a = r + 3;
                data[r] = data[r] * colorTransform.redMultiplier +
                    colorTransform.redOffset;
                data[g] = data[g] * colorTransform.greenMultiplier +
                    colorTransform.greenOffset;
                data[b] = data[b] * colorTransform.blueMultiplier +
                    colorTransform.blueOffset;
                data[a] = data[a] * colorTransform.alphaMultiplier +
                    colorTransform.alphaOffset;
            }
        }
    }
    applyFilter(source, sourceRect, destPoint, filter) {
        var copy = this.clone();
        filter.run(sourceRect, this.data, copy.data);
    }
    compare(other) {
        if (this.width != other.width)
            return -3;
        if (this.height != other.height)
            return -4;
        if (this.data === other.data)
            return 0;
        var otherRGB, thisRGB, dif;
        var result = new Bitmap(this.width, this.height);
        for (var y = 0; y < this.height; y++) {
            for (var x = 0; x < this.width; x++) {
                otherRGB = Util_1.Util.hexToRGB(other.getPixel(x, y));
                thisRGB = Util_1.Util.hexToRGB(this.getPixel(x, y));
                dif = {
                    r: Math.abs(otherRGB.r - thisRGB.r),
                    g: Math.abs(otherRGB.g - thisRGB.g),
                    b: Math.abs(otherRGB.b - thisRGB.b)
                };
                result.setPixel(x, y, Util_1.Util.RGBToHex(dif));
            }
        }
        return result;
    }
    ;
    /**
     * 复制通道
     * @param {Bitmap} source 源图像
     * @param {BitmapChannel} fromChannel 源通道
     * @param {BitmapChannel} toChannel 目标通道
     * @param {Rectangle} sourceRect 区域
     * @param {Point} destPoint 偏移
     */
    copyChannel(source, fromChannel, toChannel, sourceRect, destPoint) {
        let sourceColor;
        let channelValue;
        if (!sourceRect)
            sourceRect = source.rect;
        if (!destPoint)
            destPoint = Point_1.Point.EMPTY;
        for (let y = 0; y < sourceRect.height; y++) {
            for (let x = 0; x < sourceRect.width; x++) {
                sourceColor = source.getPixel(sourceRect.x + x, sourceRect.y + y);
                switch (fromChannel) {
                    case BitmapChannel_1.BitmapChannel.RED:
                        channelValue = sourceColor.r;
                        break;
                    case BitmapChannel_1.BitmapChannel.GREEN:
                        channelValue = sourceColor.g;
                        break;
                    case BitmapChannel_1.BitmapChannel.BLUE:
                        channelValue = sourceColor.b;
                        break;
                    case BitmapChannel_1.BitmapChannel.ALPHA:
                        channelValue = sourceColor.a;
                        break;
                }
                // redundancy
                let color = this.getPixel(destPoint.x + x, destPoint.y + y);
                if (!color)
                    continue;
                switch (toChannel) {
                    case BitmapChannel_1.BitmapChannel.RED:
                        color.r = channelValue;
                        break;
                    case BitmapChannel_1.BitmapChannel.GREEN:
                        color.g = channelValue;
                        break;
                    case BitmapChannel_1.BitmapChannel.BLUE:
                        color.b = channelValue;
                        break;
                    case BitmapChannel_1.BitmapChannel.ALPHA:
                        color.a = channelValue;
                        break;
                }
                this.setPixel(destPoint.x + x, destPoint.y + y, color);
            }
        }
    }
    ;
    /**
     * 复制像素
     * @param source 源
     * @param sourceRect 源矩形
     * @param destPoint 偏移
     * @param alphaBitmap
     * @param alphaPoint
     * @param mergeAlpha
     */
    copyPixels(source, sourceRect, destPoint, alphaBitmap, alphaPoint, mergeAlpha) {
        if (!sourceRect)
            sourceRect = source.rect;
        if (!destPoint)
            destPoint = new Point_1.Point();
        for (let y = sourceRect.top; y < sourceRect.bottom; y++) {
            for (let x = sourceRect.left; x < sourceRect.right; x++) {
                let color = source.getPixel(x, y);
                if (!color)
                    continue;
                this.setPixel(x + destPoint.x, y + destPoint.y, color);
            }
        }
    }
    ;
    /**
     * 混合
     * @param blendMode 混合模式
     * @param target 混合目标
     * @param dest 偏移点
     */
    blend(blendMode, target, dest) {
    }
    /**
     * 绘制
     * @param source
     * @param matrix
     * @param colorTransform
     * @param blendMode
     * @param clipRect
     * @param smoothing
     */
    draw(source, matrix, colorTransform, blendMode, clipRect, smoothing) {
    }
    copyPixelTo(source, sourceRect, destPoint, padding, pixeledge) {
        let dstx = destPoint.x + padding;
        let dsty = destPoint.y + padding;
        let bottom = sourceRect.y + sourceRect.height + pixeledge * 2;
        let right = sourceRect.x + sourceRect.width + pixeledge * 2;
        for (let y = sourceRect.y; y < bottom; y++) {
            // if (Math.abs(rect.y - y) < padding || Math.abs(rect.bottom - y) <= padding) continue;
            let ty = Math.min(Math.max(sourceRect.y, y - pixeledge), sourceRect.y + sourceRect.height - 1);
            // let ty = y;
            for (let x = sourceRect.x; x < right; x++) {
                // if (Math.abs(rect.x - x) < padding || Math.abs(rect.right - x) <= padding) continue;
                let tx = Math.min(Math.max(sourceRect.x, x - pixeledge), sourceRect.x + sourceRect.width - 1);
                // let tx = x;
                this.setPixel(x - sourceRect.x + dstx, y - sourceRect.y + dsty, source.getPixel(tx, ty));
            }
        }
    }
    fillRect(rect, color) {
        if (typeof color == "number") {
            color = Color_1.Color.fromHex(color);
        }
        for (let y = rect.top; y < rect.bottom; y++) {
            for (let x = rect.left; x < rect.right; x++) {
                this.setPixel(x, y, color);
            }
        }
    }
    floodFill(x, y, color) {
        if (typeof color == "number") {
            color = Color_1.Color.fromHex(color);
        }
        for (let y1 = y; y1 < this.rect.height; y1++) {
            for (let x1 = x; x1 < this.rect.width; x1++) {
                this.setPixel(x1, y1, color);
            }
        }
    }
    noise(randomSeed, low, high, channelOptions, grayScale) {
        this.rand = this.rand || new PRNG_1.PRNG();
        this.rand.seed = randomSeed;
        var redChannel = BitmapChannel_1.BitmapChannel.RED;
        var greenChannel = BitmapChannel_1.BitmapChannel.GREEN;
        var blueChannel = BitmapChannel_1.BitmapChannel.BLUE;
        var data = this.data;
        low = low || 0;
        high = high || 255;
        channelOptions = channelOptions || 7;
        grayScale = grayScale || false;
        var pos, cr, cg, cb, gray;
        for (var y = 0; y < this.height; y++) {
            for (var x = 0; x < this.width; x++) {
                pos = (x + y * this.width) * 4;
                cr = this.rand.nextRange(low, high);
                cg = this.rand.nextRange(low, high);
                cb = this.rand.nextRange(low, high);
                if (grayScale) {
                    gray = (cr + cg + cb) / 3;
                    cr = cg = cb = gray;
                }
                data[pos + 0] = (channelOptions & redChannel) ? (1 * cr) :
                    0x00;
                data[pos + 1] = (channelOptions & greenChannel) ? (1 * cg) :
                    0x00;
                data[pos + 2] = (channelOptions & blueChannel) ? (1 * cb) :
                    0x00;
            }
        }
    }
    ;
    paletteMap(source, sourceRect, destPoint, redArray, greenArray, blueArray, alphaArray) {
        var bw = source.width - sourceRect.width - destPoint.x;
        var bh = source.height - sourceRect.height - destPoint.y;
        var dw = (bw < 0) ? sourceRect.width +
            (source.width - sourceRect.width - destPoint.x) :
            sourceRect.width;
        var dh = (bh < 0) ? sourceRect.height +
            (source.height - sourceRect.height - destPoint.y) :
            sourceRect.height;
        var sourceData = source.data;
        var sourcePos, destPos, sourceHex;
        var r, g, b, pos;
        var sx = sourceRect.x;
        var sy = sourceRect.y;
        var sw = source.width;
        var dx = destPoint.x;
        var dy = destPoint.y;
        var data = this.data;
        var w = this.width;
        for (var y = 0; y < dh; y++) {
            for (var x = 0; x < dw; x++) {
                sourcePos = ((x + sx) + (y + sy) * sw) * 4;
                r = sourceData[sourcePos + 0];
                g = sourceData[sourcePos + 1];
                b = sourceData[sourcePos + 2];
                pos = ((x + dx) + (y + dy) * w) * 4;
                data[pos + 0] = redArray[r];
                data[pos + 1] = greenArray[g];
                data[pos + 2] = blueArray[b];
            }
        }
    }
    ;
    perlinNoise(baseX, baseY, randomSeed, channelOptions, grayScale) {
        this.rand = this.rand || new PRNG_1.PRNG();
        this.rand.seed = randomSeed;
        var redChannel = BitmapChannel_1.BitmapChannel.RED;
        var greenChannel = BitmapChannel_1.BitmapChannel.GREEN;
        var blueChannel = BitmapChannel_1.BitmapChannel.BLUE;
        channelOptions = channelOptions || 7;
        grayScale = grayScale || false;
        var data = this.data;
        var numChannels = 0;
        if (channelOptions & redChannel) {
            this.simplexR = this.simplexR || new SimplexNoise_1.SimplexNoise(this.rand);
            this.simplexR.setSeed(randomSeed);
            numChannels++;
        }
        if (channelOptions & greenChannel) {
            this.simplexG = this.simplexG || new SimplexNoise_1.SimplexNoise(this.rand);
            this.simplexG.setSeed(randomSeed + 1);
            numChannels++;
        }
        if (channelOptions & blueChannel) {
            this.simplexB = this.simplexB || new SimplexNoise_1.SimplexNoise(this.rand);
            this.simplexB.setSeed(randomSeed + 2);
            numChannels++;
        }
        var pos, cr, cg, cb, gray;
        for (var y = 0; y < this.height; y++) {
            for (var x = 0; x < this.width; x++) {
                pos = (x + y * this.width) * 4;
                cr = (channelOptions & redChannel) ?
                    Math.floor(((this.simplexR.noise(x / baseX, y / baseY) + 1)
                        * 0.5) * 255) : 0x00;
                cg = (channelOptions & greenChannel) ?
                    Math.floor(((this.simplexG.noise(x / baseX, y / baseY) + 1)
                        * 0.5) * 255) : 0x00;
                cb = (channelOptions & blueChannel) ?
                    Math.floor(((this.simplexB.noise(x / baseX, y / baseY) + 1)
                        * 0.5) * 255) : 0x00;
                if (grayScale) {
                    gray = (cr + cg + cb) / numChannels;
                    cr = cg = cb = gray;
                }
                data[pos + 0] = cr;
                data[pos + 1] = cg;
                data[pos + 2] = cb;
            }
        }
    }
    ;
    threshold(source, sourceRect, destPoint, operation, threshold, color, mask, copySource) {
        if (!sourceRect)
            sourceRect = source.rect;
        if (!destPoint)
            destPoint = new Point_1.Point();
        if (!operation)
            operation = "<";
        threshold = threshold || 0.5;
        color = color || 0;
        mask = mask || 0xffffff;
        copySource = copySource || false;
        var bw = source.width - sourceRect.width - destPoint.x;
        var bh = source.height - sourceRect.height - destPoint.y;
        var dw = (bw < 0) ? sourceRect.width +
            (source.width - sourceRect.width - destPoint.x) :
            sourceRect.width;
        var dh = (bh < 0) ? sourceRect.height +
            (source.height - sourceRect.height - destPoint.y) :
            sourceRect.height;
        var sourceData = source.data;
        var sourcePos, destPos, sourceHex;
        var sx = sourceRect.x;
        var sy = sourceRect.y;
        var sw = source.width;
        for (var y = 0; y < dh; y++) {
            for (var x = 0; x < dw; x++) {
                sourcePos = ((x + sx) + (y + sy) * sw) * 4;
                sourceHex = Util_1.Util.RGBToHex({
                    r: sourceData[sourcePos],
                    g: sourceData[sourcePos + 1],
                    b: sourceData[sourcePos + 2]
                });
                switch (operation) {
                    case "<":
                        if ((sourceHex & mask) < (threshold & mask)) {
                            if (copySource) {
                                this.setPixel(x + destPoint.x, y + destPoint.y, sourceHex);
                            }
                            else {
                                this.setPixel(x + destPoint.x, y + destPoint.y, color);
                            }
                        }
                        break;
                    case "<=":
                        if ((sourceHex & mask) <= (threshold & mask)) {
                            if (copySource) {
                                this.setPixel(x + destPoint.x, y + destPoint.y, sourceHex);
                            }
                            else {
                                this.setPixel(x + destPoint.x, y + destPoint.y, color);
                            }
                        }
                        break;
                    case ">":
                        if ((sourceHex & mask) > (threshold & mask)) {
                            if (copySource) {
                                this.setPixel(x + destPoint.x, y + destPoint.y, sourceHex);
                            }
                            else {
                                this.setPixel(x + destPoint.x, y + destPoint.y, color);
                            }
                        }
                        break;
                    case ">=":
                        if ((sourceHex & mask) <= (threshold & mask)) {
                            if (copySource) {
                                this.setPixel(x + destPoint.x, y + destPoint.y, sourceHex);
                            }
                            else {
                                this.setPixel(x + destPoint.x, y + destPoint.y, color);
                            }
                        }
                        break;
                    case "==":
                        if ((sourceHex & mask) == (threshold & mask)) {
                            if (copySource) {
                                this.setPixel(x + destPoint.x, y + destPoint.y, sourceHex);
                            }
                            else {
                                this.setPixel(x + destPoint.x, y + destPoint.y, color);
                            }
                        }
                        break;
                    case "!=":
                        if ((sourceHex & mask) != (threshold & mask)) {
                            if (copySource) {
                                this.setPixel(x + destPoint.x, y + destPoint.y, sourceHex);
                            }
                            else {
                                this.setPixel(x + destPoint.x, y + destPoint.y, color);
                            }
                        }
                        break;
                }
            }
        }
    }
    ;
    /**
     * write file to disk
     * @param {PNG} png
     * @param {String} path
     */
    save(path) {
        return __awaiter(this, void 0, void 0, function* () {
            return fs.writeFileSync(path, yield this.getBuffer());
        });
    }
    /**
     * 转换成DataURL
     * @returns
     */
    toDataURL() {
        return __awaiter(this, void 0, void 0, function* () {
            return `data:image/png;base64,${yield this.toBase64()}`;
        });
    }
    fromBase64(base64) {
        return new Promise(reslove => {
            var matches = base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            if (matches) {
                if (matches.length !== 3) {
                    return new Error('Invalid input string');
                }
                let type = matches[1];
                base64 = matches[2];
            }
            const { width, height } = Util_1.Util.getBase64Size(base64);
            this.width = width;
            this.height = height;
            this.rect.set(0, 0, width, height);
            this.data = Util_1.Util.decodeBase64Image(base64);
            this.parse(Util_1.Util.decodeBase64Image(base64), (error, data) => {
                reslove();
            });
        });
    }
    /**
     * 转换成Base64编码
     * @returns
     */
    toBase64() {
        return __awaiter(this, void 0, void 0, function* () {
            return Util_1.Util.encodeBase64Image(yield this.getBuffer());
        });
    }
    getBuffer() {
        return new Promise(reslove => {
            if (!!this.__bufffer) {
                reslove(this.__bufffer);
                return;
            }
            var chunks = [];
            var size = 0;
            // 可写流实例
            const myWritable = new stream_1.Writable({
                write(chunk, encoding, callback) {
                    chunks.push(chunk);
                    size += chunk.length;
                    callback();
                }
            });
            // myWritable.on('pipe',  ()=> {
            //     console.log("pipe");
            // })
            myWritable.on('finish', () => {
                // console.log("finish");
                this.__bufffer = Buffer.concat(chunks, size);
                reslove(this.__bufffer);
            });
            this.pack().pipe(myWritable);
        });
    }
}
exports.Bitmap = Bitmap;
