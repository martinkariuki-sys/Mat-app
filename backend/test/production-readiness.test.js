const test = require("node:test");
const assert = require("node:assert/strict");
const { validateEnvironment } = require("../config");
const { darajaTimestamp, formatPhone } = require("../services/mpesa");

function darajaEnvironment(overrides = {}) {
  const token = "a".repeat(64);
  return {
    PAYMENT_MODE: "DARAJA",
    MPESA_ENV: "sandbox",
    MPESA_CONSUMER_KEY: "sandbox-key",
    MPESA_CONSUMER_SECRET: "sandbox-secret",
    MPESA_SHORTCODE: "174379",
    MPESA_PASSKEY: "sandbox-passkey",
    MPESA_CALLBACK_TOKEN: token,
    MPESA_CALLBACK_URL: `https://api.example.test/api/payments/callback/${token}`,
    ...overrides
  };
}

test("defaults to non-charging demo mode", () => {
  assert.deepEqual(validateEnvironment({}), { paymentMode: "DEMO" });
});

test("requires complete Daraja configuration and matching callback token", () => {
  assert.throws(() => validateEnvironment({ PAYMENT_MODE: "DARAJA" }), /Missing Daraja configuration/);
  assert.throws(() => validateEnvironment(darajaEnvironment({
    MPESA_CALLBACK_URL: "https://api.example.test/api/payments/callback/wrong-token"
  })), /must match MPESA_CALLBACK_TOKEN/);
});

test("production refuses demo or sandbox payment mode", () => {
  assert.throws(() => validateEnvironment({
    NODE_ENV: "production",
    MONGO_URI: "mongodb+srv://example.test/matapp",
    JWT_SECRET: "s".repeat(64),
    CLIENT_URL: "https://matapp.example.test",
    PAYMENT_MODE: "DEMO"
  }), /requires PAYMENT_MODE=DARAJA/);
});

test("accepts complete production configuration", () => {
  const token = "b".repeat(64);
  const env = darajaEnvironment({
    NODE_ENV: "production",
    MONGO_URI: "mongodb+srv://example.test/matapp",
    JWT_SECRET: "s".repeat(64),
    CLIENT_URL: "https://matapp.example.test",
    MPESA_ENV: "production",
    MPESA_CALLBACK_TOKEN: token,
    MPESA_CALLBACK_URL: `https://api.example.test/api/payments/callback/${token}`
  });
  assert.deepEqual(validateEnvironment(env), { paymentMode: "DARAJA" });
});

test("normalizes Kenyan M-Pesa phones and rejects invalid values", () => {
  assert.equal(formatPhone("0712 345 678"), "254712345678");
  assert.equal(formatPhone("+254 112 345 678"), "254112345678");
  assert.throws(() => formatPhone("12345"), { status: 400 });
});

test("formats Daraja timestamps in Nairobi time", () => {
  assert.equal(darajaTimestamp(new Date("2026-01-02T00:00:00.000Z")), "20260102030000");
});