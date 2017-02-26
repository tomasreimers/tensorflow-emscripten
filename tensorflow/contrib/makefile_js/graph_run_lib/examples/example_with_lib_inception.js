const Canvas = require('canvas');
const Image = Canvas.Image;
const lib = require('../lib.js');
const tensorjs = require('tensorjs');
const fs = require('fs');
const mnist_data = require('./example_image_array.js');

// load image
const EDGE_LENGTH = 299;
const MEAN = 128;
const STD = 128;

// create canvas
console.log("Reading image...");

const orig_canvas = new Canvas(EDGE_LENGTH, EDGE_LENGTH);
const orig_ctx = orig_canvas.getContext('2d');

const imgbytes = fs.readFileSync('../../js_working_directory/dog.jpg');
const img = new Image();
img.src = imgbytes;

let top = 0;
let left = 0;
let size = 0;

if (img.width > img.height) {
  size = img.height;
  left = (img.width - img.height) / 2;
} else {
  size = img.width;
  top = (img.height - img.width) / 2;
}

orig_ctx.drawImage(img, left, top, size, size, 0, 0, EDGE_LENGTH, EDGE_LENGTH);
const img_data = orig_ctx.getImageData(0, 0, EDGE_LENGTH, EDGE_LENGTH);

// export array
console.log("Getting Tensor...");

const img_buf_data = lib.image_ops.get_array(img_data, false, MEAN, STD);

// initialize session
console.log("Initializing Graph...");
const graph_buf = fs.readFileSync('../../js_working_directory/inception.stripped.pb');
const sess = new lib.Session(graph_buf);

console.log("Computing results...");
const results = sess.run(
  {
    "Mul:0": tensorjs.floatTensorAB(img_buf_data)
  },
  ["softmax:0"]
);
console.log(results[0]);
