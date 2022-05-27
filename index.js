const fs = require("fs");
const sharp = require("sharp");

const getDestination = (req, file, cb) => {
  cb(null, "/dev/null");
};

const getFilename = (name, input) =>
  name.split(".").slice(0, -1).join(".") +
  `${input.useTimestamp ? "_" + Date.now() : ""} ` +
  "." +
  input.fileFormat;

const prepareSharpStream = (input) => {
  const SharpStram = sharp().resize(input.resize || {});

  switch (input.fileFormat) {
    case "png":
      return SharpStram.png(input.quality ? { quality: input.quality } : {});
    case "webp":
      return SharpStram.webp(input.quality ? { quality: input.quality } : {});
    case "jpg":
      return SharpStram.jpeg(input.quality ? { quality: input.quality } : {});
    default:
      return SharpStram.jpeg(input.quality ? { quality: input.quality } : {});
  }
};

const handleSave = (req, file, cb, imageOptions, path) => {
  let filename = getFilename(file.originalname, imageOptions);
  const stream = prepareSharpStream(imageOptions);
  stream
    .toFile(path + "/" + filename, function (err) {
      if (err) console.log(err);
    })
    .on("finish", function () {
      console.log("done");
      cb(null, {
        filename: filename,
        path: path + "/" + filename,
      });
    });
  file.stream.pipe(stream);
};

function MyCustomStorage(options) {
  this.getDestination = options.destination || getDestination;
  this.imageOptions = options.imageOptions ||
    options.sharpOptions || { fileFormat: "jpg", quality: 80 };
}

MyCustomStorage.prototype._handleFile = function _handleFile(req, file, cb) {
  const imageOptions = this.imageOptions;
  this.getDestination(req, file, function (err, path) {
    if (err) return cb(err);
    handleSave(req, file, cb, imageOptions, path);
  });
};

MyCustomStorage.prototype._removeFile = function _removeFile(req, file, cb) {
  fs.unlink(file.path, cb);
};

module.exports = function (opts) {
  return new MyCustomStorage(opts);
};
