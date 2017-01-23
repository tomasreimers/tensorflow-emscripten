# the protobuf compiler (protoc) causes me some serious headaches. Must run this
# from the root of the repository.

mkdir -p ./tensorflow/contrib/makefile_js/tensor_proto_js/gen/

protoc \
  --proto_path=./ \
  --js_out=import_style=commonjs,binary:./tensorflow/contrib/makefile_js/tensor_proto_js/gen/ \
  tensorflow/core/framework/tensor.proto \
  tensorflow/core/framework/types.proto \
  tensorflow/core/framework/tensor_shape.proto
