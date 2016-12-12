# must be run from makefile_js directory
pushd gen/bin/

time ./labeler.o \
  --graph=../../js-working-dir/tensorflow_inception_graph.pb \
  --image=../../js-working-dir/labeler_data/$1.jpg \
  --labels=../../js-working-dir/imagenet_comp_graph_label_strings.txt

popd
