import { parseGIF, decompressFrames } from 'gifuct-js'
import * as jpegjs from 'jpeg-js';
import { PNG, PNGOptions } from "pngjs";
import * as fs from "fs";
import * as path from "path";
import * as hash from "node-object-hash";
import { Color, IColor } from './Color';
import { Util } from './Util';
import { Rectangle } from './Rectangle';
import { ColorTransform } from './ColorTransform';
import { BlendMode, blendModeApply } from './BlendMode';
import { BitmapChannel } from './BitmapChannel';
import { PRNG } from './PRNG';
import { SimplexNoise } from './SimplexNoise';
import { ColorMatrix } from './ColorMatrix';
import { Matrix } from './Matrix';
import { Point } from './Point';
import { Writable } from 'stream';
import { ColorUtil } from './ColorUtil';

let hasher = (hash as any)({ coerce: { set: true, symbol: true } });

export class Bitmap extends PNG {
    private __hash: string;
    public rect: Rectangle;
    /**
     * 
     * @param { Number } width 
     * @param { Number } height 
     * @param { PNGOptions} options 
     */
    constructor(width: number, height: number, options?: PNGOptions) {
        super({ width: width, height: height, ...options });
        this.rect = new Rectangle(0, 0, width, height);
    }

    /**唯一哈希值 */
    public get hash() { return this.__hash }

    /**
     * 从url加载图像
     * @param {String} url 
     * @returns {Promise<Bitmap>}
     */
    static async fromURL(url: string) {
        let ext = path.extname(url);
        let result: Bitmap | (Bitmap[]);
        switch (ext) {
            case ".png":
                result = await Bitmap.loadPng(url);
                break;
            case ".jpeg":
            case ".jpg":
                result = Bitmap.loadJpeg(url);
                break;
            case ".gif":
                result = Bitmap.loadGif(url);
                break;
        }
        return result;
    }

    /**
     * 加载PNG
     * @param url 
     * @returns 
     */
    static loadPng(url: string): Promise<Bitmap> {
        let buffer = fs.readFileSync(url);
        return new Promise<Bitmap>((reslove, reject) => {
            let bitmap = new Bitmap(undefined, undefined, { filterType: 4 });
            bitmap.decodePNG(buffer).then(() => {
                bitmap.__hash = hasher.hash(bitmap.data);
                bitmap.rect.set(0, 0, bitmap.width, bitmap.height);
                reslove(bitmap);
            })
        });
    }

    /**
     * 加载JPG/JPEG
     * @param url 
     * @returns 
     */
    static loadJpeg(url: string): Bitmap {
        let buffer = fs.readFileSync(url);
        let jpeg = jpegjs.decode(buffer, { useTArray: true, formatAsRGBA: true });
        let bitmap = new Bitmap(jpeg.width, jpeg.height);
        bitmap.decodeJPEG(jpeg.data);
        bitmap.__hash = hasher.hash(bitmap.data);
        return bitmap;
    }

    /**
     * 加载GIF
     * @param url 
     * @returns 
     */
    static loadGif(url: string): Bitmap[] {
        let buffer = fs.readFileSync(url);
        let gif = parseGIF(buffer);
        let frames = decompressFrames(gif, true);
        return frames.map((v, i) => {
            let bitmap = new Bitmap(v.dims.width, v.dims.height);
            bitmap.decodeGIF(v.pixels, v.colorTable);
            bitmap.__hash = hasher.hash(bitmap.data);
            return bitmap;
        });
    }

    /**
     * 解析PNG
     * @param { Buffer } buffer 
     */
    private decodePNG(buffer: Buffer) {
        return new Promise<void>((reslove, reject) => {
            this.parse(buffer, (error, png) => {
                if (error) {
                    reject(error);
                    return;
                }
                reslove();
            });
        });
    }

