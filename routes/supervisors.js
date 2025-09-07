import express from "express";
import db from "../db.js";
import supervisorAuth from "../middleware/supervisorAuth.js";

const router = express.Router();

/**
 * GET /api/supervisors/:supervisor_id/students
 */
// Endpoint to fetch students with the last submission date
router.get("/:supervisor_id/students", supervisorAuth, async (req, res) => {
  try {
    const { supervisor_id } = req.params;

    // Query to get students with the latest request submission date
    const result = await db.query(
      `SELECT s.id, s.full_name, s.email, 
              (SELECT r.submitted_at FROM requests r WHERE r.student_id = s.id ORDER BY r.submitted_at DESC LIMIT 1) AS last_submission
        FROM students s
        WHERE s.supervisor_id = $1
        ORDER BY s.full_name`,
      [supervisor_id]
    );

    // Return the students with their last submission date
    res.json(result.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});


/**
 * GET /api/supervisors/:supervisor_id/requests
 * (Pending only)
 */
router.get("/:supervisor_id/requests",supervisorAuth, async (req, res) => {
  try {
    const { supervisor_id } = req.params;
    const r = await db.query(
      `SELECT r.id AS request_id, r.submitted_at,
              s.id AS student_id, s.full_name AS student_name, s.email AS student_email,
              c.id AS course_id, c.course_number, c.name AS course_name,
              rp.student_comment, rp.status
         FROM students s
         JOIN requests r ON r.student_id = s.id
         JOIN request_preferences rp ON rp.request_id = r.id
         JOIN courses c ON c.id = rp.course_id
        WHERE s.supervisor_id = $1 AND rp.status = 'pending'
        ORDER BY r.submitted_at DESC, s.full_name, c.course_number`,
      [supervisor_id]
    );
    res.json(r.rows);
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET /api/supervisors/:supervisor_id/students/:student_id/requests
 */
router.get("/:supervisor_id/students/:student_id/requests",supervisorAuth, async (req, res) => {
  try {
    const { supervisor_id, student_id } = req.params;
    const r = await db.query(
      `SELECT r.id AS request_id, r.submitted_at,
              c.id AS course_id, c.course_number, c.name AS course_name,
              rp.student_comment, rp.status
         FROM students s
         JOIN requests r ON r.student_id = s.id
         JOIN request_preferences rp ON rp.request_id = r.id
         JOIN courses c ON c.id = rp.course_id
        WHERE s.supervisor_id = $1 AND s.id = $2
        ORDER BY r.submitted_at DESC, c.course_number`,
      [supervisor_id, student_id]
    );
    res.json(r.rows);
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * PATCH /api/supervisors/:supervisor_id/requests/:request_id/courses/:course_id/status
 * body: { status: "pending" | "need_feedback" | "approved" }
 */
router.patch("/:supervisor_id/requests/:request_id/courses/:course_id/status",supervisorAuth, async (req, res) => {
  try {
    const { request_id, course_id } = req.params;
    const { status } = req.body;

    // basic enum guard
    const allowed = new Set(["pending", "need_feedback", "approved"]);
    if (!allowed.has(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const upd = await db.query(
      `UPDATE request_preferences SET status = $1
       WHERE request_id = $2 AND course_id = $3`,
      [status, request_id, course_id]
    );

    if (upd.rowCount === 0) {
      return res.status(404).json({ message: "Preference not found" });
    }

    const r = await db.query(
      `SELECT r.id AS request_id, r.submitted_at,
              c.id AS course_id, c.course_number, c.name AS course_name,
              rp.student_comment, rp.status
         FROM requests r
         JOIN request_preferences rp ON rp.request_id = r.id
         JOIN courses c ON c.id = rp.course_id
        WHERE r.id = $1
        ORDER BY c.course_number`,
      [request_id]
    );

    res.json({ request: r.rows });
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
