const lib = require('./lib.js');
const tensor = require('../tensor_proto_js/tensor.js');
const fs = require('fs');
const mnist_data = require('../img_to_array/node_main.js');

const graph_buf = fs.readFileSync('../js-working-dir/mnist.pb');
const graph_bufview = new Uint8Array(graph_buf);
let graph = "";
for (let ii = 0; ii < graph_bufview.length; ii++) {
  graph += String.fromCharCode(graph_bufview[ii]);
}
const sess = new lib.Session(graph);
const results = sess.run({"Reshape": mnist_data, "dropout": 1.0}, ["prediction_onehot"]);
console.log(results[0]);
