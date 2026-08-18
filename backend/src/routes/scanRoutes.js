const express = require("express");

const {
  downloadReport,
  getHistory,
  getScanById,
  updateDoctorNote,
  uploadScan,
} = require("../controllers/scanController");
const { authorize, protect } = require("../middleware/auth");
const uploadXray = require("../middleware/upload");

const router = express.Router();

router.use(protect);

router.post("/upload", uploadXray, uploadScan);
router.get("/history", getHistory);
router.get("/:id/report", downloadReport);
router.patch("/:id/note", authorize("doctor"), updateDoctorNote);
router.get("/:id", getScanById);

module.exports = router;

