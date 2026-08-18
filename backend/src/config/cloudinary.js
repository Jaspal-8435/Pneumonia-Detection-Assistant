const cloudinary = require("cloudinary").v2;

// Cloudinary keeps uploaded X-rays and Grad-CAM overlays outside the database.
// MongoDB stores only URLs and prediction metadata.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = cloudinary;

