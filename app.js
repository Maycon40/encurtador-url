const express = require("express");
const router = require("./router");

const app = express();

app.use(express.json());
app.set("trust proxy", 1);

//Payments route
app.use(router);

module.exports = app;
