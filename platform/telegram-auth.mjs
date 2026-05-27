import { createHmac, timingSafeEqual } from "node:crypto";

const DEFAULT_MAX_AUTH_AGE_SECONDS = 24 * 60 * 60;

function safeEqualHex(a, b) {
  if (!/^[a-f0-9]+$/i.test(a) || !/^[a-f0-9]+$/i.test(b)) return false;
  const left = Buffer.from(a, "hex");
  const right = Buffer.from(b, "hex");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function parseTelegramInitData(initData) {
  if (typeof initData !== "string" || initData.length === 0) {
    throw new Error("Telegram initData is required.");
  }

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) throw new Error("Telegram initData hash is missing.");

  const pairs = [];
  for (const [key, value] of params.entries()) {
    if (key === "hash") continue;
    pairs.push([key, value]);
  }
  pairs.sort(([a], [b]) => a.localeCompare(b));

  const raw = Object.fromEntries(pairs);
  const parsed = { ...raw };
  for (const key of ["user", "receiver", "chat"]) {
    if (typeof parsed[key] === "string") {
      parsed[key] = JSON.parse(parsed[key]);
    }
  }

  return {
    hash,
    parsed,
    dataCheckString: pairs.map(([key, value]) => `${key}=${value}`).join("\n")
  };
}

export function verifyTelegramInitData(initData, botToken, options = {}) {
  if (!botToken) throw new Error("TELEGRAM_BOT_TOKEN is not configured.");

  const maxAgeSeconds = options.maxAgeSeconds ?? DEFAULT_MAX_AUTH_AGE_SECONDS;
  const nowSeconds = options.nowSeconds ?? Math.floor(Date.now() / 1000);
  const { hash, parsed, dataCheckString } = parseTelegramInitData(initData);
  const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
  const expectedHash = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  if (!safeEqualHex(expectedHash, hash)) {
    throw new Error("Telegram initData hash is invalid.");
  }

  const authDate = Number(parsed.auth_date);
  if (!Number.isFinite(authDate)) {
    throw new Error("Telegram auth_date is invalid.");
  }
  if (maxAgeSeconds > 0 && nowSeconds - authDate > maxAgeSeconds) {
    throw new Error("Telegram initData is expired.");
  }

  if (!parsed.user || !parsed.user.id) {
    throw new Error("Telegram user is missing.");
  }

  return parsed;
}
