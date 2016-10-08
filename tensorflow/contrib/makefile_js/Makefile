# This Makefile compiles a library containing the C++ runtime for the TensorFlow
# library. It's designed for use on platforms with limited resources where
# running a full Bazel build would be prohibitive, or for cross-compilation onto
# embedded systems. It includes only a bare-bones set of functionality.
#
# The default setup below is aimed at Unix-like devices, and should work on
# modern Linux and OS X distributions without changes.
#
# If you have another platform, you'll need to take a careful look at the
# compiler flags and folders defined below. They're separated into two sections,
# the first for the host (the machine you're compiling on) and the second for
# the target (the machine you want the program to run on).

# Host compilation settings

# Find where we're running from, so we can store generated files here.
MAKEFILE_DIR := $(shell dirname $(realpath $(lastword $(MAKEFILE_LIST))))
HAS_GEN_HOST_PROTOC := \
$(shell test -f $(MAKEFILE_DIR)/gen/protobuf-host/bin/protoc && echo "true" ||\
echo "false")

# Try to figure out the host system
HOST_OS :=
ifeq ($(OS),Windows_NT)
	HOST_OS = WINDOWS
else
	UNAME_S := $(shell uname -s)
	ifeq ($(UNAME_S),Linux)
	        HOST_OS := LINUX
	endif
	ifeq ($(UNAME_S),Darwin)
		HOST_OS := OSX
	endif
endif

# Where compiled objects are stored.
HOST_OBJDIR := $(MAKEFILE_DIR)/gen/host_obj/
HOST_BINDIR := $(MAKEFILE_DIR)/gen/host_bin/
HOST_GENDIR := $(MAKEFILE_DIR)/gen/host_obj/

# Find the current Eigen version from the Bazel configuration
EIGEN_VERSION := $(shell grep eigen_version tensorflow/workspace.bzl | head -1 | sed -e 's/.*eigen_version.*=.*"\(.*\)"/\1/')

# Settings for the host compiler.
HOST_CXX := $(CC_PREFIX) gcc
HOST_CXXFLAGS := --std=c++11
HOST_LDOPTS :=
ifeq ($(HAS_GEN_HOST_PROTOC),true)
	HOST_LDOPTS += -L$(MAKEFILE_DIR)/gen/protobuf-host/lib
endif
HOST_LDOPTS += -L/usr/local/lib

HOST_INCLUDES := \
-I. \
-I$(MAKEFILE_DIR)/downloads/ \
-I$(MAKEFILE_DIR)/downloads/eigen-eigen-$(EIGEN_VERSION) \
-I$(HOST_GENDIR)
ifeq ($(HAS_GEN_HOST_PROTOC),true)
	HOST_INCLUDES += -I$(MAKEFILE_DIR)/gen/protobuf-host/include
endif
# This is at the end so any globally-installed frameworks like protobuf don't
# override local versions in the source tree.
HOST_INCLUDES += -I/usr/local/include

HOST_LIBS := \
-lstdc++ \
-lprotobuf \
-lpthread \
-lm \
-lz

# If we're on Linux, also link in the dl library.
ifeq ($(HOST_OS),LINUX)
	HOST_LIBS += -ldl -lpthread
endif

# If we're on a Pi, link in pthreads and dl
ifeq ($(HOST_OS),PI)
	HOST_LIBS += -ldl -lpthread
endif


# proto_text is a tool that converts protobufs into a form we can use more
# compactly within TensorFlow. It's a bit like protoc, but is designed to
# produce a much more minimal result so we can save binary space.
# We have to build it on the host system first so that we can create files
# that are needed for the runtime building.
PROTO_TEXT := $(HOST_BINDIR)proto_text
# The list of dependencies is derived from the Bazel build file by running
# the gen_file_lists.sh script on a system with a working Bazel setup.
PROTO_TEXT_CC_FILES := $(shell cat $(MAKEFILE_DIR)/proto_text_cc_files.txt)
PROTO_TEXT_PB_CC_LIST := $(shell cat $(MAKEFILE_DIR)/proto_text_pb_cc_files.txt)
PROTO_TEXT_PB_H_LIST := $(shell cat $(MAKEFILE_DIR)/proto_text_pb_h_files.txt)

