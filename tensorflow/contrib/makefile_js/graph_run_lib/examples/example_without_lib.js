const tensorjs = require('tensorjs');

// nasty hack to get around memory initializer non-sense
// TODO: Fix this
let cwd = process.cwd();
process.chdir('../../gen/bin/');
const graph_runner = require('../../gen/bin/graph_runner.js');
process.chdir(cwd);

const fs = require('fs');

// NOTE: This programs leaks memory like no other...
//       see ../lib.js for how to fix that

// utility function
function copy_array_to_vector(arr, vector) {
  for (var ii = 0; ii < arr.length; ii++) {
    vector.push_back(arr[ii]);
  }
}

// read basic graph
const graph_pb = fs.readFileSync("../js_working_directory/add_graph.pb", "utf8");

// construct session
const sess = new graph_runner.JSSession(graph_pb);

const inputs = [
  graph_runner.makeStringTensorPair(
    "a",
    graph_runner.parseTensor(tensorjs.make_tensor(2))
  ),
  graph_runner.makeStringTensorPair(
    "b",
    graph_runner.parseTensor(tensorjs.make_tensor(3))
  )
];
const outputs = ["o"];

const inputs_vector = new graph_runner.VectorStringTensorPair();
const outputs_vector = new graph_runner.VectorString();

copy_array_to_vector(inputs, inputs_vector);
copy_array_to_vector(outputs, outputs_vector);

// run
const sess_results = sess.run(inputs_vector, outputs_vector);
const results_vector = graph_runner.tensorVectorToStringVector(sess_results);

const results = [];
for (let ii = 0; ii < results_vector.size(); ii++) {
  results.push(tensor.make_array(results_vector.get(ii)));
}

console.log(results);
