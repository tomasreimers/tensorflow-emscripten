# must be run from makefile_js directory
pushd gen/bin/

time ./mnist.o \
  --graph=../../js-working-dir/mnist.pb \
  --image=../../js-working-dir/mnist_data/$1.jpg

popd
