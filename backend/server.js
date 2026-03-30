require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173", 
  credentials: true 
})); 
app.use(express.json()); // Parses incoming JSON requests
app.use(cookieParser()); // Parses HttpOnly cookies

// Database Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB: Titan Data Layer Active"))
  .catch((err) => console.error("Database connection failed:", err));

const authRoutes = require("./routes/auth");
const transactionRoutes = require("./routes/transactions");
const goalRoutes = require("./routes/goals");

app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/goals", goalRoutes);

// Basic Health Check Route
app.get("/health", (req, res) => {
  res.status(200).json({ status: "Operational", precision: "Decimal128" });
});

const PORT = process.env.PORT || 5000;
// Only listen when running locally (Vercel will ignore this in serverless mode)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`Wealth Engine running on port ${PORT}`));
}

// Export for Vercel Serverless Functions
module.exports = app;
