# Encurtador de URL

Este projeto é um **encurtador de URL** simples desenvolvido em **Node.js** com **Express** e **PostgreSQL**.  
Ele permite criar URLs curtas, redirecionar para o endereço original e rastrear cliques.

---

## Tecnologias usadas

- **Node.js + Express** – Servidor web e API
- **PostgreSQL** – Banco de dados para armazenar URLs
- **Docker & Docker Compose** – Facilita o deploy e ambiente local
- **crypto** – Para gerar códigos curtos únicos
- **express-rate-limit** – Limita requisições por IP
- **dotenv** – Para variáveis de ambiente

---

## Estrutura do projeto

```bash
├─ .env                # Variáveis de ambiente
├─ docker-compose.yml  # Configuração do Docker Compose
├─ init.sql            # Script inicial do banco
├─ package.json
└─ app/
   ├─ server.js        # Código do servidor Node.js
```

---

## Variáveis de ambiente (.env)

```bash
POSTGRES_USER=meuusuario
POSTGRES_PASSWORD=minhasenha
POSTGRES_DB=meubanco
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
PORT=3000
```

---

## Passo a passo para rodar localmente

### 1️⃣ Clonar o repositório

```bash
git clone https://github.com/Maycon40/encurtador-url.git
cd encurtador-url
```

### 2️⃣ Criar o arquivo `.env`

```bash
cp env.local.example .env
```

Obs: é importante customizar o arquivo `.env` com a sua própria senha.

---

### 3️⃣ Subir o servidor web e o banco de dados

```bash
npm run server
```

- Isso sobe o **Postgres** e o **Node.js**
- O `init.sql` será executado na primeira inicialização, criando a tabela `urls`.

---

## Endpoints da API

### 1️⃣ Criar URL encurtada

`POST /shorten`

**Body (JSON)**

```json
{
  "url": "https://www.google.com/"
}
```

**Resposta**

```json
{
  "original_url": "https://www.google.com/",
  "short_url": "http://localhost:3000/abc123"
}
```

---

### 2️⃣ Redirecionar para URL original

`GET /:code`

- `code` é o código retornado ao criar a URL
- Redireciona para a URL original e incrementa o contador de cliques.

---

### 3️⃣ Estatísticas do link

`GET /statics/:code`

- `code` é o código retornado ao criar a URL
- Mostra estatísticas do link.

**Resposta**

```json
{
  "original_url": "https://www.yourdomain.com",
  "short_url": "https://enc.maycon.dev.br/ad39e662",
  "clicks": 1,
  "created_at": "2025-10-06T17:30:03.008Z",
  "expires_at": "2025-10-06T17:30:03.008Z"
}
```

---

### 4️⃣ Deletar URL encurtada

`DELETE /:code`

- Remove a URL do banco de dados.
- Retorna mensagem de sucesso ou erro caso não exista.

---

## Observações

- O servidor precisa do **PostgreSQL** para funcionar.
- Para desenvolvimento, você pode acessar o container Node diretamente ou usar `localhost:3000`.
