# must be run from makefile_js directory
pushd gen/bin/

# if using "--browser firefox" also pass "--kill_exit" so it closes on exit
time emrun --browser firefox --kill_exit mnist.html \
  --graph=/mnist.pb \
  --image=/mnist_data/$1.jpg

popd
