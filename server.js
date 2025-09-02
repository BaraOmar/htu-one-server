import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import pgClient from "./db.js";


dotenv.config();

const app = express();
const PORT = process.env.PORT;

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// check the connection on localhost:5000/
app.get("/", (req, res) => {
    res.send("🚀 PostgreSQL + Express API is running!");
});


pgClient.connect().then(()=>{
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
});