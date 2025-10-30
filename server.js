const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const apiRoutes = require("./routes/api");
const authRoutes = require("./routes/auth");

const app = express();
const PORT = process.env.PORT;
const MONGODB_URI =
  process.env.MONGODB_URI;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "home.html"));
});

app.use(express.static(path.join(__dirname, "public")));

app.use("/api/auth", authRoutes);
app.use("/api", apiRoutes);

async function start() {
  try {
    await mongoose.connect(MONGODB_URI, {});
    console.log("✅ Connected to MongoDB");
    app.listen(PORT, () =>
      console.log(`🚀 Server running on http://localhost:${PORT}`)
    );
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
}

start();
