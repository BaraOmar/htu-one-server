import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import pgClient from "./db.js";
import authRoutes from "./routes/auth.js";
import coursesRoutes from "./routes/courses.js";
import requestsRoutes from "./routes/requests.js";
import supervisorsRoutes from "./routes/supervisors.js";



dotenv.config();
const app = express();
const PORT = process.env.PORT;

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));


app.use("/api/auth", authRoutes);
app.use("/api/courses", coursesRoutes);
app.use("/api/requests", requestsRoutes);
app.use("/api/supervisors", supervisorsRoutes);

pgClient.connect().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
});