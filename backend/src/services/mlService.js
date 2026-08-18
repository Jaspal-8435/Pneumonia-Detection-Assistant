const axios = require("axios");
const FormData = require("form-data");

function getMlApiBaseUrl() {
  return (
    process.env.ML_API_URL ||
    "https://pneumonia-detection-diagnosis-assistant-1.onrender.com"
  ).replace(/\/$/, "");
}

async function requestPrediction(file) {
  const form = new FormData();

  form.append("image", file.buffer, {
    filename: file.originalname || "xray.png",
    contentType: file.mimetype,
  });

  const response = await axios.post(`${getMlApiBaseUrl()}/predict`, form, {
    headers: form.getHeaders(),
    timeout: 120000,
  });

  return response.data;
}

module.exports = { requestPrediction };
