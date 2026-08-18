const multer = require("multer");

const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];

// Memory storage keeps the file as a Buffer. That lets us send the same upload
// to Cloudinary and Flask without writing temporary files to disk.
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (!allowedMimeTypes.includes(file.mimetype)) {
    const error = new Error("Only JPG, PNG, and WEBP image files are allowed.");
    error.statusCode = 400;
    return cb(error);
  }
  return cb(null, true);
};

const uploadXray = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 8 * 1024 * 1024,
  },
}).single("image");

module.exports = uploadXray;
