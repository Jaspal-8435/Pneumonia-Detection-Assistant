const mongoose = require("mongoose");

async function connectDB() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing from environment variables.");
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log("MongoDB connected");
  } catch (error) {
    if (error.message.includes("Could not connect to any servers")) {
      throw new Error(
        [
          "MongoDB Atlas connection failed.",
          "Most likely your current IP address is not allowed in Atlas Network Access.",
          "Go to Atlas > Network Access > Add IP Address > Add Current IP Address.",
          "For temporary college-project testing only, you can allow 0.0.0.0/0.",
          `Original error: ${error.message}`,
        ].join(" ")
      );
    }

    throw error;
  }
}

module.exports = connectDB;
