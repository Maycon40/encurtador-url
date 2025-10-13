const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const { Pool } = require("pg");
const rateLimit = require("express-rate-limit");

require("dotenv").config();

const { verifyCode, verifyUrl } = require("./middlewares");
const req = require("express/lib/request");

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

function generateCode() {
  return crypto.randomBytes(4).toString("hex");
}

const configLimit = {
  message: "Muitas requisições. Tente novamente mais tarde.",
  standardHeaders: true,
  legacyHeaders: false,
};

const limiter = rateLimit({
  ...configLimit,
  windowMs: 5 * 60 * 1000,
  max: 3,
});

const limiterGet = rateLimit({
  ...configLimit,
  windowMs: 3 * 60 * 1000,
  max: 10,
});

router.get("/", async (req, res) => {
  try {
    res.send("Encurtador de URL");
  } catch (err) {
    console.error(err);
    return res.status(500).send("Erro no servidor");
  }
});

router.get("/api/v1/status", async (req, res) => {
  try {
    const updatedAt = new Date().toISOString();
    let status = "offline";
    let detail = "";

    try {
      const response = await fetch("https://enc.maycon.dev.br/");
      if (response.ok) status = "online";
      detail = `HTTP ${response.status}`;
    } catch (err) {
      detail = err instanceof Error ? err.message : String(err);
    }

    const databaseName = process.env.POSTGRES_DB;

    const maxConnectionsResult = await pool.query(`SHOW max_connections;`);
    const usedConnectionsResult = await pool.query(
      "SELECT count(*)::int FROM pg_stat_activity WHERE datname = $1;",
      [databaseName]
    );
    const versionResult = await pool.query("SHOW server_version;");

    const { server_version: version } = versionResult.rows[0];

    const { max_connections: maxConnections } = maxConnectionsResult.rows[0];

    const { count: usedConnections } = usedConnectionsResult.rows[0];

    res.json({
      updated_at: updatedAt,
      web_service: {
        status,
        detail,
        version: process.version,
      },
      dependencies: {
        database: {
          version,
          max_connections: Number(maxConnections),
          used_connections: usedConnections,
          status: maxConnections ? "online" : "offline",
        },
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Erro no servidor");
  }
});

router.get("/statics/:code", limiterGet, verifyCode, async (req, res) => {
  try {
    const { code } = req.params;

    const result = await pool.query(
      "SELECT clicks, original_url, created_at, expires_at FROM urls WHERE short_code = $1",
      [code]
    );

    if (result.rows.length === 0) {
      return res.status(404).send("URL não encontrada!");
    }

    const { original_url, clicks, created_at, expires_at } = result.rows[0];

    return res.send({
      original_url,
      short_url: `${req.protocol}://${req.get("host")}/${code}`,
      clicks,
      created_at,
      expires_at,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Erro no servidor");
  }
});

router.get("/:code", limiterGet, verifyCode, async (req, res) => {
  try {
    const { code } = req.params;

    const result = await pool.query(
      "SELECT original_url, expires_at FROM urls WHERE short_code = $1",
      [code]
    );

    if (result.rows.length === 0) {
      return res.status(404).send("URL não encontrada!");
    }

    const { original_url, expires_at } = result.rows[0];

    if (expires_at && new Date() > expires_at) {
      return res.status(410).send("Este link expirou!");
    }

    await pool.query(
      "UPDATE urls SET clicks = clicks + 1 WHERE short_code = $1",
      [code]
    );

    return res.redirect(original_url);
  } catch (err) {
    console.error(err);
    return res.status(500).send("Erro no servidor");
  }
});

router.post("/shorten", limiter, verifyUrl, async (req, res) => {
  const { url } = req.body;
  const code = generateCode();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  try {
    await pool.query(
      "INSERT INTO urls (short_code, original_url, expires_at) VALUES ($1, $2, $3)",
      [code, url, expiresAt]
    );

    return res.json({
      original_url: url,
      short_url: `${req.protocol}://${req.get("host")}/${code}`,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Erro ao salvar no banco");
  }
});

router.delete("/:code", limiter, verifyCode, async (req, res) => {
  try {
    const { code } = req.params;

    const result = await pool.query(
      "DELETE FROM urls WHERE short_code = $1 RETURNING *",
      [code]
    );

    if (result.rowCount === 0) {
      return res.status(404).send("URL não encontrada!");
    }

    return res.send("URL encurtada removida com sucesso!");
  } catch (err) {
    console.error(err);
    return res.status(500).send("Erro no servidor");
  }
});

module.exports = router;
