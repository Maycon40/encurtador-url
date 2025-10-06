function verifyCode(req, res, next) {
  const { code } = req.params;

  if (!code) {
    return res.status(400).send("O código da URL é obrigatório!");
  }

  next();
}

function verifyUrl(req, res, next) {
  if (!req.body || !req.body["url"]) {
    return res.status(400).send("A URL é obrigatória!");
  }

  const { url } = req.body;

  const urlRegex = /^(https?:\/\/)([\w.-]+)(:[0-9]{1,5})?(\/.*)?$/i;

  if (!urlRegex.test(url)) {
    return res.status(400).send("A URL informada não é válida!");
  }

  next();
}

module.exports = {
  verifyCode,
  verifyUrl,
};
