# must be run from makefile_js directory
pushd gen/bin/

time ./mnist.o \
  --graph=../../js_working_directory/mnist.pb \
  --image=../../js_working_directory/mnist_data/$1.jpg

popd
