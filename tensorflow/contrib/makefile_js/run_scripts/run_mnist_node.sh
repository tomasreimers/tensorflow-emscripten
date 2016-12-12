# must be run from makefile_js directory
pushd gen/bin/

time node mnist.js \
  --graph=/working/$(pwd)/../../js-working-dir/mnist.pb \
  --image=/working/$(pwd)/../../js-working-dir/mnist_data/$1.jpg

popd
