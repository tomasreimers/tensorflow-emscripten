const lib = require('./lib.js');
const fs = require('fs');

const graph = fs.readFileSync('../js-working-dir/add_graph.pb', 'utf8');
const sess = new lib.Session(graph);
const results = sess.run({"a": 5, "b": 6}, ["o"]);
console.log(results[0]);
