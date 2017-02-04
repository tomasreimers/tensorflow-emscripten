// This demo is intended for node, so we need to shim the canvas object
const Canvas = require('canvas');
const Image = Canvas.Image;
const lib = require('../lib.js');
const fs = require('fs');

// constants
const WIDTH = 28;
const HEIGHT = 28;
const MEAN = 0;
const STD = 255;

// create canvas
const canvas = new Canvas(WIDTH, HEIGHT);
const ctx = canvas.getContext('2d');

// get image
// TODO : Should consider ways to resize image, wouldn't want to distort image
//        by changing height/width ratio if not originally a sq
//        Look at img.width and img.height (to get original width/height)
const imgbytes = fs.readFileSync('../../js_working_directory/mnist_data/0.jpg');
const img = new Image();
img.src = imgbytes;
ctx.drawImage(img, 0, 0, WIDTH, HEIGHT);
const img_data = ctx.getImageData(0, 0, WIDTH, HEIGHT);

// export array
module.exports = lib.image_ops.get_array(img_data, true, MEAN, STD);