# Locations of the intermediate files proto_text generates.
PROTO_TEXT_PB_H_FILES := $(addprefix $(HOST_GENDIR), $(PROTO_TEXT_PB_H_LIST))
PROTO_TEXT_CC_OBJS := $(addprefix $(HOST_OBJDIR), $(PROTO_TEXT_CC_FILES:.cc=.o))
PROTO_TEXT_PB_OBJS := $(addprefix $(HOST_OBJDIR), $(PROTO_TEXT_PB_CC_LIST:.cc=.o))
PROTO_TEXT_OBJS := $(PROTO_TEXT_CC_OBJS) $(PROTO_TEXT_PB_OBJS)

# Target device settings.

# Default to running on the same system we're compiling on.
# You should override TARGET on the command line if you're cross-compiling, e.g.
# make -f tensorflow/contrib/makefile/Makefile TARGET=ANDROID
TARGET := $(HOST_OS)

# Where compiled objects are stored.
GENDIR := $(MAKEFILE_DIR)/gen/
OBJDIR := $(GENDIR)obj/
LIBDIR := $(GENDIR)lib/
BINDIR := $(GENDIR)bin/
PBTGENDIR := $(GENDIR)proto_text/
PROTOGENDIR := $(GENDIR)proto/
DEPDIR := $(GENDIR)dep/
$(shell mkdir -p $(DEPDIR) >/dev/null)

# Settings for the target compiler.
CXX := $(CC_PREFIX) emcc
OPTFLAGS := -O2
# if you'll need an arbitrary amount of memory, use -s ALLOW_MEMORY_GROWTH=1
CXXFLAGS := --std=c++11 -m64 \
-s USE_ZLIB=1 -s DEMANGLE_SUPPORT=1 -s TOTAL_MEMORY=268435456 -s ASSERTIONS=1 -s PTHREAD_HINT_NUM_CORES=1 \
-DIS_SLIM_BUILD $(OPTFLAGS)
LDFLAGS := \
-L/usr/local/lib
DEPFLAGS = -MT $@ -MMD -MP -m64 -MF $(DEPDIR)/$*.Td

INCLUDES := \
-I. \
-I$(MAKEFILE_DIR)/downloads/ \
-I$(MAKEFILE_DIR)/downloads/eigen-eigen-$(EIGEN_VERSION) \
-I$(PROTOGENDIR) \
-I$(PBTGENDIR)
ifeq ($(HAS_GEN_HOST_PROTOC),true)
	INCLUDES += -I$(MAKEFILE_DIR)/gen/protobuf-host/include
endif
# This is at the end so any globally-installed frameworks like protobuf don't
# override local versions in the source tree.
INCLUDES += -I/usr/local/include

LIBS := \
-lstdc++ \
-lm

ifeq ($(HAS_GEN_HOST_PROTOC),true)
	PROTOC := $(MAKEFILE_DIR)/gen/protobuf-host/bin/protoc
else
	PROTOC := protoc
endif

$(info PROTOC = "$(PROTOC)")
$(info CC_PREFIX = "$(CC_PREFIX)")

PROTOCFLAGS :=
AR := ar
ARFLAGS := -r
LIBFLAGS :=

# If we're on OS X, make sure that globals aren't stripped out.
ifeq ($(TARGET),OSX)
	LDFLAGS += -all_load
endif
# Make sure that we don't strip global constructors on Linux.
ifeq ($(TARGET),LINUX)
	LIBFLAGS += -Wl,--allow-multiple-definition -Wl,--whole-archive
endif
# If we're on Linux, also link in the dl library.
ifeq ($(TARGET),LINUX)
	LIBS += -ldl -lpthread
endif

# This library is the main target for this makefile. It will contain a minimal
# runtime that can be linked in to other programs.
LIB_NAME := libtensorflow-core.a
LIB_PATH := $(LIBDIR)$(LIB_NAME)

# A small example program that shows how to link against the library.
BENCHMARK_NAME := $(BINDIR)benchmark.js

# What sources we want to compile, derived from the main Bazel build using the
# gen_file_lists.sh script.

