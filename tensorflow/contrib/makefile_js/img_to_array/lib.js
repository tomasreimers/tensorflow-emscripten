// From tensorflow/example/label_image/main.cc:
// The convention for image ops in TensorFlow is that all images are expected
// to be in batches, so that they're four-dimensional arrays with indices of
// [batch, height, width, channel]. Because we only have a single image, we
// have to add a batch dimension of 1 to the start.

module.exports = {
  get_array: function (image_data, grayscale = false, mean = 0, std = 1) {
    const result = new Array(1);
    result[0] = new Array(image_data.height);
    for (let ii = 0; ii < image_data.height; ii++) {
      result[0][ii] = new Array(image_data.width);
      for (let jj = 0; jj < image_data.width; jj++) {
        let index = (ii * image_data.width + jj) * 4;
        let r = image_data.data[index];
        let g = image_data.data[index + 1];
        let b = image_data.data[index + 2];
        // let alpha = image_data.data[index + 3]

        if (grayscale) {
          // one channel
          result[0][ii][jj] = new Array(1);
          let gray = (r + g + b) / 3;
          result[0][ii][jj][0] = (gray - mean) / std;
        } else {
          // three channel
          result[0][ii][jj] = new Array(3);
          result[0][ii][jj][0] = (r - mean) / std;
          result[0][ii][jj][1] = (g - mean) / std;
          result[0][ii][jj][2] = (b - mean) / std;
        }
      }
    }

    return result;
  }
};
