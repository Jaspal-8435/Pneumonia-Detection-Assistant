const Scan = require("../models/Scan");
const asyncHandler = require("../utils/asyncHandler");
const formatScan = require("../utils/formatScan");

const getStats = asyncHandler(async (req, res) => {
  const [totalScans, pneumoniaScans, normalScans, recentScans] = await Promise.all([
    Scan.countDocuments(),
    Scan.countDocuments({ prediction: "PNEUMONIA" }),
    Scan.countDocuments({ prediction: "NORMAL" }),
    Scan.find()
      .populate("userId", "name email role")
      .sort({ createdAt: -1 })
      .limit(5),
  ]);

  res.json({
    totalScans,
    pneumoniaScans,
    normalScans,
    pneumoniaRate: totalScans ? pneumoniaScans / totalScans : 0,
    recentScans: recentScans.map(formatScan),
  });
});

module.exports = { getStats };

