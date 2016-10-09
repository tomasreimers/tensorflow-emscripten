# tensorflow-emscripten

## About

*NOTE: This is still very much a work in progress, and not even fully operational. DO NOT DEPEND ON THIS PROJECT. I will post updates when it is working and stable.*

This is a repository containing the source for Tensorflow (https://www.tensorflow.org/, pinned at version v0.10.0 currently) and slightly modified to be able to be compiled with Emscripten (https://kripken.github.io/emscripten-site/).

It is an active research project whether this is even feasible, and I will post updates and documentation on my changes as I make progress.

## Install & Compiling

Clone the repository, and then from the root of the repository run:

```
$ ./tensorflow/contrib/makefile_js/download_dependencies.sh
$ emconfigure ./configure
$ emmake make -f ./tensorflow/contrib/makefile_js/Makefile
```

*TIP: Considering adding the flag '-jX' to the emmake command, which will multithread compilation with X threads.*

This will generate `./tensorflow/contrib/makefile_js/gen/bin/benchmark.js` (the standard benchmarking tool that ships with tensorflow). To run it, first you need to download the inception graph from Google:

```
$ ./tensorflow/contrib/makefile_js/download_graphs.sh
```

This should create the directory `./graphs` with the google inception graph in it. Now the benchmark can be run (for more information on the benchmarking tool and how to run it, see `README.orig.md` in this directory). The benchmarker requires a path to the graph and mounts your filesystem on the `working/` path in the simulated node filesystem. To run the benchmarker

```
$ cd ./tensorflow/contrib/makefile_js/gen/bin
$ node benchmark.js --graph=/working/PATH/TO/TENSORFLOW/FROM/ROOT/graphs/inception/tensorflow_inception_graph.pb
```

## Author

Tomas Reimers, September-October 2016
