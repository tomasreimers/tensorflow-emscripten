#include <fstream>
#include <vector>
#include <time.h>

#ifdef __MAKEFILE_JS__
#include <emscripten.h>
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

#define NUM_OF_TRIALS 100

// These are all common classes it's handy to reference with no namespace.
using tensorflow::Flag;
using tensorflow::Tensor;
using tensorflow::Status;
using tensorflow::string;
using tensorflow::int32;

// Reads a model graph definition from disk, and creates a session object you
// can use to run it.
Status LoadGraph(string graph_file_name,
                 std::unique_ptr<tensorflow::Session>* session) {
  tensorflow::GraphDef graph_def;
  Status load_graph_status =
      ReadBinaryProto(tensorflow::Env::Default(), graph_file_name, &graph_def);
  if (!load_graph_status.ok()) {
    return tensorflow::errors::NotFound("Failed to load compute graph at '",
                                        graph_file_name, "'");
  }
  session->reset(tensorflow::NewSession(tensorflow::SessionOptions()));
  Status session_create_status = (*session)->Create(graph_def);
  if (!session_create_status.ok()) {
    return session_create_status;
  }
  return Status::OK();
}

Tensor LoadTensor(string tensor_file_name) {
  tensorflow::TensorProto tp;
  Status load_graph_status =
      ReadBinaryProto(tensorflow::Env::Default(), tensor_file_name, &tp);
  if (!load_graph_status.ok()) {
    throw tensorflow::errors::NotFound("Failed to load tensor at '",
                                        tensor_file_name, "'");
  }

  Tensor t;
  if (!t.FromProto(tp)) {
    throw tensorflow::errors::FailedPrecondition("Failed to parse tensor from pb at '",
                                        tensor_file_name, "'");
  }

  return t;
}

int main(int argc, char* argv[]) {
  #if defined(__MAKEFILE_JS__)
    #if defined(__MAKEFILE_JS_MAKE_HTML__)
      // HTML
      string base_path = "/";
    #else
      // JS
      EM_ASM(
        FS.mkdir('/working');
        FS.mount(NODEFS, { root: '../../js_working_directory/' }, '/working');
      );
      string base_path = "/working/";
    #endif
  #else
    // C
   string base_path = "../../js_working_directory/";
  #endif

  string graph_path = tensorflow::io::JoinPath(base_path, "mnist.pb");
  string tensor_dir = tensorflow::io::JoinPath(base_path, "mnist_tensors");

  // We need to call this to set up global state for TensorFlow.
  tensorflow::port::InitMain(argv[0], &argc, &argv);
  if (argc > 1) {
    LOG(ERROR) << "Unknown argument " << argv[1] << "\n";
    return -1;
  }

  // First we load and initialize the model.
  std::unique_ptr<tensorflow::Session> session;
  Status load_graph_status = LoadGraph(graph_path, &session);
  if (!load_graph_status.ok()) {
    LOG(ERROR) << load_graph_status;
    return -1;
  }

  std::vector<double> runtimes;
  runtimes.reserve(NUM_OF_TRIALS);

  for (int i = 0; i < NUM_OF_TRIALS; i++) {
    struct timespec runtime_start, runtime_end;
    // compute file name for tensor
    std::ostringstream file_name_stream;
    file_name_stream << i << ".tensor.pb";
    std::string file_name = file_name_stream.str();
    string file_path = tensorflow::io::JoinPath(tensor_dir, file_name);

    // load file path for tensor
    Tensor input_tensor = LoadTensor(file_path);

    // Actually run the image through the model.
    Tensor dropout(tensorflow::DT_FLOAT, tensorflow::TensorShape({1}));
    auto x_flat = dropout.flat<float>();
    x_flat.setConstant(1.0);

    std::vector<Tensor> outputs;
    clock_gettime(CLOCK_REALTIME, &runtime_start);
    Status run_status = session->Run(
      {
        {"x:0", input_tensor},
        {"dropout:0", dropout}
      },
      {"prediction_onehot:0"},
      {},
      &outputs
    );
    clock_gettime(CLOCK_REALTIME, &runtime_end);
    if (!run_status.ok()) {
      LOG(ERROR) << "Running model failed: " << run_status;
      return -1;
    }

    // calculate runtime
    double runtime = (double)((runtime_end.tv_sec+runtime_end.tv_nsec*1e-9) - (double)(runtime_start.tv_sec+runtime_start.tv_nsec*1e-9));
    runtimes.push_back(runtime);

    // To see the result:
    // LOG(INFO) << outputs[0].flat<float>();
  }

  // print average runtimes
  double runtimes_average = std::accumulate(runtimes.begin(), runtimes.end(), 0.0) / runtimes.size();
  LOG(INFO) << "Average of " << NUM_OF_TRIALS << " runtimes: " << runtimes_average;

  return 0;
}
