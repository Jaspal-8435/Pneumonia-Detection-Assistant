require("dotenv").config();

const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");

const adminRoutes = require("./routes/adminRoutes");
const authRoutes = require("./routes/authRoutes");
const scanRoutes = require("./routes/scanRoutes");
const { errorHandler, notFound } = require("./middleware/errorHandler");

const app = express();

function getAllowedOrigins() {
  const defaultOrigins = [
    "http://localhost:5173",
    "https://pneumonia-detection-diagnosis-assistant-tf5j.onrender.com",
  ];
  const configuredOrigins = process.env.CLIENT_URL || "";

  return [...defaultOrigins, ...configuredOrigins.split(",")]
    .map((origin) => origin.trim())
    .filter(Boolean);
}

const allowedOrigins = getAllowedOrigins();

// Security and request middleware used by every route.
app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "pneumonia-assistant-backend",
    message: "Backend API is running. Use /api/health for health checks.",
    health: "/api/health",
  });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "backend" });
});

app.use("/api/auth", authRoutes);
app.use("/api/scans", scanRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
