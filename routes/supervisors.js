import express from "express";
import db from "../db.js";
const router = express.Router();

/**
 * List my students
 * GET /api/supervisors/:supervisor_id/students
 */
router.get("/:supervisor_id/students", async (req, res) => {
  const { supervisor_id } = req.params;
  const r = await db.query(
    "SELECT id, full_name, email FROM students WHERE supervisor_id = $1 ORDER BY full_name",
    [supervisor_id]
  );
  res.json(r.rows);
});

/**
 * Pending requests (flat rows) from my students ONLY
 * GET /api/supervisors/:supervisor_id/requests
 */
router.get("/:supervisor_id/requests", async (req, res) => {
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
});

/**
 * Requests for a specific student of mine (flat rows)
 * GET /api/supervisors/:supervisor_id/students/:student_id/requests
 */
router.get("/:supervisor_id/students/:student_id/requests", async (req, res) => {
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
});


/**
 * Update status of ONE course inside a request
 * PATCH /api/supervisors/:supervisor_id/requests/:request_id/courses/:course_id/status
 * body: { status: "need_feedback" | "approved" | "pending" }
 */
router.patch("/:supervisor_id/requests/:request_id/courses/:course_id/status", async (req, res) => {
  const { request_id, course_id } = req.params;
  const { status } = req.body;

  // Update directly
  await db.query(
    `UPDATE request_preferences SET status = $1
     WHERE request_id = $2 AND course_id = $3`,
    [status, request_id, course_id]
  );

  // Return the updated request (flat rows)
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
});


export default router;
