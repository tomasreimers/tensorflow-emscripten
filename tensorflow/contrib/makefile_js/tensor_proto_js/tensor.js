const pb = require('./gen/tensorflow/core/framework/tensor_pb.js');
const te = require('text-encoding'); // polyfill for TextEncoder : http://stackoverflow.com/questions/8936984/uint8array-to-string-in-javascript
const _ = require('lodash');

module.exports = {};

function is_int(n){
    return Number(n) === n && n % 1 === 0;
}

function is_float(n){
    return Number(n) === n && n % 1 !== 0;
}

function extract_shape_and_type (arr, verify_shape = false) {
  let shape = undefined;
  let type = undefined;

  if (Array.isArray(arr) && arr.length !== 0) {
    // just expanding dimension
    [shape, type] = extract_shape_and_type(arr[0], verify_shape);

    // verify if we need to
    if (verify_shape) {
      for (let ii = 1; ii < arr.length; ii++) {
        verify_shape_and_type(arr[ii], shape, type)
      }
    }

    // expand the dimension
    shape.unshift(arr.length);
  } else {
    // dealing with literal
    shape = [];

    if (is_int(arr)) {
      type = pb.DataType.DT_INT32;
    } else if (is_float(arr)) {
      type = pb.DataType.DT_FLOAT32;
    } else {
      throw "Unknown type";
    }
  }

  return [shape, type];
};
// expose via underscore for debugging
module.exports._extract_shape_and_type = extract_shape_and_type;

function verify_shape_and_type (arr, shape, type) {
  if (shape.length === 0) {
    if (type === pb.DataType.DT_INT32 && !is_int(arr)) {
      throw "Expected int";
    } else if (type === pb.DataType.DT_FLOAT32 && !is_float(arr)) {
      throw "Expected float";
    }
  } else {
    if (arr.length !== shape[0]) {
      throw "Invalid dimension";
    }
    for (let ii = 0; ii < arr.length; ii++) {
      verify_shape_and_type(arr[ii], _.slice(arr, 1), type);
    }
  }
};

// takes in a multidimsional array and produces stringified tensor protobuf
module.exports.make_tensor = function (arr, verify_shape = false) {
  // extract shape and type
  [shape, type] = extract_shape_and_type(arr, verify_shape);

  // create the protobuf
  const tensor = new pb.TensorProto();
  const tensorShape = new pb.TensorShapeProto();

  let dimList = [];
  for (var ii = 0; ii < shape.length; ii++) {
    const dim = new pb.TensorShapeProto.Dim();
    dim.setSize(shape[ii]);
    dimList.push(dim);
  }

  tensorShape.setDimList(dimList);
  tensorShape.setUnknownRank(false);
  tensor.setTensorShape(tensorShape);

  tensor.setDtype(type);
  tensor.setVersionNumber(1);

  if (type === pb.DataType.DT_INT32) {
    if (Array.isArray(arr)) {
      tensor.setIntValList(_.flatten(arr));
    } else {
      tensor.setIntValList([arr]);
    }
  } else if (type === pb.DataType.DT_FLOAT32) {
    if (Array.isArray(arr)) {
      tensor.setFloatValList(_.flatten(arr));
    } else {
      tensor.setFloatValList([arr]);
    }
  } else {
    throw "Unsupported type";
  }

  // stringify
  const decoder = new te.TextDecoder('utf-8');
  return decoder.decode(tensor.serializeBinary());
};

// takes in stringifed tensor protobuf and produces a multidimsional array
module.exports.make_array = function (tpb) {
  // get the tensor object
  const encoder = new te.TextEncoder('utf-8');
  const tensor = new pb.TensorProto.deserializeBinary(encoder.encode(tpb));

  // get shape
  let shape = _.map(tensor.getTensorShape().getDimList(), (dim) => dim.getSize());

  // extract flat array of values
  let values_array = [];

  if (tensor.getDtype() === pb.DataType.DT_INT32) {
    if (tensor.getTensorContent()) {
      bytes = Uint8Array.from(tensor.getTensorContent_asU8())
      data = new Int32Array(bytes.buffer)

      values_array = [...data];
    } else {
      if (tensor.getIntValList().length === 1 && shape.length !== 0) {
        values_array = _.fill(Array(_.reduce(shape, _.multiply)), tensor.getIntValList()[0]);
      } else {
        values_array = tensor.getIntValList();
      }
    }
  } else if (tensor.getDtype() === pb.DataType.DT_FLOAT32) {
    if (tensor.getTensorContent()) {
      bytes = Uint8Array.from(tensor.getTensorContent_asU8())
      data = new Float32Array(bytes.buffer)

      values_array = [...data];
    } else {
      if (tensor.getFloatValList().length === 1 && shape.length !== 0) {
        values_array = _.fill(Array(_.reduce(shape, _.multiply)), tensor.getFloatValList()[0]);
      } else {
        values_array = tensor.getFloatValList();
      }
    }
  } else {
    throw "Unknown type";
  }

  // special case scalars
  if (shape.length === 0) {
    if (values_array.length !== 1) {
      throw "Expected scalar, got more than one value";
    }

    return values_array[0];
  }

  // resize array to appropriate size
  if (_.reduce(shape, _.multiply) !== values_array.length) {
    throw "Shape and values do not match";
  }

  let result = _.clone(values_array);

  // skip the last dimension because it's implicitly done
  for (var ii = shape.length - 1; ii > 0; ii--) {
    result = _.chunk(result, shape[ii]);
  }

  return result;
};
