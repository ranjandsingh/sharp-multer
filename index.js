const fs = require("fs");
const sharp = require("sharp");

const getDestination = (req, file, cb) => {
  cb(null, "/dev/null");
};

const getFilename = (name, input) =>
  name.split(".").slice(0, -1).join(".") +
  `${input.useTimestamp ? "-" + Date.now() : ""}` +
  "." +
  input.fileFormat;

const prepareSharpStream = (SharpStram, input) => {
  if (input.resize) {
    const { width, height, resizeMode } = input.resize;
    SharpStram.resize({
      width,
      height,
      fit: resizeMode,
    });
  }

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

const handleWatermark = async (SharpStram, input) => {
  let gravity = "";
  switch (input.location) {
    case "top-left":
      gravity = "northwest";
      break;
    case "top-right":
      gravity = "northeast";
      break;
    case "bottom-left":
      gravity = "southwest";
      break;
    case "bottom-right":
      gravity = "southeast";
      break;
  }
  // preparing watermark with transparency
  const opacity = input.opacity ? Number(input.opacity) * 2.55 : 255;
  const watermarkStream = await sharp(input.input)
    .composite([
      {
        input: Buffer.from([0, 0, 0, opacity]),
        raw: {
          width: 1,
          height: 1,
          channels: 4,
        },
        tile: true,
        blend: "dest-in",
      },
    ])
    .toFormat("png")
    .toBuffer();

  return SharpStram.composite([
    { input: watermarkStream, gravity: gravity || "center", blend: "atop" },
  ]);
};

const handleSave = async (
  req,
  file,
  cb,
  imageOptions,
  path,
  watermarkOptions
) => {
  let stream = sharp();

  // preparing harp functions based on inputs

  // checking if watermark is provided or not
  if (watermarkOptions)
    stream = await handleWatermark(stream, watermarkOptions);

  let filename = getFilename(file.originalname, imageOptions);
  //handling image Options
  stream = prepareSharpStream(stream, imageOptions);

  await stream
    .toFile(path + "/" + filename, function (err) {
      if (err) console.log(err);
      console.log("done");
      cb(null, {
        filename: filename,
        path: path + "/" + filename,
      });
    });

  // finally
  file.stream.pipe(stream);
};

function MyCustomStorage(options) {
  this.getDestination = options.destination || getDestination;
  this.imageOptions = options.imageOptions ||
    options.sharpOptions || { fileFormat: "jpg", quality: 80 };
  this.watermarkOptions = options.watermarkOptions;
}

MyCustomStorage.prototype._handleFile = function _handleFile(req, file, cb) {
  const imageOptions = this.imageOptions;
  const watermarkOptions = this.watermarkOptions;
  this.getDestination(req, file, function (err, path) {
    if (err) return cb(err);
    handleSave(req, file, cb, imageOptions, path, watermarkOptions);
  });
};

MyCustomStorage.prototype._removeFile = function _removeFile(req, file, cb) {
  fs.unlink(file.path, cb);
};

module.exports = function (opts) {
  return new MyCustomStorage(opts);
};
