import express from "express";
import db from "../db.js";

const router = express.Router();

/**
 * GET /api/courses
 * List all courses 
 */
router.get("/", async (_req, res) => {
  try {
    const result = await db.query(
      "SELECT id, course_number, name FROM courses"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching courses" });
  }
});


export default router;
