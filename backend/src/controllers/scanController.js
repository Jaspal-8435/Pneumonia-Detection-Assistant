const Scan = require("../models/Scan");
const asyncHandler = require("../utils/asyncHandler");
const createError = require("../utils/createError");
const formatScan = require("../utils/formatScan");
const {
  uploadBase64Image,
  uploadBufferToCloudinary,
} = require("../services/cloudinaryService");
const { sendPredictionEmail } = require("../services/emailService");
const { requestPrediction } = require("../services/mlService");
const { generateScanReport } = require("../services/pdfService");

function ensureScanAccess(req, scan) {
  const isDoctor = req.user.role === "doctor";
  const ownsScan = scan.userId._id.toString() === req.user._id.toString();

  if (!isDoctor && !ownsScan) {
    throw createError("You can only access your own scans.", 403);
  }
}

const uploadScan = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw createError("Please upload an X-ray image in the 'image' field.", 400);
  }

  // Store the original X-ray first so the app has a permanent clinical record.
  const originalUpload = await uploadBufferToCloudinary(
    req.file.buffer,
    "pneumonia-assistant/originals"
  );

  let mlResult;
  try {
    mlResult = await requestPrediction(req.file);
  } catch (error) {
    console.error("ML prediction request failed:", {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw createError(
      "ML service is unavailable or failed to process this image.",
      503
    );
  }

  if (!mlResult.heatmap_image || !mlResult.prediction) {
    throw createError("ML service returned an incomplete prediction.", 502);
  }

  const heatmapUpload = await uploadBase64Image(
    mlResult.heatmap_image,
    "pneumonia-assistant/heatmaps"
  );

  const scan = await Scan.create({
    userId: req.user._id,
    imageUrl: originalUpload.secure_url,
    prediction: mlResult.prediction,
    confidence: Number(mlResult.confidence),
    heatmapUrl: heatmapUpload.secure_url,
  });

  const populatedScan = await scan.populate("userId", "name email role");

  // Email is optional. The core scan flow still succeeds if SMTP is not set.
  sendPredictionEmail(req.user, populatedScan).catch((error) => {
    console.error("Email notification failed:", error.message);
  });

  res.status(201).json({ scan: formatScan(populatedScan) });
});

const getHistory = asyncHandler(async (req, res) => {
  const filter = req.user.role === "doctor" ? {} : { userId: req.user._id };

  const scans = await Scan.find(filter)
    .populate("userId", "name email role")
    .sort({ createdAt: -1 });

  res.json({ scans: scans.map(formatScan) });
});

const getScanById = asyncHandler(async (req, res) => {
  const scan = await Scan.findById(req.params.id).populate("userId", "name email role");

  if (!scan) {
    throw createError("Scan not found.", 404);
  }

  ensureScanAccess(req, scan);
  res.json({ scan: formatScan(scan) });
});

const updateDoctorNote = asyncHandler(async (req, res) => {
  const { doctorNote = "" } = req.body;
  const scan = await Scan.findById(req.params.id).populate("userId", "name email role");

  if (!scan) {
    throw createError("Scan not found.", 404);
  }

  scan.doctorNote = String(doctorNote).slice(0, 1000);
  await scan.save();

  const populatedScan = await scan.populate("userId", "name email role");
  res.json({ scan: formatScan(populatedScan) });
});

const downloadReport = asyncHandler(async (req, res) => {
  const scan = await Scan.findById(req.params.id).populate("userId", "name email role");

  if (!scan) {
    throw createError("Scan not found.", 404);
  }

  ensureScanAccess(req, scan);
  await generateScanReport(res, scan);
});

module.exports = {
  downloadReport,
  getHistory,
  getScanById,
  updateDoctorNote,
  uploadScan,
};
