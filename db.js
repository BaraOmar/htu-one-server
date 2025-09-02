import pg from 'pg';
import dotenv from "dotenv";

dotenv.config();

const pgClient = new pg.Client(process.env.DATABASE_URL);

export default pgClient;