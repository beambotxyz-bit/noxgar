import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import { verifyTelegramInitData } from "./telegram-auth.mjs";

function buildInitData(fields, botToken) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(fields)) {
    params.set(key, typeof value === "string" ? value : JSON.stringify(value));
  }
  const pairs = [...params.entries()].sort(([a], [b]) => a.localeCompare(b));
  const dataCheckString = pairs.map(([key, value]) => `${key}=${value}`).join("\n");
  const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
  const hash = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
  params.set("hash", hash);
  return params.toString();
}

test("verifies valid Telegram Mini App initData", () => {
  const botToken = "123456:ABCDEF";
  const initData = buildInitData({
    auth_date: "1893456000",
    query_id: "AAExample",
    user: { id: 42, first_name: "Test", username: "tester" }
  }, botToken);

  const parsed = verifyTelegramInitData(initData, botToken, {
    nowSeconds: 1893456010,
    maxAgeSeconds: 60
  });

  assert.equal(parsed.user.id, 42);
  assert.equal(parsed.user.username, "tester");
});

test("rejects tampered Telegram Mini App initData", () => {
  const botToken = "123456:ABCDEF";
  const initData = buildInitData({
    auth_date: "1893456000",
    user: { id: 42, first_name: "Test" }
  }, botToken).replace("Test", "Evil");

  assert.throws(() => verifyTelegramInitData(initData, botToken, {
    nowSeconds: 1893456010,
    maxAgeSeconds: 60
  }), /invalid/);
});

test("rejects expired Telegram Mini App initData", () => {
  const botToken = "123456:ABCDEF";
  const initData = buildInitData({
    auth_date: "100",
    user: { id: 42, first_name: "Test" }
  }, botToken);

  assert.throws(() => verifyTelegramInitData(initData, botToken, {
    nowSeconds: 200,
    maxAgeSeconds: 60
  }), /expired/);
});
