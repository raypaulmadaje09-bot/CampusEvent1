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
   PATH FIX (RENDER SAFE)
========================= */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* =========================
   MIDDLEWARE
========================= */
app.use(cors());
app.use(express.json({ limit: "50mb" }));

/* =========================
   DATABASE CONNECTION (FINAL FIX)
========================= */
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,

  ssl: {
    rejectUnauthorized: false,
  },

  connectTimeout: 20000,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

/* =========================
   ROOT ROUTE
========================= */
app.get("/", (req, res) => {
  res.send("CampusPulse API Server Running");
});

/* =========================
   HEALTH CHECK
========================= */
app.get("/api/health", (req, res) => {
  res.json({
    status: "UP",
    message: "CampusPulse Node Active",
  });
});

/* =========================
   DB TEST (IMPORTANT)
========================= */
app.get("/api/db-test", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 + 1 AS result");

    res.json({
      status: "CONNECTED",
      result: rows[0].result,
    });
  } catch (err) {
    res.status(500).json({
      status: "FAILED",
      error: err.message,
    });
  }
});

/* =========================
   EVENTS API
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
   USERS API
========================= */
app.get("/api/users", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM users");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   FEEDBACK API
========================= */
app.get("/api/feedback", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM feedback ORDER BY timestamp DESC"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   AUDIT LOGS API
========================= */
app.get("/api/audit", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM audit_logs ORDER BY timestamp DESC"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   SERVE REACT BUILD
========================= */
const distPath = path.join(__dirname, "dist");

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));

  app.use((req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.send("Frontend not built. Run npm run build");
  });
}

/* =========================
   START SERVER
========================= */
app.listen(PORT, () => {
  console.log("=================================");
  console.log("DATABASE + SERVER RUNNING");
  console.log(`PORT: ${PORT}`);
  console.log("=================================");
});
