let fs = require("fs");
let { Bitmap } = require("../dist/Bitmap");
const { BitmapChannel } = require("../dist/BitmapChannel");
const { Color } = require("../dist/Color");
const { Point } = require("../dist/Point");
const { Rectangle } = require("../dist/Rectangle");
const { Util } = require("../dist/Util");
const { Writable } = require('stream');

async function exec() {
    // console.log(fs.readFileSync("./test/assets/emoji_small.png", "base64"))
    let bitmap1 = await Bitmap.fromURL("./test/assets/1.png");
    let bitmap2 = await Bitmap.fromURL("./test/assets/2.png");

    let bitmap3 = bitmap1.clone();
    bitmap3.copyChannel(bitmap2, BitmapChannel.RED, BitmapChannel.ALPHA);
    await bitmap3.save("./test/out.png");
    Util.exportToHTML(`./test/out.html`, bitmap1, bitmap2, bitmap3);
}
exec();