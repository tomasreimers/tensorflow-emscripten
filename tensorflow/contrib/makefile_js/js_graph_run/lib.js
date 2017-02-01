const tensor = require('../tensor_proto_js/tensor.js');

// nasty hack to get around memory initializer non-sense
let cwd = process.cwd(); // TODO: Fix this
process.chdir('../gen/bin/');
const graph_runner = require('../gen/bin/graph_runner.js');
process.chdir(cwd);

// NOTE: This programs leaks memory like no other... should probably fix that

// figure out how to *NOT* define this upfront and force all tenosrs to be same
const TENSOR_TYPE = tensor.types.FLOAT;

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
    // encode the inputs and outputs
    const input_pairs = [];
    const input_keys = Object.keys(inputs);
    for (let ii = 0; ii < Object.keys(inputs).length; ii++) {
      input_pairs.push(
        graph_runner.makeStringTensorPair(
          input_keys[ii],
          graph_runner.parseTensor(
            tensor.make_tensor(inputs[input_keys[ii]], TENSOR_TYPE)
          )
        )
      );
    }

    const inputs_vector = new graph_runner.VectorStringTensorPair();
    const outputs_vector = new graph_runner.VectorString();

    copy_array_to_vector(input_pairs, inputs_vector);
    copy_array_to_vector(outputs, outputs_vector);

    // run
    const results_vector = graph_runner.tensorVectorToStringVector(
      self._session.run(inputs_vector, outputs_vector)
    );

    // decode the results
    const results = [];
    for (let ii = 0; ii < results_vector.size(); ii++) {
      results.push(
        tensor.make_array(results_vector.get(ii), TENSOR_TYPE)
      );
    }

    return results;
  };
};

module.exports = {
  "Session": Session
};
