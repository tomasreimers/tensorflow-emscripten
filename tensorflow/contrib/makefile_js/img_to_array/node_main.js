const Canvas = require('canvas');
const Image = Canvas.Image;
const lib = require('./lib.js');
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
const imgbytes = fs.readFileSync('../js-working-dir/mnist_data/0.jpg');
const img = new Image();
img.src = imgbytes;
ctx.drawImage(img, 0, 0, WIDTH, HEIGHT);
const img_data = ctx.getImageData(0, 0, WIDTH, HEIGHT);

// export array
module.exports = lib.get_array(img_data, true, MEAN, STD);
