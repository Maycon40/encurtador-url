require("dotenv").config();
const { Pool } = require("pg");

const app = require("./app");

const host = process.env.POSTGRES_HOST;
const user = process.env.POSTGRES_USER;
const password = process.env.POSTGRES_PASSWORD;
const database = process.env.POSTGRES_DB;
const ssl = Boolean(process.env.SSL) || false;
const postgresPort = Number(process.env.POSTGRES_PORT) || 5432;

const pool = new Pool({
  host,
  user,
  password,
  database,
  port: postgresPort,
  ssl,
});

pool.query(
  `CREATE TABLE IF NOT EXISTS urls (
    id SERIAL PRIMARY KEY,
    short_code VARCHAR(10) UNIQUE NOT NULL,
    original_url TEXT NOT NULL,
    clicks INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP
  )`
);

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
