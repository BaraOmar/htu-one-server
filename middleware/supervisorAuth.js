// Simple header-based supervisor guard
// Requires headers on protected routes:
//   x-role: "supervisor"
export default function supervisorAuth(req, res, next) {
    const role = req.headers["x-role"];

    if (role === "supervisor") {
        next();
    } else {
        res.status(403).json({ message: "Admin access only" });
    }
}
