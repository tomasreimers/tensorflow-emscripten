const tensorjs = require('tensorjs');
const image_ops = require('./image_ops.js');

// nasty hack to get around memory initializer non-sense
let cwd = process.cwd(); // TODO: Fix this
process.chdir(__dirname + '/../gen/bin/');
const graph_runner = require('../gen/bin/graph_runner.js');
process.chdir(cwd);

// utility function
function copy_array_to_vector(arr, vector) {
  for (var ii = 0; ii < arr.length; ii++) {
    vector.push_back(arr[ii]);
  }
}

function Session (graph_pb) {
  var self = this;
  self._session = new graph_runner.JSSession(graph_pb);
  self.run = function (inputs, outputs) {
    // because emscripten requires us to explicitly delete classes, we keep a list
    const trash_pile = [];

    // encode the inputs and outputs
    const input_pairs = [];
    const input_keys = Object.keys(inputs);
    for (let ii = 0; ii < Object.keys(inputs).length; ii++) {
      let tensor = graph_runner.parseTensor(
        inputs[input_keys[ii]]
      );
      let stpair = graph_runner.makeStringTensorPair(
        input_keys[ii],
        tensor
      )
      input_pairs.push(stpair);

      trash_pile.push(tensor);
      trash_pile.push(stpair);
    }

    const inputs_vector = new graph_runner.VectorStringTensorPair();
    const outputs_vector = new graph_runner.VectorString();

    trash_pile.push(inputs_vector);
    trash_pile.push(outputs_vector);

    copy_array_to_vector(input_pairs, inputs_vector);
    copy_array_to_vector(outputs, outputs_vector);

    // run
    const results_tensor_vector = self._session.run(inputs_vector, outputs_vector);
    const results_vector = graph_runner.tensorVectorToStringVector(
      results_tensor_vector
    );

    trash_pile.push(results_tensor_vector);
    trash_pile.push(results_vector);

    // decode the results
    const results = [];
    for (let ii = 0; ii < results_vector.size(); ii++) {
      results.push(
        tensorjs.make_array(results_vector.get(ii))
      );
    }

    // schedule cleanup
    setTimeout(() => {
      for (var ii = 0; ii < trash_pile.length; ii++) {
        trash_pile[ii].delete();
      }
    }, 0);

    // return results
    return results;
  };

  self.cleanup = function () {
    self._session.delete();
  };
};

module.exports = {
  "Session": Session,
  "image_ops": image_ops
};
