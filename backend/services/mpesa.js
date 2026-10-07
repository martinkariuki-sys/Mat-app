const axios = require("axios");

function formatPhone(phone) {
  let value = String(phone).replace(/\s+/g, "");
  if (value.startsWith("+254")) return value.substring(1);
  if (value.startsWith("254")) return value;
  if (value.startsWith("07")) return "254" + value.substring(1);
  if (value.startsWith("01")) return "254" + value.substring(1);
  return value;
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
      }
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

  const timestamp = new Date()
    .toISOString()
    .replace(/[-:TZ.]/g, "")
    .slice(0, 14);

  const password = Buffer.from(
    `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
  ).toString("base64");

  const response = await axios.post(
    `${base}/mpesa/stkpush/v1/processrequest`,
    {
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
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
      }
    }
  );

  return response.data;
}

module.exports = { stkPush };
