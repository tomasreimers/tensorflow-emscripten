# tensorflow-emscripten

## About

*NOTE: This is still very much a work in progress, and not even fully operational. DO NOT DEPEND ON THIS PROJECT. I will post updates when it is working and stable.*

This is a repository containing the source for Tensorflow (https://www.tensorflow.org/, pinned at version v0.10.0 currently) and slightly modified to be able to be compiled with Emscripten (https://kripken.github.io/emscripten-site/).

## Install & Compiling

Clone the repository. And download [js-working-dir](https://www.dropbox.com/s/y5snh95t7nri272/js-working-dir.zip?dl=0) into `./tensorflow/contrib/makefile_js/js-working-dir`.

### Configuring the makefile

Open the makefile, `./tensorflow/contrib/makefile_js/Makefile`, and you should see
three options at the top which you are free to configure:
 - `FINAL_PRODUCT` (html, js, c): What to produce as final output.
 - `ALLOCATE_MEM_UPFRONT` (true, false): Emscripten allocates one large array to simulate the C memory interface in JS, you can choose to statically allocate this at the beginning or to dynamically grow it as need be (MUCH SLOWER).
 - `SINGLE_THREAD` (true, false): Whether to use only one thread (must be set to true if you intend to compile for html or js).

### Making the library

Once you have configured the make file, run the following from the root of the repository:

```
$ ./tensorflow/contrib/makefile_js/download_dependencies.sh
$ ./tensorflow/contrib/makefile_js/gen_file_lists.sh
$ emconfigure ./configure
$ emmake make -f ./tensorflow/contrib/makefile_js/Makefile
```

*TIP: Considering adding the flag '-jX' to the emmake command, which will multithread compilation with X threads.*

This will generate (the file extensions depend on the `FINAL_PRODUCT` flag specified above):
 - `./tensorflow/contrib/makefile_js/gen/bin/benchmark.{o,js,html}`: The standard benchmarking tool that ships with tensorflow.
 - `./tensorflow/contrib/makefile_js/gen/bin/labeler.{o,js,html}`: A google inception net to classify images (from the [label image tutorial](https://github.com/tensorflow/tensorflow/tree/master/tensorflow/examples/label_image)).
 - `./tensorflow/contrib/makefile_js/gen/bin/mnist.{o,js,html}`: A net trained on mnist to classify images (from the [deep mnist tutorial](https://www.tensorflow.org/versions/r0.12/tutorials/mnist/pros/index.html)).

### Running the generated files

To run these files, use the run scripts; for example:

```
$ cd ./tensorflow/contrib/makefile_js/
$ ./run_scripts/run_labeler_c.sh 0
```

(That will call the labeler script on `makefile_js/js-working-dir/labeler_data/0.jpg`).

Read through `run_scripts/*.sh`, to figure out how to call the libraries on their own.

### Misc

 - To clean the makefile-generated objects, call `$ emmake make -f ./tensorflow/contrib/makefile_js/Makefile clean` from the root of the repository. *YOU MUST DO THIS BEFORE REBUILDING THE SCRIPTS FOR ANOTHER TARGET (i.e. if you were previouly building for c and now you want to build for js).*
 - We provide a `run_trials` script that can benchmark mnist and labeler, to use it:

```
$ cd ./tensorflow/contrib/makefile_js/
$ python run_trails.py {mnist,labeler} {browser,node,c}
```

**(Which will benchmark mnist/labeler in the browser/node/c.)**

## Author

Tomas Reimers, September-December 2016
