import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

export function openDatabase(filePath = "data/noxgar.sqlite") {
  const resolved = resolve(filePath);
  mkdirSync(dirname(resolved), { recursive: true });
  const db = new DatabaseSync(resolved);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");
  migrate(db);
  return db;
}

export function migrate(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_id TEXT NOT NULL UNIQUE,
      username TEXT,
      first_name TEXT,
      last_name TEXT,
      language_code TEXT,
      photo_url TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_login_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS player_wallets (
      player_id INTEGER PRIMARY KEY,
      gems INTEGER NOT NULL DEFAULT 0,
      xp INTEGER NOT NULL DEFAULT 0,
      level INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS player_stats (
      player_id INTEGER PRIMARY KEY,
      high_score INTEGER NOT NULL DEFAULT 0,
      total_score INTEGER NOT NULL DEFAULT 0,
      games_played INTEGER NOT NULL DEFAULT 0,
      cells_eaten INTEGER NOT NULL DEFAULT 0,
      players_eaten INTEGER NOT NULL DEFAULT 0,
      time_alive_seconds INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS player_inventory (
      player_id INTEGER NOT NULL,
      item_type TEXT NOT NULL,
      item_key TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      owned_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (player_id, item_type, item_key),
      FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS player_settings (
      player_id INTEGER PRIMARY KEY,
      settings_json TEXT NOT NULL DEFAULT '{}',
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      player_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      expires_at TEXT NOT NULL,
      FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
    );
  `);
}

export function upsertTelegramPlayer(db, user) {
  const telegramId = String(user.id);
  db.prepare(`
    INSERT INTO players (telegram_id, username, first_name, last_name, language_code, photo_url)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(telegram_id) DO UPDATE SET
      username = excluded.username,
      first_name = excluded.first_name,
      last_name = excluded.last_name,
      language_code = excluded.language_code,
      photo_url = excluded.photo_url,
      updated_at = CURRENT_TIMESTAMP,
      last_login_at = CURRENT_TIMESTAMP
  `).run(
    telegramId,
    user.username ?? null,
    user.first_name ?? null,
    user.last_name ?? null,
    user.language_code ?? null,
    user.photo_url ?? null
  );

  const player = db.prepare("SELECT * FROM players WHERE telegram_id = ?").get(telegramId);
  db.prepare("INSERT OR IGNORE INTO player_wallets (player_id) VALUES (?)").run(player.id);
  db.prepare("INSERT OR IGNORE INTO player_stats (player_id) VALUES (?)").run(player.id);
  db.prepare("INSERT OR IGNORE INTO player_settings (player_id) VALUES (?)").run(player.id);
  return player;
}

export function getPlayerProfile(db, playerId) {
  const player = db.prepare("SELECT * FROM players WHERE id = ?").get(playerId);
  if (!player) return null;
  return {
    player,
    wallet: db.prepare("SELECT gems, xp, level FROM player_wallets WHERE player_id = ?").get(playerId),
    stats: db.prepare(`
      SELECT high_score, total_score, games_played, cells_eaten, players_eaten, time_alive_seconds
      FROM player_stats
      WHERE player_id = ?
    `).get(playerId),
    inventory: db.prepare(`
      SELECT item_type, item_key, quantity
      FROM player_inventory
      WHERE player_id = ?
      ORDER BY item_type, item_key
    `).all(playerId),
    settings: db.prepare("SELECT settings_json FROM player_settings WHERE player_id = ?").get(playerId)
  };
}
