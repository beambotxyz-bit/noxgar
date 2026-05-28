# Mobile Test Deployment

Noxgar currently runs three local services during development:

- Client: `http://127.0.0.1:3000`
- Platform API: `http://127.0.0.1:3001`
- Game WebSocket server: `ws://127.0.0.1:8080`

That setup is best for LAN testing from a phone on the same Wi-Fi, but it is not yet a one-click public deployment because most hosts expose one public URL per service.

## Best test option right now

From a PC on the same Wi-Fi:

```bash
git pull
npm run setup
npm start
```

Then open the PC LAN URL on mobile:

```text
http://YOUR_PC_LAN_IP:3000
```

Example:

```text
http://192.168.0.229:3000
```

## Public test link roadmap

To make a real public phone test link, we should do one of these next:

### Option A: Single-process production server

Create one Node production entrypoint that serves:

- the client static files
- the game WebSocket server
- the platform API

from one public host/port.

This is the cleanest approach for Render, Railway, Fly.io, or similar hosts.

### Option B: Multi-service deployment

Deploy separate public services:

- static client service
- game WebSocket service
- platform API service

Then add runtime client config so the browser knows the public WebSocket/API URLs.

This is more flexible, but has more moving pieces.

## Recommended next engineering task

Implement Option A first. It will let the project deploy to one hosted URL and make mobile testing much easier.

Target result:

```text
https://noxgar-test.example-host.com
```

The same URL should serve the game page and accept the WebSocket connection.
