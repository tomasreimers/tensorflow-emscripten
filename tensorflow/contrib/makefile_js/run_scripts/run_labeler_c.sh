# must be run from makefile_js directory
pushd gen/bin/

time ./labeler.o \
  --graph=../../js_working_directory/tensorflow_inception_graph.pb \
  --image=../../js_working_directory/labeler_data/$1.jpg \
  --labels=../../js_working_directory/imagenet_comp_graph_label_strings.txt

popd
