const express = require("express");
const dotenv = require("dotenv");
const crypto = require("crypto");
const { Pool } = require("pg");
const rateLimit = require("express-rate-limit");

const { verifyCode, verifyUrl } = require("./middleware");

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

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

app.use(express.json());
app.set("trust proxy", 1);

const host = process.env.POSTGRES_HOST;
const user = process.env.POSTGRES_USER;
const password = process.env.POSTGRES_PASSWORD;
const database = process.env.POSTGRES_DB;
const postgresPort = Number(process.env.POSTGRES_PORT) || 5432;

const pool = new Pool({
  host,
  user,
  password,
  database,
  port: postgresPort,
});

function generateCode() {
  return crypto.randomBytes(4).toString("hex");
}

app.get("/:code", limiterGet, verifyCode, async (req, res) => {
  try {
    const { code } = req.params;

    const result = await pool.query(
      "SELECT original_url FROM urls WHERE short_code = $1",
      [code]
    );

    if (result.rows.length === 0) {
      return res.status(404).send("URL não encontrada!");
    }

    // opcional: contabilizar clique
    await pool.query(
      "UPDATE urls SET clicks = clicks + 1 WHERE short_code = $1",
      [code]
    );

    return res.redirect(result.rows[0].original_url);
  } catch (err) {
    console.error(err);
    return res.status(500).send("Erro no servidor");
  }
});

app.post("/shorten", limiter, verifyUrl, async (req, res) => {
  const { url } = req.body;
  const code = generateCode();

  try {
    await pool.query(
      "INSERT INTO urls (short_code, original_url) VALUES ($1, $2)",
      [code, url]
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

app.delete("/:code", limiter, verifyCode, async (req, res) => {
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

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
