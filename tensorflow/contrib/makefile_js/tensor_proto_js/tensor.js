const pb = require('./gen/tensorflow/core/framework/tensor_pb.js');
const _ = require('lodash');

// Modified from: https://developers.google.com/web/updates/2012/06/How-to-convert-ArrayBuffer-to-and-from-String
// Using this because require('text-encoding') because (at least at time of writing) encode(decode([128])) != [128] due to JS stirngs being UTF16
function ab2str(buf) {
  return String.fromCharCode.apply(null, new Uint8Array(buf));
}
function str2ab(str) {
  var buf = new ArrayBuffer(str.length); // 2 bytes for each char
  var bufView = new Uint8Array(buf);
  for (var i=0, strLen=str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return bufView;
}

module.exports = {
  ab2str: ab2str,
  str2ab: str2ab
};

const TYPES = {
  INT: pb.DataType.DT_INT32,
  FLOAT: pb.DataType.DT_FLOAT
};

module.exports.types = TYPES;

function extract_shape (arr, do_verify_shape = false) {
  let shape = undefined;

  if (Array.isArray(arr) && arr.length !== 0) {
    // just expanding dimension
    shape = extract_shape(arr[0], do_verify_shape);

    // verify if we need to
    if (do_verify_shape) {
      for (let ii = 1; ii < arr.length; ii++) {
        if (!verify_shape(arr[ii], shape)) {
          throw "Invalid dimension";
        }
      }
    }

    // expand the dimension
    shape.unshift(arr.length);
  } else {
    // dealing with literal
    shape = [];
  }

  return shape;
};
// expose via underscore for debugging
module.exports._extract_shape = extract_shape;

function verify_shape (arr, shape) {
  if (shape.length === 0) {
    /* do nothing */
  } else {
    if (arr.length !== shape[0]) {
      console.log("Expected length of " + shape[0] + ", got length of " + arr.length);
      return false;
    }
    for (let ii = 0; ii < arr.length; ii++) {
      if (!verify_shape(arr[ii], _.slice(shape, 1))) {
        console.log("In Dimension " + ii);
        return false;
      }
    }
  }
  return true;
};

// takes in a multidimsional array and produces stringified tensor protobuf
module.exports.make_tensor = function (arr, type = TYPES.INT, do_verify_shape = false) {
  // extract shape and type
  shape= extract_shape(arr, do_verify_shape);

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
      tensor.setIntValList(_.flattenDeep(arr));
    } else {
      tensor.setIntValList([arr]);
    }
  } else if (type === pb.DataType.DT_FLOAT) {
    if (Array.isArray(arr)) {
      tensor.setFloatValList(_.flattenDeep(arr));
    } else {
      tensor.setFloatValList([arr]);
    }
  } else {
    throw "Unsupported type";
  }

  // stringify
  if (!_.isEqual(tensor.serializeBinary(), str2ab(ab2str(tensor.serializeBinary())))) {
    throw "Unexpected encoding failure (does not decode to same val)";
  }

  return ab2str(tensor.serializeBinary());
};

// takes in stringifed tensor protobuf and produces a multidimsional array
module.exports.make_array = function (tpb) {
  // get the tensor object
  const tensor = new pb.TensorProto.deserializeBinary(str2ab(tpb));

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
  } else if (tensor.getDtype() === pb.DataType.DT_FLOAT) {
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
