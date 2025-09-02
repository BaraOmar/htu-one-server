import express from "express";
import db from "../db.js";

const router = express.Router();

/**
 * POST /api/auth/signup/student
 * body: { email, fullName, password }
 * - creates a student and sets supervisor_id = 1 automatically
 */
router.post("/signup/student", async (req, res) => {
  const { email, fullName, password } = req.body;
  if (!email || !fullName || !password) {
    return res.status(400).json({ message: "email, fullName, password are required" });
  }

  try {
    // Make sure email doesn't exist in either table
    const exists = await db.query(
      `SELECT email FROM students WHERE email=$1
       UNION
       SELECT email FROM supervisors WHERE email=$1`,
      [email]
    );
    if (exists.rows.length > 0) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const result = await db.query(
      `INSERT INTO students (email, full_name, password, supervisor_id)
       VALUES ($1, $2, $3, 1)
       RETURNING id, email, full_name, supervisor_id`,
      [email, fullName, password]
    );

    res.status(201).json({ user: { ...result.rows[0], role: "student" } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Student signup failed" });
  }
});

/**
 * POST /api/auth/signup/supervisor
 * body: { email, fullName, password }
 */
router.post("/signup/supervisor", async (req, res) => {
  const { email, fullName, password } = req.body;
  if (!email || !fullName || !password) {
    return res.status(400).json({ message: "email, fullName, password are required" });
  }

  try {
    const exists = await db.query(
      `SELECT email FROM students WHERE email=$1
       UNION
       SELECT email FROM supervisors WHERE email=$1`,
      [email]
    );
    if (exists.rows.length > 0) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const result = await db.query(
      `INSERT INTO supervisors (email, full_name, password)
       VALUES ($1, $2, $3)
       RETURNING id, email, full_name`,
      [email, fullName, password]
    );

    res.status(201).json({ user: { ...result.rows[0], role: "supervisor" } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Supervisor signup failed" });
  }
});

/**
 * POST /api/auth/login
 * body: { email, password }
 * returns: { id, role, fullName, email }
 * (Frontend stores this in localStorage and sends headers later)
 */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  // Try student first
  let r = await db.query(
    `SELECT id, email, full_name, password FROM students WHERE email=$1`,
    [email]
  );
  if (r.rows.length > 0) {
    const user = r.rows[0];
    if (user.password !== password) return res.status(401).json({ message: "Invalid credentials" });
    return res.json({ id: user.id, role: "student", fullName: user.full_name, email: user.email });
  }

  // Then supervisor
  r = await db.query(
    `SELECT id, email, full_name, password FROM supervisors WHERE email=$1`,
    [email]
  );
  if (r.rows.length > 0) {
    const user = r.rows[0];
    if (user.password !== password) return res.status(401).json({ message: "Invalid credentials" });
    return res.json({ id: user.id, role: "supervisor", fullName: user.full_name, email: user.email });
  }

  return res.status(401).json({ message: "Invalid credentials" });
});

export default router;
