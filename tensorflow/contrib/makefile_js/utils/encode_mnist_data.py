import tensorflow as tf
from tensorflow.examples.tutorials.mnist import input_data
import os

mnist = input_data.read_data_sets('../js_working_directory/raw_mnist_data', one_hot=True)

if not os.path.exists("../js_working_directory/mnist_tensors/"):
    os.makedirs("../js_working_directory/mnist_tensors/")

for i in xrange(100):
    tensor_pb = tf.contrib.util.make_tensor_proto(mnist.test.images[i])
    with open("../js_working_directory/mnist_tensors/{}.tensor.pb".format(i), "wb") as outfile:
        outfile.write(tensor_pb.SerializeToString())
