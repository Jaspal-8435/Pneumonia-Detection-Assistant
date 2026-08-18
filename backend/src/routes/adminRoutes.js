const express = require("express");

const { getStats } = require("../controllers/adminController");
const { authorize, protect } = require("../middleware/auth");

const router = express.Router();

router.get("/stats", protect, authorize("doctor"), getStats);

module.exports = router;

