const dotenv = require("dotenv");

dotenv.config();

const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

// The server starts only after MongoDB connects, so routes do not run with a
// missing database connection.
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Backend API running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start backend:", error.message);
    process.exit(1);
  });

process.on("unhandledRejection", (error) => {
  console.error("Unhandled rejection:", error.message);
  process.exit(1);
});
