# tensorflow-emscripten

## About

*NOTE: This is still very much a work in progress, and not even fully operational. DO NOT DEPEND ON THIS PROJECT. I will post updates when it is working and stable.*

This is a repository containing the source for Tensorflow (https://www.tensorflow.org/, pinned at version v0.10.0 currently) and slightly modified to be able to be compiled with Emscripten (https://kripken.github.io/emscripten-site/).

It is an active research project whether this is even feasible, and I will post updates and documentation on my changes as I make progress.

## Install & Compiling

Clone the repository, and then from the root of the repository run:

```
$ ./tensorflow/contrib/makefile_js/download_dependencies.js
$ emconfigure ./configure
$ emmake make -f ./tensorflow/contrib/makefile_js/Makefile
```

This will generate `./tensorflow/contrib/makefile_js/gen/bin/benchmark.js` (the standard benchmarking tool that ships with tensorflow) that can be run with `cd ./tensorflow/contrib/makefile_js/gen/bin/; node benchmark.js` (for more information on the benchmarking tool and how to run it, see `README.orig.md` in this directory).

Support for compiling other programs (hopefully) coming soon! ...once I can reliably test the benchmarking tool.

## Author

Tomas Reimers, September 2016
