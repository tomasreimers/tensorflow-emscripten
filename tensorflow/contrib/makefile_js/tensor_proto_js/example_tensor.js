const pb = require('./gen/tensorflow/core/framework/tensor_pb.js');
const te = require('text-encoding'); // polyfill for TextEncoder : http://stackoverflow.com/questions/8936984/uint8array-to-string-in-javascript

const tensor = new pb.TensorProto();
const tensorShape = new pb.TensorShapeProto();

const dim0 = new pb.TensorShapeProto.Dim();
dim0.setSize(2);

tensorShape.setDimList([dim0]);
tensorShape.setUnknownRank(false);

tensor.setDtype(pb.DataType.DT_INT32);
tensor.setTensorShape(tensorShape);
tensor.setVersionNumber(1);

tensor.setIntValList([5, 6]);

const decoder = new te.TextDecoder('utf-8')

console.log(
  JSON.stringify(decoder.decode(tensor.serializeBinary()))
);
