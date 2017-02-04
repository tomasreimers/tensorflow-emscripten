# must be run from makefile_js directory
pushd gen/bin/

time node mnist.js \
  --graph=/working/$(pwd)/../../js_working_directory/mnist.pb \
  --image=/working/$(pwd)/../../js_working_directory/mnist_data/$1.jpg

popd
