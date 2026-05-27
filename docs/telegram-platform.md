# Telegram And Player Data Foundation

This project uses a separate local platform API for account and permanent player data.

## Local Services

- Game client: `http://127.0.0.1:3000`
- Real-time game server: `ws://127.0.0.1:8080`
- Platform API: `http://127.0.0.1:3001`

Run all three with:

```bash
npm start
```

Run only the platform API with:

```bash
npm run start:api
```

## Telegram Mini App Authentication

The client sends `Telegram.WebApp.initData` to `POST /api/auth/telegram`.

The backend verifies the init data hash using `TELEGRAM_BOT_TOKEN`, then creates or updates a player row bound to the Telegram user id. The frontend never decides gems, XP, owned skins, or rewards. It only receives a server-owned profile.

Required production environment variable:

```bash
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
```

For local API testing only, you can enable a fake development login:

```bash
TELEGRAM_DEV_AUTH=1 npm run start:api
```

Then send:

```bash
curl -X POST http://127.0.0.1:3001/api/auth/telegram \
  -H "content-type: application/json" \
  -d "{\"initData\":\"dev\"}"
```

Do not enable `TELEGRAM_DEV_AUTH` in production.

## Database Tables

The SQLite database is created at `data/noxgar.sqlite` by default.

- `players`: Telegram-bound identity.
- `player_wallets`: gems, XP, level.
- `player_stats`: high score and lifetime gameplay stats.
- `player_inventory`: owned skins/items.
- `player_settings`: saved player preferences.
- `sessions`: hashed API session tokens.

SQLite is good for local development. Before large public launch, we should move permanent data to PostgreSQL or another managed production database.

## Security Rules

- Trust only Telegram `initData` after backend verification.
- Store Telegram ids as strings because Telegram ids can be large.
- Never let the browser directly add gems, XP, skins, or rewards.
- Keep session tokens out of logs.
- Use HTTPS/WSS in production, especially inside Telegram.
