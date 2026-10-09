const DARAJA_REQUIRED = [
  "MPESA_CONSUMER_KEY",
  "MPESA_CONSUMER_SECRET",
  "MPESA_SHORTCODE",
  "MPESA_PASSKEY",
  "MPESA_CALLBACK_URL",
  "MPESA_CALLBACK_TOKEN"
];

function validateEnvironment(env = process.env) {
  const paymentMode = (env.PAYMENT_MODE || "DEMO").toUpperCase();
  if (!["DEMO", "DARAJA"].includes(paymentMode)) {
    throw new Error("PAYMENT_MODE must be DEMO or DARAJA");
  }

  if (paymentMode === "DARAJA") {
    const missing = DARAJA_REQUIRED.filter(key => !env[key]);
    if (missing.length) {
      throw new Error(`Missing Daraja configuration: ${missing.join(", ")}`);
    }

    if (!["sandbox", "production"].includes(env.MPESA_ENV)) {
      throw new Error("MPESA_ENV must be sandbox or production");
    }

    if (!["CustomerPayBillOnline", "CustomerBuyGoodsOnline"].includes(
      env.MPESA_TRANSACTION_TYPE || "CustomerPayBillOnline"
    )) {
      throw new Error("MPESA_TRANSACTION_TYPE must be CustomerPayBillOnline or CustomerBuyGoodsOnline");
    }

    let callback;
    try {
      callback = new URL(env.MPESA_CALLBACK_URL);
    } catch {
      throw new Error("MPESA_CALLBACK_URL must be a valid public HTTPS URL");
    }
    if (callback.protocol !== "https:" || callback.hostname.includes("your_public_api_domain")) {
      throw new Error("MPESA_CALLBACK_URL must be a public HTTPS URL");
    }
    if (env.MPESA_CALLBACK_URL.includes("replace_with_same_callback_token")) {
      throw new Error("Replace the callback token placeholder in MPESA_CALLBACK_URL");
    }
    if (env.MPESA_CALLBACK_TOKEN.length < 32) {
      throw new Error("MPESA_CALLBACK_TOKEN must be at least 32 characters");
    }
    const callbackToken = decodeURIComponent(callback.pathname.split("/").pop());
    if (callbackToken !== env.MPESA_CALLBACK_TOKEN) {
      throw new Error("The final MPESA_CALLBACK_URL path segment must match MPESA_CALLBACK_TOKEN");
    }
  }

  if (env.NODE_ENV === "production") {
    if (!env.MONGO_URI) throw new Error("MONGO_URI is required in production");
    if (!env.JWT_SECRET || env.JWT_SECRET.length < 32 || env.JWT_SECRET.includes("change_this")) {
      throw new Error("Set JWT_SECRET to a private random value of at least 32 characters");
    }
    if (paymentMode !== "DARAJA" || env.MPESA_ENV !== "production") {
      throw new Error("Production requires PAYMENT_MODE=DARAJA and MPESA_ENV=production");
    }

    const origins = (env.CLIENT_URL || "").split(",").map(value => value.trim()).filter(Boolean);
    if (origins.length === 0 || origins.some(value => {
      try { return new URL(value).protocol !== "https:"; }
      catch { return true; }
    })) {
      throw new Error("CLIENT_URL must contain the public frontend HTTPS origin(s)");
    }
  }

  return { paymentMode };
}

module.exports = { validateEnvironment };