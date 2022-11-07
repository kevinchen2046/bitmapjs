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
const { ColorTransform } = require("../dist/ColorTransform");
async function exec() {
    
    let bitmap1 = await Bitmap.fromURL("./test/assets/dog.png");
    let bitmap2 = await Bitmap.fromURL("./test/assets/emoji.png");

    bitmap1.colorTransform(new ColorTransform(1.5))
    let buffer=await bitmap1.save("./test/out.png");
    Util.exportToHTML(`./test/out.html`,buffer);
}
exec();
