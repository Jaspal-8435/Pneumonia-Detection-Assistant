const { Readable } = require("stream");

const cloudinary = require("../config/cloudinary");

function uploadBufferToCloudinary(buffer, folder) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        return resolve(result);
      }
    );

    Readable.from(buffer).pipe(uploadStream);
  });
}

async function uploadBase64Image(base64Image, folder) {
  const imagePayload = base64Image.startsWith("data:")
    ? base64Image
    : `data:image/png;base64,${base64Image}`;

  return cloudinary.uploader.upload(imagePayload, {
    folder,
    resource_type: "image",
  });
}

module.exports = {
  uploadBase64Image,
  uploadBufferToCloudinary,
};

