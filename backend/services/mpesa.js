const axios = require("axios");

function formatPhone(phone) {
  let value = String(phone || "").replace(/[^\d+]/g, "");
  if (value.startsWith("+254")) return value.substring(1);
  if (value.startsWith("07") || value.startsWith("01")) {
    value = "254" + value.substring(1);
  }
  if (!/^254[17]\d{8}$/.test(value)) {
    const error = new Error("Enter a valid Kenyan M-Pesa phone number");
    error.status = 400;
    throw error;
  }
  return value;
}

function darajaTimestamp(date = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date).map(part => [part.type, part.value]));

  return `${parts.year}${parts.month}${parts.day}${parts.hour}${parts.minute}${parts.second}`;
}

async function getAccessToken() {
  const env = process.env.MPESA_ENV === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";

  const credentials = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
  ).toString("base64");

  const response = await axios.get(
    `${env}/oauth/v1/generate?grant_type=client_credentials`,
    {
      headers: {
        Authorization: `Basic ${credentials}`
      },
      timeout: 15000
    }
  );

  return { token: response.data.access_token, base: env };
}

async function stkPush({ phone, amount, accountReference, description }) {
  if (process.env.PAYMENT_MODE !== "DARAJA") {
    return {
      demo: true,
      checkoutRequestId: "DEMO-" + Date.now(),
      customerMessage: "Demo payment accepted. No real M-Pesa money was moved."
    };
  }

  const { token, base } = await getAccessToken();

  const timestamp = darajaTimestamp();

  const password = Buffer.from(
    `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
  ).toString("base64");

  const response = await axios.post(
    `${base}/mpesa/stkpush/v1/processrequest`,
    {
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: process.env.MPESA_TRANSACTION_TYPE || "CustomerPayBillOnline",
      Amount: Math.round(amount),
      PartyA: formatPhone(phone),
      PartyB: process.env.MPESA_SHORTCODE,
      PhoneNumber: formatPhone(phone),
      CallBackURL: process.env.MPESA_CALLBACK_URL,
      AccountReference: accountReference,
      TransactionDesc: description
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      timeout: 15000
    }
  );

  return response.data;
}

module.exports = { stkPush, formatPhone, darajaTimestamp };
