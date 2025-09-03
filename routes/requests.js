import express from "express";
import db from "../db.js";
const router = express.Router();

// Create a request with exactly 6 courses
router.post("/", async (req, res) => {
  const { student_id, preferences } = req.body;
  if (!student_id || !preferences || preferences.length !== 6) {
    return res.status(400).json({ message: "student_id and exactly 6 courses are required" });
  }

try {
    await db.query("BEGIN");

    // 🔁 Remove any existing request(s) for this student (preferences deleted via ON DELETE CASCADE)
    await db.query("DELETE FROM requests WHERE student_id = $1", [student_id]);

    // ➕ Create fresh request
    const { rows: [request] } = await db.query(
      "INSERT INTO requests (student_id) VALUES ($1) RETURNING id, submitted_at",
      [student_id]
    );

    // ➕ Insert the 6 selected courses (status defaults to 'pending')
    for (const p of preferences) {
      await db.query(
        "INSERT INTO request_preferences (request_id, course_id, student_comment) VALUES ($1,$2,$3)",
        [request.id, p.courseId, p.comment || null]
      );
    }

    // 📄 Return the newly created request (flat rows: one per course)
    const result = await db.query(
      `SELECT r.id AS request_id, r.submitted_at,
              c.id AS course_id, c.course_number, c.name AS course_name,
              rp.student_comment, rp.status
         FROM request_preferences rp
         JOIN courses c ON rp.course_id = c.id
         JOIN requests r ON rp.request_id = r.id
        WHERE r.id = $1
        ORDER BY c.course_number`,
      [request.id]
    );

    await db.query("COMMIT");
    res.status(201).json({ request: result.rows });
  } catch (e) {
    await db.query("ROLLBACK");
    console.error(e);
    res.status(400).json({ message: "Create/replace failed" });
  }
});


// Get all my requests (flat, one row per course)
router.get("/:student_id", async (req, res) => {
  const result = await db.query(
    `SELECT r.id AS request_id, r.submitted_at,
            c.id AS course_id, c.course_number, c.name AS course_name,
            rp.student_comment, rp.status
       FROM requests r
       JOIN request_preferences rp ON rp.request_id = r.id
       JOIN courses c ON rp.course_id = c.id
      WHERE r.student_id = $1
      ORDER BY r.submitted_at DESC, c.course_number`,
    [req.params.student_id]
  );
  res.json(result.rows);
});

// Delete one course from my request (only if not approved) and return updated request
router.delete("/:request_id/preferences/:course_id/:student_id", async (req, res) => {
  const { request_id, course_id, student_id } = req.params;

  const pref = await db.query(
    `SELECT rp.id, rp.status
       FROM requests r
       JOIN request_preferences rp ON rp.request_id = r.id
      WHERE r.id=$1 AND r.student_id=$2 AND rp.course_id=$3`,
    [request_id, student_id, course_id]
  );

  if (pref.rows.length === 0) return res.status(404).json({ message: "Course not found" });
  if (pref.rows[0].status === "approved")
    return res.status(409).json({ message: "Cannot delete approved course" });

  await db.query("DELETE FROM request_preferences WHERE id=$1", [pref.rows[0].id]);

  // Fetch the updated request with remaining courses
  const result = await db.query(
    `SELECT r.id AS request_id, r.submitted_at,
            c.id AS course_id, c.course_number, c.name AS course_name,
            rp.student_comment, rp.status
       FROM requests r
       JOIN request_preferences rp ON rp.request_id = r.id
       JOIN courses c ON rp.course_id = c.id
      WHERE r.id = $1 AND r.student_id = $2
      ORDER BY c.course_number`,
    [request_id, student_id]
  );

  res.json({ request: result.rows });
});


export default router;
