const lib = require('../lib.js');
const tensorjs = require('tensorjs');
const fs = require('fs');
const mnist_data = require('./example_image_array.js');

// TODO: Consider if there is some way to generalize this
const graph_buf = fs.readFileSync('../../js_working_directory/mnist.pb');
const graph_bufview = new Uint8Array(graph_buf);
let graph = "";
for (let ii = 0; ii < graph_bufview.length; ii++) {
  graph += String.fromCharCode(graph_bufview[ii]);
}

const sess = new lib.Session(graph);
const results = sess.run(
  {
    "Reshape": tensorjs.FloatTensor(mnist_data),
    "dropout": tensorjs.FloatTensor(1.0)
  },
  ["prediction_onehot"]
);
console.log(results[0]);
