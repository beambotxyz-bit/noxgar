# Noxgar

Noxgar is an agar.io-inspired multiplayer game foundation with:

- Node.js real-time game server based on MultiOgarII.
- Mobile/desktop canvas client based on Emupedia `agarv3`.
- Responsive mobile landscape touch controls.
- Telegram Mini App authentication foundation.
- SQLite-backed local player profile, wallet, stats, inventory, and settings tables.

## Local Setup

Install the game server dependency:

```bash
npm run setup
```

Start the local API, game server, and client:

```bash
npm start
```

Local URLs:

- Client: `http://127.0.0.1:3000`
- Game websocket server: `ws://127.0.0.1:8080`
- Platform API: `http://127.0.0.1:3001`

For phone testing on the same Wi-Fi/LAN, open the client with your computer's LAN IP, for example:

```text
http://192.168.0.229:3000
```

## Telegram Mini App

Set this environment variable before running the platform API in production:

```bash
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
```

More details are in `docs/telegram-platform.md`.

## Tests

Run Telegram auth tests:

```bash
npm run test:platform
```

## GitHub Workflow

This repo is intended to be the shared source of truth. From another PC:

```bash
git clone https://github.com/beambotxyz-bit/noxgar.git
cd noxgar
npm run setup
npm start
```
