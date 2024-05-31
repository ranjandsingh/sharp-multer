# Sharp-Multer

Small Utility to use with Multer as storage engine to optimize images on the fly It uses Sharp to optimize images to jpg, png, webp as well as resize them.

## Install

> `npm install sharp-multer`

## Example

```js
const multer = require("multer");

const SharpMulter = require("sharp-multer");
const app = express();

// optional function to return new File Name
const newFilenameFunction = (og_filename, options) => {
  const newname =
    og_filename.split(".").slice(0, -1).join(".") +
    `${options.useTimestamp ? "-" + Date.now() : ""}` +
    "." +
    options.fileFormat;
  return newname;
};

const storage = SharpMulter({
  destination: (req, file, callback) => callback(null, "images"),

  imageOptions: {
    fileFormat: "png",
    quality: 80,
    resize: { width: 500, height: 500, resizeMode: "contain" },
  },

  watermarkOptions: {
    input: "./images/logo.png",
    location: "top-right",
  },
  filename: newFilenameFunction, // optional
});
const upload = multer({ storage });
app.post("/upload", upload.single("avatar"), async (req, res) => {
  console.log(req.file);

  return res.json("File Uploaded Successfully!");
});
```

## Image Options

| Key              | Option                                                     | Description                                                                                                                                                        |
| ---------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| fileFormat       | `jpg / png/ webp 'Default:"jpg"`                           | Output file type                                                                                                                                                   |
| resize           | `{height:"", widht:"",resizeMode:"", withoutEnlargement: true/false } 'Default:{}'`        | If provided Images will be resized before saving                                                                                                                  |
| quality          | `Number(0-100) 'Default :80'`                              | Reduces the qulity for better performance                                                                                                                          |
| useTimestamp     | `true/false 'Default :false'`(optional)                    | Adds suffice to file name Ex: "Images_1653679779.jpg"                                                                                                              |
| watermarkOptions | `{input:"", location:"",opacity:1-100}` (optional)        | Adds watermark on every Images before Saving                                                                                                                       |
| filename         | `(originalname,options,req) => return newname` (optional) | Option to return a new name for saving file it will give you original name as first argument you must return a string with filename and extension like "image.png" |

### resizeMode

> resize.resizeMode

- `cover`: (default) Preserving aspect ratio, ensure the image covers both provided dimensions by cropping/clipping to fit.
- `contain`: Preserving aspect ratio, contain within both provided dimensions using "letterboxing" where necessary.
- `fill`: Ignore the aspect ratio of the input and stretch to both provided dimensions. _i.e images will be starched to match size provided_
- `inside`: Preserving aspect ratio, resize the image to be as large as possible while ensuring its dimensions are less than or equal to both those specified. _i.e width will be fixed to max value you provide and height will be adjusted to a lower value than provided according to Aspect Ratio_ .
- `outside`: Preserving aspect ratio, resize the image to be as small as possible while ensuring its dimensions are greater than or equal to both those specified. _i.e height will be fixed to value you provide and width will be adjusted to a higher value than provided according to Aspect Ratio_

### withoutEnlargement

> resize.withoutEnlargement

If ```withoutEnlargement``` is true, image to be resized is smaller than selected size, resize operation will not be performed.

### location

> watermarkOptions.location

watermarkOptions supports total 5 locations : `"center","top-left","top-right","bottom-left","bottom-right"`

### filename

Option to return a new name for saving file it will give you original name as first argument you must return a string with filename and extension like "image.png"
ex:

```js
const newFilenameFunction = (og_filename, options) => {
  const newname =
    og_filename.split(".").slice(0, -1).join(".") +
    `${options.useTimestamp ? "-" + Date.now() : ""}` +
    "." +
    options.fileFormat;
  return newname;
};
```

If you want to use a request field called `metadata` passed in the body to generate the filename, you can do it like this:

```js
const newFilenameFunction = (og_filename, options, req) => {
  return `${og_filename}_${req.body.metadata}.${options.fileFormat}`;
};
```

Note that any other field present in the request body will work.

Feel free to open a Issue for features or bug fixes

Thanks
