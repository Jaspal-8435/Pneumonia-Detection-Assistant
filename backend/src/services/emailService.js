const nodemailer = require("nodemailer");

function emailIsConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT || 587) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function sendPredictionEmail(user, scan) {
  if (!emailIsConfigured()) {
    return false;
  }

  const transporter = createTransporter();
  const confidencePercent = Math.round(scan.confidence * 100);

  await transporter.sendMail({
    from: process.env.SMTP_FROM || "Pneumonia Assistant <no-reply@example.com>",
    to: user.email,
    subject: "Your chest X-ray screening result is ready",
    text: [
      `Hello ${user.name},`,
      "",
      "Your uploaded chest X-ray has been processed.",
      `Prediction: ${scan.prediction}`,
      `Confidence: ${confidencePercent}%`,
      "",
      "Please consult a qualified doctor for final medical advice.",
    ].join("\n"),
  });

  return true;
}

module.exports = { sendPredictionEmail };

