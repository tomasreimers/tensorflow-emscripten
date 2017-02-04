# must be run from makefile_js directory
pushd gen/bin/

time node labeler.js \
  --graph=/working/$(pwd)/../../js_working_directory/tensorflow_inception_graph.pb \
  --image=/working/$(pwd)/../../js_working_directory/labeler_data/$1.jpg \
  --labels=/working/$(pwd)/../../js_working_directory/imagenet_comp_graph_label_strings.txt

popd