CORE_CC_ALL_SRCS := \
$(wildcard tensorflow/core/*.cc) \
$(wildcard tensorflow/core/common_runtime/*.cc) \
$(wildcard tensorflow/core/debug/*.cc) \
$(wildcard tensorflow/core/framework/*.cc) \
$(wildcard tensorflow/core/graph/*.cc) \
$(wildcard tensorflow/core/lib/*/*.cc) \
$(wildcard tensorflow/core/platform/*.cc) \
$(wildcard tensorflow/core/platform/*/*.cc) \
$(wildcard tensorflow/core/util/*.cc) \
$(wildcard tensorflow/core/util/*/*.cc)
CORE_CC_EXCLUDE_SRCS := \
$(wildcard tensorflow/core/*/*test.cc) \
$(wildcard tensorflow/core/*/*testutil*) \
$(wildcard tensorflow/core/*/*testlib*) \
$(wildcard tensorflow/core/*/*main.cc) \
$(wildcard tensorflow/core/*/*/*test.cc) \
$(wildcard tensorflow/core/*/*/*testutil*) \
$(wildcard tensorflow/core/*/*/*testlib*) \
$(wildcard tensorflow/core/*/*/*main.cc) \
$(wildcard tensorflow/core/graph/dot.*) \
$(wildcard tensorflow/core/lib/gif/*) \
$(wildcard tensorflow/core/lib/jpeg/*) \
$(wildcard tensorflow/core/lib/png/*) \
$(wildcard tensorflow/core/util/events_writer.*) \
$(wildcard tensorflow/core/util/reporter.*) \
$(wildcard tensorflow/core/platform/default/stream_executor.*) \
$(wildcard tensorflow/core/platform/default/test_benchmark.*) \
$(wildcard tensorflow/core/platform/cuda.h) \
$(wildcard tensorflow/core/platform/cloud/*) \
$(wildcard tensorflow/core/platform/google/*) \
$(wildcard tensorflow/core/platform/jpeg.*) \
$(wildcard tensorflow/core/platform/png.*) \
$(wildcard tensorflow/core/platform/stream_executor.*) \
$(wildcard tensorflow/core/user_ops/*.cu.cc) \
$(wildcard tensorflow/core/common_runtime/gpu/*) \
$(wildcard tensorflow/core/common_runtime/gpu_device_factory.*)
# Filter out all the excluded files.
TF_CC_SRCS := $(filter-out $(CORE_CC_EXCLUDE_SRCS), $(CORE_CC_ALL_SRCS))
# Add in any extra files that don't fit the patterns easily
TF_CC_SRCS += tensorflow/core/common_runtime/gpu/gpu_tracer.cc
# Also include the op and kernel definitions.
TF_CC_SRCS += $(shell cat $(MAKEFILE_DIR)/tf_op_files.txt)
PBT_CC_SRCS := $(shell cat $(MAKEFILE_DIR)/tf_pb_text_files.txt)
PROTO_SRCS := $(shell cat $(MAKEFILE_DIR)/tf_proto_files.txt)
BENCHMARK_SRCS := \
tensorflow/core/util/reporter.cc \
$(MAKEFILE_DIR)/benchmark/benchmark_model.cc \
$(MAKEFILE_DIR)/benchmark/benchmark_model_main.cc

# File names of the intermediate files target compilation generates.
TF_CC_OBJS := $(addprefix $(OBJDIR), $(TF_CC_SRCS:.cc=.o))
PBT_GEN_FILES := $(addprefix $(PBTGENDIR), $(PBT_CC_SRCS))
PBT_OBJS := $(addprefix $(OBJDIR), $(PBT_CC_SRCS:.cc=.o))
PROTO_CC_SRCS := $(addprefix $(PROTOGENDIR), $(PROTO_SRCS:.proto=.pb.cc))
PROTO_OBJS := $(addprefix $(OBJDIR), $(PROTO_SRCS:.proto=.pb.o))
LIB_OBJS := $(PROTO_OBJS) $(TF_CC_OBJS) $(PBT_OBJS)
BENCHMARK_OBJS := $(addprefix $(OBJDIR), $(BENCHMARK_SRCS:.cc=.o))

.PHONY: clean cleantarget

# The target that's compiled if there's no command-line arguments.
all: $(LIB_PATH) $(BENCHMARK_NAME)

# Rules for target compilation.

# Gathers together all the objects we've compiled into a single '.a' archive.
$(LIB_PATH): $(LIB_OBJS)
	@mkdir -p $(dir $@)
	$(AR) $(ARFLAGS) $(LIB_PATH) $(LIB_OBJS)

$(BENCHMARK_NAME): $(BENCHMARK_OBJS) $(LIB_PATH)
	@mkdir -p $(dir $@)
	$(CXX) $(CXXFLAGS) $(INCLUDES) \
	-o $(BENCHMARK_NAME) $(BENCHMARK_OBJS) \
	$(LIBFLAGS) $(LIB_OBJS) $(LDFLAGS) $(LIBS) \
	$(MAKEFILE_DIR)/downloads/protobuf-emscripten/src/.libs/libprotobuf.a

# Matches on the normal hand-written TensorFlow C++ source files.
$(OBJDIR)%.o: %.cc | $(PBT_GEN_FILES)
	@mkdir -p $(dir $@)
	@mkdir -p $(dir $(DEPDIR)$*)
	$(CXX) $(CXXFLAGS) $(DEPFLAGS) $(INCLUDES) -c $< -o $@
	@mv -f $(DEPDIR)/$*.Td $(DEPDIR)/$*.d

# Compiles C++ source files that have been generated by protoc.
$(OBJDIR)%.pb.o: $(PROTOGENDIR)%.pb.cc
	@mkdir -p $(dir $@)
	$(CXX) $(CXXFLAGS) $(INCLUDES) -c $< -o $@

# Builds C++ code from proto files using protoc.
$(PROTOGENDIR)%.pb.cc $(PROTOGENDIR)%.pb.h: %.proto
	@mkdir -p $(dir $@)
	$(PROTOC) $(PROTOCFLAGS) $< --cpp_out $(PROTOGENDIR)

# Uses proto_text to generate minimal pb_text C++ files from protos.
$(PBTGENDIR)%.pb_text.cc $(PBTGENDIR)%.pb_text.h $(PBTGENDIR)%.pb_text-impl.h: %.proto | $(PROTO_TEXT)
	@mkdir -p $(dir $@)
	$(PROTO_TEXT) \
	$(PBTGENDIR)tensorflow/core \
	tensorflow/core/ \
	tensorflow/tools/proto_text/placeholder.txt \
	$<

# Compiles the C++ source files created by proto_text.
$(OBJDIR)%.pb_text.o: $(PBTGENDIR)%.pb_text.cc
	@mkdir -p $(dir $@)
	$(CXX) $(CXXFLAGS) $(INCLUDES) -c $< -o $@

# Makes sure that we don't compile the protoc-generated C++ sources before they
# and the proto_text files have been created.
$(PROTO_OBJS): $(PROTO_CC_SRCS) $(PBT_GEN_FILES)

# Host compilation rules.

# For normal manually-created TensorFlow C++ source files.
$(HOST_OBJDIR)%.o: %.cc
	@mkdir -p $(dir $@)
	$(HOST_CXX) $(HOST_CXXFLAGS) $(HOST_INCLUDES) -c $< -o $@

# Compiles object code from protoc-built C++ source files.
$(HOST_OBJDIR)%.pb.o: $(HOST_GENDIR)%.pb.cc
	@mkdir -p $(dir $@)
	$(HOST_CXX) $(HOST_CXXFLAGS) $(HOST_INCLUDES) -c $< -o $@

# Ensures we wait until proto_text has generated the .h files from protos before
# we compile the C++.
$(PROTO_TEXT_OBJS) : $(PROTO_TEXT_PB_H_FILES)

# Runs proto_text to generate C++ source files from protos.
$(PROTO_TEXT): $(PROTO_TEXT_OBJS) $(PROTO_TEXT_PB_H_FILES)
	@mkdir -p $(dir $@)
	$(HOST_CXX) $(HOST_CXXFLAGS) $(HOST_INCLUDES) \
	-o $(PROTO_TEXT) $(PROTO_TEXT_OBJS) $(HOST_LDOPTS) $(HOST_LIBS)

# Compiles the C++ source files from protos using protoc.
$(HOST_GENDIR)%.pb.cc $(HOST_GENDIR)%.pb.h: %.proto
	@mkdir -p $(dir $@)
	$(PROTOC) $(PROTOCFLAGS) $< --cpp_out $(HOST_GENDIR)

# Gets rid of all generated files.
clean:
	rm -rf $(MAKEFILE_DIR)/gen

# Gets rid of target files only, leaving the host alone. Also leaves the lib
# directory untouched deliberately, so we can persist multiple architectures
# across builds for iOS.
cleantarget:
	rm -rf $(OBJDIR)
	rm -rf $(BINDIR)

$(DEPDIR)/%.d: ;
.PRECIOUS: $(DEPDIR)/%.d

-include $(patsubst %,$(DEPDIR)/%.d,$(basename $(TF_CC_SRCS)))
