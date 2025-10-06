const request = require("supertest");
const app = require("../app.js");

describe("Teste do encurtador de URL", () => {
  let shortUrl = "";

  test("Deve encurtar uma URL válida", async () => {
    const res = await request(app)
      .post("/shorten")
      .send({ url: "https://www.google.com" })
      .expect(200);

    expect(res.body).toHaveProperty("original_url", "https://www.google.com");
    expect(res.body).toHaveProperty("short_url");

    shortUrl = res.body.short_url;
  });

  test("Deve redirecionar a URL encurtada", async () => {
    const code = shortUrl.split("/").pop();
    const res = await request(app).get(`/${code}`).expect(302);

    expect(res.headers.location).toBe("https://www.google.com");
  });

  test("Deve mostrar estatísticas válidas", async () => {
    const code = shortUrl.split("/").pop();
    const res = await request(app).get(`/statics/${code}`).expect(200);
  });

  test("Deve deletar a URL encurtada", async () => {
    const code = shortUrl.split("/").pop();
    const res = await request(app).delete(`/${code}`).expect(200);

    expect(res.text).toMatch(/removida com sucesso/i);
  });

  test("Não deve encurtar se a URL for inválida", async () => {
    const res = await request(app)
      .post("/shorten")
      .send({ url: "url-invalida" })
      .expect(400);

    expect(res.text).toMatch("A URL informada não é válida!");
  });
});
