import tensorflow as tf
import os

# construct path for output if doesn't exist
if not os.path.exists("../js_working_directory/inception_tensors/"):
    os.makedirs("../js_working_directory/inception_tensors/")

# construct the graph to decode jpeg, pulled logic from the image labeler
# https://github.com/tensorflow/tensorflow/blob/master/tensorflow/examples/label_image/main.cc#L87
file_contents = tf.placeholder(tf.string);
image = tf.image.decode_image(file_contents)
as_float = tf.to_float(image)
expanded_dims = tf.expand_dims(as_float, 0)
resized = tf.image.resize_bilinear(expanded_dims, [299, 299])
sub = tf.subtract(resized, 0)
div = tf.divide(sub, 255)

# construct the session, this should be a pure function, so no state should persist across runs
sess = tf.Session()

# construct the data
for i in xrange(100):
    with open("../js_working_directory/raw_inception_data/{}.jpg".format(i), "rb") as infile:
        file_bytes = infile.read()
        tensors = sess.run([div], {file_contents: file_bytes})
        tensor_pb = tf.contrib.util.make_tensor_proto(tensors[0])
        with open("../js_working_directory/inception_tensors/{}.tensor.pb".format(i), "wb") as outfile:
            outfile.write(tensor_pb.SerializeToString())
