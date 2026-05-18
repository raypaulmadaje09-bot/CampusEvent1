import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());

app.use(express.json({
  limit: "50mb",
}));

/* =========================
   DATABASE CONNECTION
========================= */

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "campus_event_scheduller",

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
   EVENTS
========================= */

// GET EVENTS
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

// CREATE EVENT
app.post("/api/events", async (req, res) => {
  try {
    const e = req.body;

    await pool.query(
      `
      INSERT INTO events (
        id,
        title,
        description,
        date,
        startTime,
        endTime,
        location,
        category,
        organizer,
        attendees,
        image,
        isPopular,
        isLive,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        e.id,
        e.title,
        e.description,
        e.date,
        e.startTime,
        e.endTime,
        e.location,
        e.category,
        e.organizer,
        e.attendees || 0,
        e.image || null,
        e.isPopular || false,
        e.isLive || false,
        e.status || "Pending",
      ]
    );

    res.status(201).json(e);

  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

// UPDATE EVENT STATUS
app.put("/api/events/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await pool.query(
      "UPDATE events SET status = ? WHERE id = ?",
      [status, id]
    );

    res.json({
      success: true,
    });

  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

// DELETE EVENT
app.delete("/api/events/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      "DELETE FROM events WHERE id = ?",
      [id]
    );

    res.json({
      success: true,
    });

  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/* =========================
   USERS
========================= */

// GET USERS
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

// CREATE USER
app.post("/api/users", async (req, res) => {
  try {
    const u = req.body;

    await pool.query(
      `
      INSERT INTO users (
        id,
        name,
        email,
        password,
        role,
        avatar
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        u.id,
        u.name,
        u.email,
        u.password,
        u.role,
        u.avatar || null,
      ]
    );

    res.status(201).json(u);

  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

// DELETE USER
app.delete("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      "DELETE FROM users WHERE id = ?",
      [id]
    );

    res.json({
      success: true,
    });

  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/* =========================
   FEEDBACK
========================= */

// GET FEEDBACK
app.get("/api/feedback", async (req, res) => {
  try {
    const [messages] = await pool.query(
      "SELECT * FROM feedback ORDER BY timestamp DESC"
    );

    for (let msg of messages) {
      const [replies] = await pool.query(
        "SELECT * FROM replies WHERE feedback_id = ? ORDER BY timestamp ASC",
        [msg.id]
      );

      msg.replies = replies;
    }

    res.json(messages);

  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

// CREATE FEEDBACK
app.post("/api/feedback", async (req, res) => {
  try {
    const m = req.body;

    await pool.query(
      `
      INSERT INTO feedback (
        id,
        senderName,
        senderEmail,
        subject,
        message,
        timestamp,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        m.id,
        m.senderName,
        m.senderEmail,
        m.subject,
        m.message,
        m.timestamp,
        m.status || "new",
      ]
    );

    res.status(201).json(m);

  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

// REPLY TO FEEDBACK
app.post("/api/feedback/:id/reply", async (req, res) => {
  try {
    const { id } = req.params;
    const { sender, text, timestamp } = req.body;

    await pool.query(
      `
      INSERT INTO replies (
        feedback_id,
        sender,
        text,
        timestamp
      )
      VALUES (?, ?, ?, ?)
      `,
      [
        id,
        sender,
        text,
        timestamp,
      ]
    );

    await pool.query(
      'UPDATE feedback SET status = "replied" WHERE id = ?',
      [id]
    );

    res.status(201).json({
      success: true,
    });

  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/* =========================
   AUDIT LOGS
========================= */

// GET AUDIT LOGS
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

// CREATE AUDIT LOG
app.post("/api/audit", async (req, res) => {
  try {
    const l = req.body;

    await pool.query(
      `
      INSERT INTO audit_logs (
        id,
        timestamp,
        action,
        actor,
        type,
        details
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        l.id,
        l.timestamp,
        l.action,
        l.actor,
        l.type,
        l.details,
      ]
    );

    res.status(201).json(l);

  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
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
