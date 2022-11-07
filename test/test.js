let fs = require("fs");
let { Bitmap } = require("../dist/Bitmap");
const { BitmapChannel } = require("../dist/BitmapChannel");
const { Color } = require("../dist/Color");
const { Point } = require("../dist/Point");
const { Rectangle } = require("../dist/Rectangle");
const { Util } = require("../dist/Util");
const { Writable } = require('stream');
const { BlendMode } = require("../dist/BlendMode");
const { ColorUtil } = require("../dist/ColorUtil");
const { ColorMatrix } = require("../dist/ColorMatrix");

async function exec() {
    // console.log(fs.readFileSync("./test/assets/emoji_small.png", "base64"))
    let bitmap1 = await Bitmap.fromURL("./test/assets/1.png");
    let bitmap2 = await Bitmap.fromURL("./test/assets/2.png");

    let bitmap3 = bitmap2.clone();
    //bitmap3.perlinNoise(4,4,10,7,true);
    // console.log(bitmap3.getPixel(10, 10).toHex())
    // bitmap3.blend(bitmap2,BlendMode.LIGHTEN);
    bitmap3.colorMatrix(ColorMatrix.gray);
    // bitmap3.copyChannel(bitmap2, BitmapChannel.RED, BitmapChannel.ALPHA);
    await bitmap3.save("./test/out.png");
    // Util.exportToHTML(`./test/out.html`, bitmap1, bitmap2, bitmap3);
}
exec();

// console.log(ColorUtil.extract32(0x33FFCCDD));
// console.log(ColorUtil.merge32(51,255,204,221).toString(16))