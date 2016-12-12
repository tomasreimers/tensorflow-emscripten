# must be run from makefile_js directory
pushd gen/bin/

# if using "--browser firefox" also pass "--kill_exit" so it closes on exit
time emrun --browser firefox --kill_exit labeler.html \
  --graph=/tensorflow_inception_graph.pb \
  --image=/labeler_data/$1.jpg \
  --labels=/imagenet_comp_graph_label_strings.txt

popd
