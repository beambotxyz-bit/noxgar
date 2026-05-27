import { createHash, randomBytes } from "node:crypto";
import { createServer } from "node:http";
import { openDatabase, getPlayerProfile, upsertTelegramPlayer } from "./database.mjs";
import { verifyTelegramInitData } from "./telegram-auth.mjs";

const PORT = Number(process.env.NOXGAR_API_PORT || 3001);
const DATABASE_PATH = process.env.NOXGAR_DATABASE_PATH || "data/noxgar.sqlite";
const SESSION_DAYS = Number(process.env.NOXGAR_SESSION_DAYS || 30);
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_DEV_AUTH = process.env.TELEGRAM_DEV_AUTH === "1";

const db = openDatabase(DATABASE_PATH);

function json(res, status, body) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type,authorization"
  });
  res.end(JSON.stringify(body));
}

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

function createSession(playerId) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  db.prepare("INSERT INTO sessions (token_hash, player_id, expires_at) VALUES (?, ?, ?)")
    .run(hashToken(token), playerId, expiresAt);
  return { token, expiresAt };
}

function getSessionPlayerId(req) {
  const header = req.headers.authorization || "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) return null;
  const row = db.prepare(`
    SELECT player_id
    FROM sessions
    WHERE token_hash = ? AND datetime(expires_at) > datetime('now')
  `).get(hashToken(match[1]));
  return row?.player_id ?? null;
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function devUser() {
  return {
    id: 1000000001,
    username: "dev_player",
    first_name: "Dev",
    last_name: "Player",
    language_code: "en"
  };
}

async function handle(req, res) {
  if (req.method === "OPTIONS") return json(res, 204, {});

  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  if (req.method === "GET" && url.pathname === "/health") {
    return json(res, 200, { ok: true, service: "noxgar-platform" });
  }

  if (req.method === "POST" && url.pathname === "/api/auth/telegram") {
    try {
      const body = await readJson(req);
      let user;
      if (TELEGRAM_DEV_AUTH && body.initData === "dev") {
        user = devUser();
      } else {
        const auth = verifyTelegramInitData(body.initData, TELEGRAM_BOT_TOKEN);
        user = auth.user;
      }

      const player = upsertTelegramPlayer(db, user);
      const session = createSession(player.id);
      return json(res, 200, {
        ok: true,
        session,
        profile: getPlayerProfile(db, player.id)
      });
    } catch (error) {
      return json(res, 401, { ok: false, error: error.message });
    }
  }

  if (req.method === "GET" && url.pathname === "/api/me") {
    const playerId = getSessionPlayerId(req);
    if (!playerId) return json(res, 401, { ok: false, error: "Session is missing or expired." });
    return json(res, 200, { ok: true, profile: getPlayerProfile(db, playerId) });
  }

  return json(res, 404, { ok: false, error: "Not found." });
}

createServer((req, res) => {
  handle(req, res).catch(error => json(res, 500, { ok: false, error: error.message }));
}).listen(PORT, "127.0.0.1", () => {
  console.log(`Noxgar platform API running at http://127.0.0.1:${PORT}`);
});
