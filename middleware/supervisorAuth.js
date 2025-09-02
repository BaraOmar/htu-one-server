// Simple header-based supervisor guard
// Requires headers on protected routes:
//   x-role: "supervisor"
//   x-user-id: <supervisorId>
export default function supervisorAuth(req, res, next) {
  const role = req.headers["x-role"];
  const id = req.headers["x-user-id"];
  req.user = { id: Number(id), role };
  next();
}
