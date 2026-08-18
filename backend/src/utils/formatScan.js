function formatPatient(user) {
  if (!user) {
    return null;
  }

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

function formatScan(scan) {
  const doc = scan.toObject ? scan.toObject() : scan;

  return {
    id: doc._id,
    patient: formatPatient(doc.userId),
    imageUrl: doc.imageUrl,
    prediction: doc.prediction,
    confidence: doc.confidence,
    heatmapUrl: doc.heatmapUrl,
    doctorNote: doc.doctorNote || "",
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

module.exports = formatScan;

