import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());

app.use(express.json({
  limit: "50mb",
}));

/* =========================
   DATABASE CONNECTION
========================= */

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

/* =========================
   API ROUTES
========================= */

app.get("/api/health", (req, res) => {
  res.json({
    status: "UP",
    message: "CampusPulse Node Active",
  });
});

/* =========================
   EVENTS
========================= */

app.get("/api/events", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM events ORDER BY date DESC"
    );

    res.json(rows);

  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/* =========================
   USERS
========================= */

app.get("/api/users", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM users"
    );

    res.json(rows);

  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/* =========================
   FEEDBACK
========================= */

app.get("/api/feedback", async (req, res) => {
  try {
    const [messages] = await pool.query(
      "SELECT * FROM feedback ORDER BY timestamp DESC"
    );

    res.json(messages);

  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/* =========================
   AUDIT
========================= */

app.get("/api/audit", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM audit_logs ORDER BY timestamp DESC"
    );

    res.json(rows);

  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/* =========================
   SERVE FRONTEND
========================= */

app.use(express.static(path.join(__dirname, "dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

/* =========================
   START SERVER
========================= */

app.listen(PORT, () => {
  console.log("=================================");
  console.log("DATABASE CONNECTED");
  console.log(`SERVER RUNNING ON PORT ${PORT}`);
  console.log("=================================");
});
