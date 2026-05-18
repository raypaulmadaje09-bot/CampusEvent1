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
   PATH FIX
========================= */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* =========================
   MIDDLEWARE
========================= */
app.use(cors());
app.use(express.json({ limit: "50mb" }));

/* =========================
   DATABASE CONNECTION (AIVEN SAFE)
========================= */
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,

  ssl: { rejectUnauthorized: false }, // required for Aiven

  connectTimeout: 20000,  // prevent ETIMEDOUT
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

/* =========================
   ROUTES
========================= */
app.get("/", (req, res) => res.send("CampusPulse API Server Running"));

// DB Test
app.get("/api/db-test", async (req, res) => {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();

    res.json({ status: "CONNECTED", message: "Database reachable" });
  } catch (err) {
    console.error("DB ERROR:", err.message);
    res.status(500).json({ status: "FAILED", error: err.message });
  }
});

// Example Events API
app.get("/api/events", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM events ORDER BY date DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   FRONTEND SERVE
========================= */
const distPath = path.join(__dirname, "dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res) => res.sendFile(path.join(distPath, "index.html")));
}

/* =========================
   START SERVER
========================= */
app.listen(PORT, () => {
  console.log("=================================");
  console.log(`SERVER RUNNING ON PORT ${PORT}`);
  console.log("DATABASE CONNECTED");
  console.log("=================================");
});
