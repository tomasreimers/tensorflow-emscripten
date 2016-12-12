# must be run from makefile_js directory
pushd gen/bin/

time node labeler.js \
  --graph=/working/$(pwd)/../../js-working-dir/tensorflow_inception_graph.pb \
  --image=/working/$(pwd)/../../js-working-dir/labeler_data/$1.jpg \
  --labels=/working/$(pwd)/../../js-working-dir/imagenet_comp_graph_label_strings.txt

popd
