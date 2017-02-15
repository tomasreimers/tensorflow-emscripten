/* Copyright 2015 The TensorFlow Authors. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
==============================================================================*/

// A minimal but useful C++ example showing how to load an Imagenet-style object
// recognition TensorFlow model, prepare input images for it, run them through
// the graph, and interpret the results.
//
// It's designed to have as few dependencies and be as clear as possible, so
// it's more verbose than it could be in production code. In particular, using
// auto for the types of a lot of the returned values from TensorFlow calls can
// remove a lot of boilerplate, but I find the explicit types useful in sample
// code to make it simple to look up the classes involved.
//
// To use it, compile and then run in a working directory with the
// learning/brain/tutorials/label_image/data/ folder below it, and you should
// see the top five labels for the example Lena image output. You can then
// customize it to use your own models or images by changing the file names at
// the top of the main() function.
//
// The googlenet_graph.pb file included by default is created from Inception.

#include <fstream>
#include <time.h>
#ifdef __MAKEFILE_JS__
#include <emscripten.h>
#include <emscripten/bind.h>
#else
#include <streambuf>
#endif

#include "tensorflow/cc/ops/const_op.h"
#include "tensorflow/cc/ops/standard_ops.h"
#include "tensorflow/core/framework/graph.pb.h"
#include "tensorflow/core/framework/tensor.h"
#include "tensorflow/core/graph/default_device.h"
#include "tensorflow/core/graph/graph_def_builder.h"
#include "tensorflow/core/lib/core/errors.h"
#include "tensorflow/core/lib/core/stringpiece.h"
#include "tensorflow/core/lib/core/threadpool.h"
#include "tensorflow/core/lib/io/path.h"
#include "tensorflow/core/lib/strings/stringprintf.h"
#include "tensorflow/core/platform/init_main.h"
#include "tensorflow/core/platform/logging.h"
#include "tensorflow/core/platform/types.h"
#include "tensorflow/core/public/session.h"
#include "tensorflow/core/util/command_line_flags.h"

// These are all common classes it's handy to reference with no namespace.
using tensorflow::Flag;
using tensorflow::Tensor;
using tensorflow::Status;
using tensorflow::string;
using tensorflow::int32;


class GraphLoadException:public std::exception{
public:
  GraphLoadException(const string m="Graph Load exception"):msg(m){}
  ~GraphLoadException(void){};
  const char* what(){return msg.c_str();}
private:
  string msg;
};

class GraphRunException:public std::exception{
public:
  GraphRunException(const string m="Graph Run exception"):msg(m){}
  ~GraphRunException(void){};
  const char* what(){return msg.c_str();}
private:
  string msg;
};

class TensorParseException:public std::exception{
public:
  TensorParseException(const string m="Tensor Parse exception"):msg(m){}
  ~TensorParseException(void){};
  const char* what(){return msg.c_str();}
private:
  string msg;
};

class JSSession {
public:
  JSSession(std::string graph): session()
  {
    // First we load and initialize the model.
    // string graph_path = tensorflow::io::JoinPath(root_dir, graph);
    tensorflow::GraphDef graph_def;
    // Status load_graph_status =
    //     ReadBinaryProto(tensorflow::Env::Default(), graph, &graph_def);
    // if (!load_graph_status.ok()) {
    //   throw GraphLoadException("Failed to load compute graph");
    // }

    if (!graph_def.ParseFromString(graph)) {
      throw GraphLoadException("Failed to load compute graph");
    }

    session.reset(tensorflow::NewSession(tensorflow::SessionOptions()));
    Status session_create_status = session->Create(graph_def);
    if (!session_create_status.ok()) {
      LOG(ERROR) << "Loading graph failed: " << session_create_status;
      throw GraphLoadException();
    }
  }

  std::vector<Tensor> run(
    const std::vector<std::pair<string, Tensor>> &inputs,
    const std::vector<string>& output_names
  )
  {
    std::vector<Tensor> outputs;
    Status run_status = session->Run(inputs, output_names, {}, &outputs);
    if (!run_status.ok()) {
      LOG(ERROR) << "Running model failed: " << run_status;
      throw GraphRunException();
    }

    return outputs;
  }

private:
  std::unique_ptr<tensorflow::Session> session;
};

Tensor parseTensor(std::string tensorPB) {
  tensorflow::TensorProto tp;
  if (!tp.ParseFromString(tensorPB)) {
    LOG(ERROR) << "Couldn't parse string as protobuf";
    throw TensorParseException();
  }

  Tensor t;
  if (!t.FromProto(tp)) {
    LOG(ERROR) << "Couldn't parse protobuf as tensor";
    throw TensorParseException();
  }

  return t;
}

std::string tensorToString(Tensor t) {
  tensorflow::TensorProto tp;
  t.AsProtoField(&tp);
  return tp.SerializeAsString();
}

std::vector<std::string> tensorVectorToStringVector(std::vector<Tensor> input) {
  std::vector<std::string> output;

  output.resize(input.size());

  std::transform(input.begin(), input.end(), output.begin(), tensorToString);

  return output;
}

void printIntTensor(std::string tensorPB) {
  Tensor t = parseTensor(tensorPB);
  LOG(INFO) << "Returned" << std::endl << t.flat<int32_t>();
}

std::pair<std::string, Tensor> makeStringTensorPair(std::string s, Tensor t) {
  return std::make_pair(s, t);
}

std::string printDummyIntTensor(void) {
  Tensor input(tensorflow::DT_INT32, tensorflow::TensorShape({1}));
  auto input_flat = input.flat<int32_t>();
  input_flat(0) = 5;

  tensorflow::TensorProto tp;

  input.AsProtoField(&tp);

  return tp.SerializeAsString();
}

#ifndef __MAKEFILE_JS__
int main(int argc, char* argv[]) {
  std::ifstream t("../../js_working_directory/io_graph.pb");
  std::string graph_str((std::istreambuf_iterator<char>(t)), std::istreambuf_iterator<char>());

  JSSession sess(graph_str);

  Tensor input(tensorflow::DT_INT32, tensorflow::TensorShape({1}));
  auto input_flat = input.flat<int32_t>();
  input_flat(0) = 42;

  auto output = sess.run({{"i:0", input}}, {"o:0"});

  LOG(INFO) << "Returned " << output[0].flat<int32_t>() << std::endl;

  return 0;
};
#endif

#ifdef __MAKEFILE_JS__
EMSCRIPTEN_BINDINGS(graph_runner) {
  emscripten::class_<JSSession>("JSSession")
    .constructor<std::string>()
    .function("run", &JSSession::run)
    ;

  emscripten::class_<Tensor>("Tensor");
  emscripten::class_<std::pair<string, Tensor>>("StringTensorPair");

  emscripten::function("tensorToString", &tensorToString);
  emscripten::function("tensorVectorToStringVector", &tensorVectorToStringVector);
  emscripten::function("makeStringTensorPair", &makeStringTensorPair);
  emscripten::function("parseTensor", &parseTensor);
  emscripten::function("printIntTensor", &printIntTensor); // for debugging
  emscripten::function("printDummyIntTensor", &printDummyIntTensor); // for debugging

  emscripten::register_map<std::string, std::string>("MapStringString");
  emscripten::register_vector<std::string>("VectorString");
  emscripten::register_vector<Tensor>("VectorTensor");
  emscripten::register_vector<std::pair<string, Tensor>>("VectorStringTensorPair");
}
#endif
