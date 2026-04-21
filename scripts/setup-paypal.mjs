#!/usr/bin/env node
/**
 * Setup PayPal products + billing plans for Reelmotion subscriptions.
 *
 * Usage:
 *   PAYPAL_ENV=sandbox PAYPAL_CLIENT_ID=xxx PAYPAL_SECRET=yyy node scripts/setup-paypal.mjs
 *   PAYPAL_ENV=live    PAYPAL_CLIENT_ID=xxx PAYPAL_SECRET=yyy node scripts/setup-paypal.mjs
 *
 * Reuses an existing product if PAYPAL_PRODUCT_ID is set; otherwise creates one.
 */

const ENV = process.env.PAYPAL_ENV || "sandbox";
const CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const SECRET = process.env.PAYPAL_SECRET;
const EXISTING_PRODUCT_ID = process.env.PAYPAL_PRODUCT_ID || null;

if (!CLIENT_ID || !SECRET) {
  console.error("Missing PAYPAL_CLIENT_ID or PAYPAL_SECRET env vars.");
  process.exit(1);
}

const API_BASE =
  ENV === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

const PLANS = [
  { key: "PRO_MONTHLY", name: "Pro Monthly", value: "17.99", unit: "MONTH" },
  { key: "PRO_YEARLY", name: "Pro Yearly", value: "194.99", unit: "YEAR" },
  { key: "ELITE_MONTHLY", name: "Elite Monthly", value: "47.99", unit: "MONTH" },
  { key: "ELITE_YEARLY", name: "Elite Yearly", value: "518.28", unit: "YEAR" },
];

async function getAccessToken() {
  const res = await fetch(`${API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization:
        "Basic " + Buffer.from(`${CLIENT_ID}:${SECRET}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) {
    throw new Error(`OAuth failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.access_token;
}

async function createProduct(token) {
  if (EXISTING_PRODUCT_ID) {
    console.log(`Reusing product ${EXISTING_PRODUCT_ID}`);
    return EXISTING_PRODUCT_ID;
  }
  const res = await fetch(`${API_BASE}/v1/catalogs/products`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "Reelmotion Subscription",
      description: "Access to Reelmotion AI subscription plans",
      type: "SERVICE",
      category: "SOFTWARE",
    }),
  });
  if (!res.ok) {
    throw new Error(
      `Product creation failed: ${res.status} ${await res.text()}`,
    );
  }
  const data = await res.json();
  return data.id;
}

async function createPlan(token, productId, plan) {
  const body = {
    product_id: productId,
    name: plan.name,
    status: "ACTIVE",
    billing_cycles: [
      {
        frequency: { interval_unit: plan.unit, interval_count: 1 },
        tenure_type: "REGULAR",
        sequence: 1,
        total_cycles: 0,
        pricing_scheme: {
          fixed_price: { value: plan.value, currency_code: "USD" },
        },
      },
    ],
    payment_preferences: {
      auto_bill_outstanding: true,
      setup_fee: { value: "0", currency_code: "USD" },
      setup_fee_failure_action: "CONTINUE",
      payment_failure_threshold: 3,
    },
  };
  const res = await fetch(`${API_BASE}/v1/billing/plans`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(
      `Plan "${plan.name}" creation failed: ${res.status} ${await res.text()}`,
    );
  }
  const data = await res.json();
  return data.id;
}

(async () => {
  console.log(`Environment: ${ENV} (${API_BASE})`);
  const token = await getAccessToken();
  console.log("OAuth OK.");

  const productId = await createProduct(token);
  console.log(`Product: ${productId}`);

  const ids = {};
  for (const plan of PLANS) {
    const id = await createPlan(token, productId, plan);
    ids[plan.key] = id;
    console.log(`  ${plan.name.padEnd(18)} -> ${id}`);
  }

  console.log("\n--- .env entries ---");
  console.log(`# Product: ${productId}`);
  console.log(`VITE_PAYPAL_PLAN_PRO_MONTHLY_ID=${ids.PRO_MONTHLY}`);
  console.log(`VITE_PAYPAL_PLAN_PRO_YEARLY_ID=${ids.PRO_YEARLY}`);
  console.log(`VITE_PAYPAL_PLAN_ELITE_MONTHLY_ID=${ids.ELITE_MONTHLY}`);
  console.log(`VITE_PAYPAL_PLAN_ELITE_YEARLY_ID=${ids.ELITE_YEARLY}`);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
