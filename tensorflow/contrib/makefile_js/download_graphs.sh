mkdir -p ./graphs
curl -o ./graphs/inception.zip \
 https://storage.googleapis.com/download.tensorflow.org/models/inception5h.zip \
 && unzip ./graphs/inception.zip -d ./graphs/inception
