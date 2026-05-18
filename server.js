import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

/* =========================
   PATH FIX (REQUIRED FOR RENDER)
========================= */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* =========================
   MIDDLEWARE
========================= */
app.use(cors());
app.use(express.json({ limit: "50mb" }));

/* =========================
   DATABASE CONNECTION (ROBUST FIX)
========================= */
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT || 3306),

  ssl: {
    rejectUnauthorized: false,
  },

  connectTimeout: 60000, // increased timeout (important for Render → Aiven)
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

/* =========================
   TEST DB CONNECTION (IMPORTANT DEBUG ROUTE)
========================= */
app.get("/api/db-test", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 AS result");
    res.json({
      status: "CONNECTED",
      result: rows,
    });
  } catch (err) {
    console.error("DB ERROR:", err.message);

    res.status(500).json({
      status: "FAILED",
      error: err.message,
    });
  }
});

/* =========================
   BASIC ROUTES
========================= */
app.get("/", (req, res) => {
  res.send("CampusPulse API Server Running");
});

app.get("/api/health", (req, res) => {
  res.json({ status: "UP" });
});

/* =========================
   EVENTS EXAMPLE
========================= */
app.get("/api/events", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM events ORDER BY date DESC"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   SERVE FRONTEND (SAFE)
========================= */
const distPath = path.join(__dirname, "dist");

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));

  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

/* =========================
   START SERVER (DEBUG READY)
========================= */
app.listen(PORT, () => {
  console.log("=================================");
  console.log("🚀 SERVER RUNNING");
  console.log(`PORT: ${PORT}`);
  console.log("=================================");
});