    /**
     * 解析GIF
     * @param { Array<Number> } pixels GIF 颜色数据
     * @param { Array<Number,Number,Number> } colorTable GIF颜色表
     */
    private decodeGIF(pixels: number[], colorTable: [number, number, number][]) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                let index = pixels[y * this.width + x];
                let [r, g, b] = colorTable[index];
                this.setPixel32(x, y, Color.fromRBG(r, g, b));
            }
        }
        return Promise.resolve();
    }

    /**
     * 解析JPG/JPEG
     * @param { Uint8Array } buffer  
     */
    private decodeJPEG(buffer: Uint8Array) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                let index = y * this.width + x;
                let i = index * 4;
                this.setPixel32(x, y, Color.fromRBG(buffer[i++], buffer[i++], buffer[i++], buffer[i++]));
            }
        }
        return Promise.resolve();
    }
    /**
     * 获取指定像素颜色值
     * @param {Number} x 
     * @param {Number} y 
     * @returns {Color}
     */
    getPixel(x: number, y: number) {
        let idx = (this.width * y + x) << 2;
        if (idx < 0 || idx > this.data.length) return null;
        let r: number = this.data[idx + 0];
        let g: number = this.data[idx + 1];
        let b: number = this.data[idx + 2];
        return Color.fromRBG(r, g, b, 0xFF);
    }

    /**
     * 设置指定像素颜色值
     * @param {Number} x 
     * @param {Number} y 
     * @param {Color|uint} color 
     * @returns 
     */
    setPixel(x: number, y: number, color: Color | number) {
        if (typeof color == "number") {
            color = Color.from(color);
        }
        let idx = (this.width * y + x) << 2;
        if (idx < 0 || idx > this.data.length) return;
        this.data[idx + 0] = color.r;
        this.data[idx + 1] = color.g;
        this.data[idx + 2] = color.b;
        this.data[idx + 3] = color.a;
    }

    /**
     * 获取指定像素颜色值
     * @param {Number} x 
     * @param {Number} y 
     * @returns {Color}
     */
    getPixel32(x: number, y: number) {
        let idx = (this.width * y + x) << 2;
        if (idx < 0 || idx > this.data.length) return null;
        let r: number = this.data[idx + 0];
        let g: number = this.data[idx + 1];
        let b: number = this.data[idx + 2];
        let a: number = this.data[idx + 3];
        return Color.fromRBG(r, g, b, a);
    }

    /**
     * 设置指定像素颜色值
     * @param {Number} x 
     * @param {Number} y 
     * @param {Color|uint} color 
     * @returns 
     */
    setPixel32(x: number, y: number, color: Color | number) {
        if (typeof color == "number") {
            color = Color.from32(color);
        }
        let idx = (this.width * y + x) << 2;
        if (idx < 0 || idx > this.data.length) return;
        this.data[idx + 0] = color.r;
        this.data[idx + 1] = color.g;
        this.data[idx + 2] = color.b;
        this.data[idx + 3] = color.a;
    }

    /**
     * 像素遍历
     * @param {function(color: Color, x: number, y: number):void} method 
     */
    forEachPixels(method: (color: Color, x: number, y: number) => void) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                let idx = (this.width * y + x) << 2;
                let color = Color.fromRBG(this.data[idx + 0], this.data[idx + 1], this.data[idx + 2], this.data[idx + 3]);
                method(color, x, y);
                color.recorver();
            }
        }
    }
    /**
     * 像素遍历
     * @param {function(color: Color, x: number, y: number):void} method 
     */
    forEachPixelsByRect(rect: Rectangle, method: (color: Color, x: number, y: number) => void) {
        for (let y = rect.top; y < rect.bottom; y++) {
            for (let x = rect.left; x < rect.right; x++) {
                let idx = (this.width * y + x) << 2;
                let color = Color.fromRBG(this.data[idx + 0], this.data[idx + 1], this.data[idx + 2], this.data[idx + 3]);
                method(color, x, y);
                color.recorver();
            }
        }
    }
    /**
     * 清楚像素所有颜色
     * - 图像完全透明
     * @param {Rectangle} rect 指定清除区域
     */
    clear(rect?: Rectangle) {
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

    /**
     * 克隆图像
     * @returns {Bitmap}
     */
    clone() {
        let instance = new Bitmap(this.width, this.height);
        instance.data = Buffer.alloc(this.data.length);
        this.data.copy(instance.data);
        return instance;
    }

    /**
     * 获得颜色区域
     * @param {uint} mask 颜色掩码 ,一个十六进制值，指定要考虑的 ARGB 颜色的位。通过使用` & (bitwise AND) `运算符，将颜色值与此十六进制值合并。
     * @param {uint} color 要查找的颜色 ,一个十六进制值，指定要匹配(如果`findColor`设置为`true`)或不匹配(如果`findColor`设置为`false`)的 ARGB 颜色。
     * @param {boolean} findColor 匹配颜色还是反向匹配颜色 , 如果该值设置为`true`，则返回图像中颜色值的范围。如果该值设置为`false`，则返回图像中不存在此颜色的范围。
     * @return {Rectangle} 指定颜色的图像区域。
     */
    getColorBoundsRect(mask: number, color: number, findColor = true) {
        let rect = this.rect;
        let data = this.data;
        let xMax = rect.width;
        let yMax = rect.height;
        let maskargb: IColor = ColorUtil.extract32(mask);

        function test(argb) {
            let a = argb.a & maskargb.a;
            let r = argb.r & maskargb.r;
            let g = argb.g & maskargb.g;
            let b = argb.b & maskargb.b;
            let s = ColorUtil.merge32(a, r, g, b);
            return findColor ? (s | color) : !(s | color);
        }

        function forEach(method, direct = 'top') {
            switch (direct) {
                case 'top': {
                    aa:
                    for (let y = 0; y < yMax; y++) {
                        for (let x = 0; x < xMax; x++) {
                            if (method(x, y)) {
                                break aa;
                            }
                        }
                    }
                } break;
                case 'bottom': {
                    dd:
                    for (let y = yMax - 1; y >= 0; y--) {
                        for (let x = 0; x < xMax; x++) {
                            if (method(x, y)) {
                                break dd;
                            }
                        }
                    }
                } break;
                case 'left': {
                    bb:
                    for (let x = 0; x < xMax; x++) {
                        for (let y = 0; y < yMax; y++) {
                            if (method(x, y)) {
                                break bb;
                            }
                        }
                    }
                } break;
                case 'right': {
                    cc:
                    for (let x = xMax - 1; x >= 0; x--) {
                        for (let y = 0; y < yMax; y++) {
                            if (method(x, y)) {
                                break cc;
                            }
                        }
                    }
                } break;
            }
        }

        function getPixel32RGB(x, y) {
            let i = (x + y * xMax) * 4;
            return { r: data[i + 0], g: data[i + 1], b: data[i + 2], a: data[i + 3] };
        }
        let top = 0;
        let right = 0;
        let left = 0;
        let bottom = 0;
        forEach((x, y) => {
            if (test(getPixel32RGB(x, y))) {
                top = y;
                return true;
            }
            return false;
        }, 'top')
        forEach((x, y) => {
            if (test(getPixel32RGB(x, y))) {
                left = x;
                return true;
            }
            return false;
        }, 'left')
        forEach((x, y) => {
            if (test(getPixel32RGB(x, y))) {
                right = x;
                return true;
            }
            return false;
        }, 'right')
        forEach((x, y) => {
            if (test(getPixel32RGB(x, y))) {
                bottom = y
                return true;
            }
            return false;
        }, 'bottom')
        return new Rectangle(left, top, right - left, bottom - top);
    }

    /**
     * 颜色变换
     * @param {Rectangle} rect 需要处理的区域
     * @param {ColorTransform} colorTransform 变换值
     */
    colorTransform(rect: Rectangle, colorTransform: ColorTransform) {
        rect = rect || this.rect;
        colorTransform = colorTransform || new ColorTransform();

        let data = this.data;
        let xMax = rect.x + rect.height;
        let yMax = rect.y + rect.height;

        for (let y = rect.y; y < yMax; y++) {
            for (let x = rect.x; x < xMax; x++) {
                let r = (y * this.width + x) * 4;
                let g = r + 1;
                let b = r + 2;
                let a = r + 3;

                data[r] = data[r] * colorTransform.redMultiplier + colorTransform.redOffset;
                data[g] = data[g] * colorTransform.greenMultiplier + colorTransform.greenOffset;
                data[b] = data[b] * colorTransform.blueMultiplier + colorTransform.blueOffset;
                data[a] = data[a] * colorTransform.alphaMultiplier + colorTransform.alphaOffset;
            }
        }
    }

    /**
     * 颜色矩阵
     * @param {ColorMatrix} maxtrix 要应用的颜色矩阵。
     * @param {Rectangle} rect 源矩形，决定着对那一块区域使用滤镜。
     * @param {Point} dest 目标点，使用到目标位图数据后对滤镜区域进行坐标偏移。
     */
    colorMatrix(maxtrix: ColorMatrix, rect?: Rectangle, dest?: Point) {
        rect = rect ?? this.rect;
        dest = dest ?? Point.EMPTY;
        this.forEachPixelsByRect(rect, (color, x, y) => {
            this.setPixel32(x + dest.x, y + dest.y, maxtrix.exec(color));
        });
    }

    /**
     * 对两个位图数据进行比较。
     * - 要求两个位图数据的高、宽要一样，否则无法比较。
     * - 比较时红色跟红色比，绿色跟绿色比，蓝色跟蓝色比，请注意，他们的差值永远是正的，也就是要取绝对值。
     * - 比较的结果是返回一个新Object,需要强制转换为BitmapData
     * - 如果两个位图数据高、宽、颜色完全一样，则比较没有意义。生成的bitmapData=null.
     * - 上面的比较都在忽略alpha的基础上，如果两个位图数据有不同的alpha，比较可能变得更加复杂，不才经过几次测试后仍不能得到正确的答案。
     * @param {Bitmap} other 
     * @returns {Bitmap} 两张位图的差异化图像
     * @returns {Number} 比较结果 `-3:width不一致` `-4:height不一致` `0:同一图像`
     */
    compare(other: Bitmap) {
        if (this.width != other.width) return -3;
        if (this.height != other.height) return -4;
        if (this.data === other.data) return 0;

        let otherRGB: Color;
        let thisRGB: Color;
        let dif: Color = Color.from();
        let result = new Bitmap(this.width, this.height);
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                otherRGB = other.getPixel32(x, y);
                thisRGB = this.getPixel32(x, y);

                dif.reset(
                    Math.abs(otherRGB.r - thisRGB.r),
                    Math.abs(otherRGB.g - thisRGB.g),
                    Math.abs(otherRGB.b - thisRGB.b),
                    Math.abs(otherRGB.a - thisRGB.a))

                result.setPixel32(x, y, dif);
            }
        }
        return result;
    };

    /**
     * 复制通道
     * @param {Bitmap} source 源图像
     * @param {BitmapChannel} fromChannel 源通道
     * @param {BitmapChannel} toChannel 目标通道
     * @param {Rectangle} sourceRect 区域
     * @param {Point} destPoint 偏移
     */
    copyChannel(source: Bitmap, fromChannel: BitmapChannel, toChannel: BitmapChannel, sourceRect?: Rectangle, destPoint?: Point) {
        let sourceColor: Color;
        let channelValue: number;
        if (!sourceRect) sourceRect = source.rect;
        if (!destPoint) destPoint = Point.EMPTY;
        for (let y = 0; y < sourceRect.height; y++) {
            for (let x = 0; x < sourceRect.width; x++) {
                sourceColor = source.getPixel32(sourceRect.x + x, sourceRect.y + y);
                switch (fromChannel) {
                    case BitmapChannel.RED: channelValue = sourceColor.r; break;
                    case BitmapChannel.GREEN: channelValue = sourceColor.g; break;
                    case BitmapChannel.BLUE: channelValue = sourceColor.b; break;
                    case BitmapChannel.ALPHA: channelValue = sourceColor.a; break;
                }

                // redundancy
                let color = this.getPixel32(destPoint.x + x, destPoint.y + y);
                if (!color) continue;
                switch (toChannel) {
                    case BitmapChannel.RED: color.r = channelValue; break;
                    case BitmapChannel.GREEN: color.g = channelValue; break;
                    case BitmapChannel.BLUE: color.b = channelValue; break;
                    case BitmapChannel.ALPHA: color.a = channelValue; break;
                }
                this.setPixel32(destPoint.x + x, destPoint.y + y, color);
            }
        }
    };

    /**
     * 复制图像
     * @param source 源
     * @param sourceRect 源矩形
     * @param destPoint 偏移
     * @param alphaBitmap 
     * @param alphaPoint 
     * @param mergeAlpha 
     */
    copyPixels(source: Bitmap, sourceRect?: Rectangle, destPoint?: Point, alphaBitmap?: Bitmap, alphaPoint?: Point, mergeAlpha?: boolean) {
        if (!sourceRect) sourceRect = source.rect;
        if (!destPoint) destPoint = new Point();
        for (let y = sourceRect.top; y < sourceRect.bottom; y++) {
            for (let x = sourceRect.left; x < sourceRect.right; x++) {
                let color = source.getPixel32(x, y);
                if (!color) continue;
                this.setPixel32(x + destPoint.x, y + destPoint.y, color);
            }
        }
    };

    /**
     * 放置图像
     * @param source 源图像
     * @param sourceRect 源图像矩形
     * @param destPoint 偏移点
     * @param padding 间隙
     * @param pixeledge 像素边缘扩展
     */
    putPixelsTo(source: Bitmap, sourceRect: Rectangle, destPoint: Point, padding: number, pixeledge: number) {
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
                this.setPixel32(
                    x - sourceRect.x + dstx,
                    y - sourceRect.y + dsty,
                    source.getPixel32(tx, ty));
            }
        }
    }

    /**
     * 混合图像
     * @param { BlendMode} blendMode 混合模式
     * @param { Bitmap} target 混合目标
     * @param { Point} dest 偏移点 
     */
    blend(target: Bitmap, blendMode: BlendMode, dest?: Point) {
        blendModeApply.exec(this, target, blendMode, dest);
    }

    // /**
    //  * 绘制图像
    //  * @param {Bitmap} source 要绘制的图像
    //  * @param {Matrix} matrix 使用矩阵，因为draw()方法不考虑对象的坐标，缩放，旋转的因素，所在需要使用matrix来达到移动，缩放，旋转等功能。
    //  * @param {ColorTransform} colorTransform 颜色变化。
    //  * @param {BlendMode} blendMode 混合模式。
    //  * @param {Rectangle} clipRect 要绘制的矩形区域。
    //  * @param {smoothing} smoothing 是否进行平滑处理，使用matrix后，对象可能会有锯齿，要求source是bitmapData是才有作用。
    //  */
    // draw(source: Bitmap, matrix: Matrix, colorTransform: ColorTransform, blendMode: BlendMode, clipRect: Rectangle, smoothing?: boolean) {

    // }

    /**
     * 用指定颜色填充区域
     * @param {Rectangle} rect 填充区域
     * @param {Color | number} color 颜色
     */
    fillRect(rect: Rectangle, color: Color | number) {
        if (typeof color == "number") {
            color = Color.from32(color);
        }
        for (let y = rect.top; y < rect.bottom; y++) {
            for (let x = rect.left; x < rect.right; x++) {
                this.setPixel32(x, y, color);
            }
        }
    }

    /**
     * 用指定颜色在指定坐标开始填充
     * @param {Number} x 
     * @param {Number} y 
     * @param {Color | number} color 颜色 
     */
    floodFill(x, y, color: Color | number) {
        if (typeof color == "number") {
            color = Color.from32(color);
        }
        for (let y1 = y; y1 < this.rect.height; y1++) {
            for (let x1 = x; x1 < this.rect.width; x1++) {
                this.setPixel32(x1, y1, color);
            }
        }
    }

    private rand: PRNG;
    /**
     * 生成噪点
     * @param randomSeed 随机种子
     * @param low 0-255 之间的最低值 默认 0
     * @param high 0-255 之间的最高值 默认 255
     * @param channelOptions 一个数字，可以是四个颜色通道值的任意组合。默认 7
     * @param grayScale 是否灰度 默认 false
     */
    noise(randomSeed: number, low?: number, high?: number, channelOptions?: number, grayScale?: boolean) {
        this.rand = this.rand || new PRNG();
        this.rand.seed = randomSeed;

        let redChannel = BitmapChannel.RED;
        let greenChannel = BitmapChannel.GREEN;
        let blueChannel = BitmapChannel.BLUE;

        let data = this.data;

        low = low || 0;
        high = high || 255;
        channelOptions = channelOptions || 7;
        grayScale = grayScale || false;

        let pos, cr, cg, cb, gray;
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
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

    /**
     * 调色板
     * @param {Bitmap} source 源图像
     * @param {Rectangle} sourceRect 源图像区域
     * @param {Point} destPoint 偏移点
     * @param {Bitmap} redArray 红通道的数据映射数组
     * @param {Bitmap} greenArray 绿通道的数据映射数组
     * @param {Bitmap} blueArray 蓝的数据映射数组
     * @param {Bitmap} alphaArray 透明通道的数据映射数组
     */
    paletteMap(source: Bitmap, sourceRect: Rectangle, destPoint: Point, redArray?: number[], greenArray?: number[], blueArray?: number[], alphaArray?: number[]) {
        let bw = source.width - sourceRect.width - destPoint.x;
        let bh = source.height - sourceRect.height - destPoint.y;

        let dw = (bw < 0) ? sourceRect.width +
            (source.width - sourceRect.width - destPoint.x) :
            sourceRect.width;
        let dh = (bh < 0) ? sourceRect.height +
            (source.height - sourceRect.height - destPoint.y) :
            sourceRect.height;

        let sourceData = source.data;
        let sourcePos, destPos, sourceHex;
        let r, g, b, a, pos;

        let sx = sourceRect.x;
        let sy = sourceRect.y;
        let sw = source.width;
        let dx = destPoint.x;
        let dy = destPoint.y;

        let data = this.data;
        let w = this.width;

        let hasRed = !!redArray;
        let hasGreen = !!greenArray;
        let hasBlue = !!blueArray;
        let hasAlpha = !!alphaArray;
        for (let y = 0; y < dh; y++) {
            for (let x = 0; x < dw; x++) {
                sourcePos = ((x + sx) + (y + sy) * sw) * 4;

                r = sourceData[sourcePos + 0];
                g = sourceData[sourcePos + 1];
                b = sourceData[sourcePos + 2];
                a = sourceData[sourcePos + 3];

                pos = ((x + dx) + (y + dy) * w) * 4;

                if (hasRed) data[pos + 0] = redArray[r];
                if (hasGreen) data[pos + 1] = greenArray[g];
                if (hasBlue) data[pos + 2] = blueArray[b];
                if (hasAlpha) data[pos + 3] = alphaArray[a];
            }
        }
    }

    /**
     * 图像颜色反转
     */
    revert() {
        let redArr: number[] = [];
        let blurArr: number[] = [];
        let greenArr: number[] = [];
        for (let i = 255; i > -1; i--) {
            redArr.push(0o0 << 24 | i << 16 | 0 << 8 | 0o0);
            blurArr.push(0o0 << 24 | 0 << 16 | i << 8 | 0o0);
            greenArr.push(0o0 << 24 | 0 << 16 | 0 << 8 | i);
        }
        this.paletteMap(this, this.rect, new Point(), redArr, blurArr, greenArr);
    }

    private simplexR: SimplexNoise;
    private simplexG: SimplexNoise;
    private simplexB: SimplexNoise;

    /**
     * 柏林噪音
     * - 能模拟云彩，瀑布等纹理。
     * @param {Number} baseX 在X轴方向生成的纹理大小。
     * @param {Number} baseY 在Y轴方向生成的纹理大小。
     * @param {Number} randomSeed 伪随机种子
     * @param {Number} channelOptions 一个数字，可以是四个颜色通道值（BitmapDataChannel.RED、BitmapDataChannel.BLUE、BitmapDataChannel.GREEN 和 BitmapDataChannel.ALPHA）的任意组合。 您可以使用逻辑 OR 运算符（|）来组合通道值。
     * @param {Boolean} grayScale 是否是灰度图像
     */
    perlinNoise(baseX: number, baseY: number, randomSeed: number, channelOptions?: number, grayScale?: boolean) {
        this.rand = this.rand || new PRNG();
        this.rand.seed = randomSeed;

        let redChannel = BitmapChannel.RED;
        let greenChannel = BitmapChannel.GREEN;
        let blueChannel = BitmapChannel.BLUE;

        channelOptions = channelOptions || 7;
        grayScale = grayScale || false;

        let data = this.data;

        let numChannels = 0;
        if (channelOptions & redChannel) {
            this.simplexR = this.simplexR || new SimplexNoise(this.rand);
            this.simplexR.setSeed(randomSeed);
            numChannels++;
        }
        if (channelOptions & greenChannel) {
            this.simplexG = this.simplexG || new SimplexNoise(this.rand);
            this.simplexG.setSeed(randomSeed + 1);
            numChannels++;
        }
        if (channelOptions & blueChannel) {
            this.simplexB = this.simplexB || new SimplexNoise(this.rand);
            this.simplexB.setSeed(randomSeed + 2);
            numChannels++;
        }

        let pos, cr, cg, cb, gray;
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
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

    /**
     * write file to disk
     * @param {PNG} png 
     * @param {String} path 
     */
    async save(path: string) {
        return fs.writeFileSync(path, await this.packToBuffer());
    }

    /**
     * 转换成DataURL
     * @returns 
     */
    async toDataURL() {
        return `data:image/png;base64,${await this.toBase64()}`
    }

    /**
     * 从Base64获取图像
     * @param {String} base64 
     * @returns 
     */
    fromBase64(base64: string) {
        return new Promise<void>(reslove => {
            let matches = base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            if (matches) {
                if (matches.length !== 3) {
                    return new Error('Invalid input string');
                }
                let type = matches[1];
                base64 = matches[2];
            }
            const { width, height } = Util.getBase64Size(base64);
            this.width = width;
            this.height = height;
            this.rect.set(0, 0, width, height);
            this.data = Util.decodeBase64Image(base64) as Buffer;
            this.parse(Util.decodeBase64Image(base64) as Buffer, (error, data) => {
                reslove();
            });
        })
    }

    /**
     * 转换成Base64编码
     * @returns 
     */
    async toBase64() {
        return Util.encodeBase64Image(await this.packToBuffer());
    }

    private __bufffer: Buffer;
    /**
     * 打包成Buffer
     * @returns 
     */
    packToBuffer() {
        return new Promise<Buffer>(reslove => {
            if (!!this.__bufffer) {
                reslove(this.__bufffer);
                return;
            }
            let chunks = [];
            let size = 0;
            // 可写流实例
            const myWritable = new Writable({
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
                this.__bufffer = Buffer.concat(chunks, size)
                reslove(this.__bufffer);
            });
            this.pack().pipe(myWritable);
        })
    }
}

