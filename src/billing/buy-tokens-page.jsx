import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Cookies from "js-cookie";
import { loadStripe } from "@stripe/stripe-js";
import { CardElement, Elements, useElements, useStripe } from "@stripe/react-stripe-js";
import { Coins, CheckCircle2 } from "lucide-react";
import { useI18n } from "../i18n/i18n-context";
import LanguageSelector from "../i18n/language-selector";

/**
 * Embeddable token checkout (no sidebar). Opened from GET /v1/billing/checkout-url
 * with a one-time ?code= that is swapped for a 15-minute billing-only token kept in
 * memory; without a code it falls back to the normal session cookie.
 *
 * ponytail: standalone card form on the same two backend endpoints the chat modal
 * uses (create-payment-intent / confirm-payment); PayPal and crypto stay in the app.
 */
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
const API = import.meta.env.VITE_APP_BACKEND_URL;
const MIN_USD = 6;

const strings = {
  en: { balance: "Current balance", tokens: "tokens", pay: "Pay", done: "Tokens added to your account. You can close this window.", expired: "This checkout link has expired. Ask for a new one.", again: "Buy more" },
  es: { balance: "Balance actual", tokens: "tokens", pay: "Pagar", done: "Tokens agregados a tu cuenta. Ya puedes cerrar esta ventana.", expired: "Este link de compra expiró. Pide uno nuevo.", again: "Comprar más" },
};

function breakdown(usd, country) {
  const subtotal = Number(usd) || 0;
  const rate = country === "GB" ? 0.2 : 0.15;
  const tax = Number((subtotal * rate).toFixed(2));
  return {
    subtotal,
    tax,
    total: Number((subtotal + tax).toFixed(2)),
    tokens: subtotal * 100,
    taxLabel: country === "GB" ? "VAT (20%)" : "Tax (15%)",
    taxRate: rate,
    isUK: country === "GB",
  };
}

function CheckoutForm({ auth, onPaid, t, s }) {
  const stripe = useStripe();
  const elements = useElements();
  const [amount, setAmount] = useState(10);
  const [form, setForm] = useState({ first_name: "", last_name: "", address: "", postal_code: "", country: "US" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const b = useMemo(() => breakdown(amount, form.country), [amount, form.country]);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements || Number(amount) < MIN_USD) return;
    setBusy(true);
    setError("");
    try {
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: elements.getElement(CardElement),
        billing_details: {
          name: `${form.first_name} ${form.last_name}`,
          address: { line1: form.address, postal_code: form.postal_code, country: form.country },
        },
      });
      if (pmError) throw new Error(pmError.message);

      const res = await fetch(`${API}payments/create-payment-intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: auth },
        body: JSON.stringify({
          payment_method_id: paymentMethod.id,
          amount: b.total,
          tokens: b.tokens,
          vat_amount: b.isUK ? b.tax : 0,
          tax_amount: b.isUK ? 0 : b.tax,
          tax_rate: b.taxRate * 100,
          tax_type: b.isUK ? "vat" : "tax",
          billing_details: form,
        }),
      });
      const result = await res.json();
      if (result.success) return onPaid();

      if (result.requires_action && result.payment_intent_client_secret) {
        const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(result.payment_intent_client_secret);
        if (confirmError) throw new Error(confirmError.message);
        const confirm = await fetch(`${API}payments/confirm-payment`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: auth },
          body: JSON.stringify({ payment_intent_id: paymentIntent.id }),
        });
        const cr = await confirm.json();
        if (!confirm.ok || !cr.success) throw new Error(cr.message || "Payment confirmation failed");
        return onPaid();
      }
      throw new Error(result.message || result.error || "Payment failed");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const input = "w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#DC569D]";

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="text-xs text-gray-400">{t("chat.tokens.amount")}</label>
        <input type="number" min={MIN_USD} step="1" value={amount} onChange={(e) => setAmount(e.target.value)} onBlur={() => Number(amount) < MIN_USD && setAmount(MIN_USD)} className={input} />
        <p className="text-xs text-gray-500 mt-1">{t("chat.tokens.description")}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <input required placeholder={t("chat.tokens.first-name")} value={form.first_name} onChange={set("first_name")} className={input} />
        <input required placeholder={t("chat.tokens.last-name")} value={form.last_name} onChange={set("last_name")} className={input} />
        <input required placeholder={t("chat.tokens.address")} value={form.address} onChange={set("address")} className={`${input} col-span-2`} />
        <input required placeholder={t("chat.tokens.postal")} value={form.postal_code} onChange={set("postal_code")} className={input} />
        <input required placeholder={t("chat.tokens.country")} value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value.toUpperCase().slice(0, 2) })} maxLength={2} className={input} />
      </div>

      <div className="bg-black/30 border border-white/10 rounded-lg px-3 py-3">
        <CardElement options={{ style: { base: { color: "#fff", fontSize: "14px", "::placeholder": { color: "#6b7280" } } } }} />
      </div>

      <div className="text-sm text-gray-400 space-y-1">
        <div className="flex justify-between"><span>{t("chat.tokens.subtotal")}</span><span>${b.subtotal.toFixed(2)}</span></div>
        <div className="flex justify-between"><span>{b.taxLabel}</span><span>${b.tax.toFixed(2)}</span></div>
        <div className="flex justify-between text-white montserrat-medium"><span>{t("chat.tokens.total")}</span><span>${b.total.toFixed(2)}</span></div>
        <div className="flex justify-between text-[#F2D543]"><span>{t("chat.tokens.receive")}</span><span>{b.tokens} {s.tokens}</span></div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      <button type="submit" disabled={busy || !stripe} className="w-full py-2.5 rounded-lg bg-[#DC569D] text-white montserrat-medium text-sm disabled:opacity-50">
        {busy ? t("chat.tokens.processing") : `${s.pay} $${b.total.toFixed(2)}`}
      </button>
    </form>
  );
}

export default function BuyTokensPage() {
  const { locale, t } = useI18n();
  const s = strings[locale] || strings.en;
  const [search] = useSearchParams();
  const [auth, setAuth] = useState(null);
  const [expired, setExpired] = useState(false);
  const [balance, setBalance] = useState(null);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    const code = search.get("code");
    if (!code) {
      const cookie = Cookies.get("token");
      if (cookie) setAuth("Bearer " + cookie);
      else setExpired(true);
      return;
    }
    fetch(`${API}billing/exchange`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ code }),
    })
      .then((r) => r.json())
      .then((j) => (j.data?.token ? setAuth("Bearer " + j.data.token) : setExpired(true)))
      .catch(() => setExpired(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshBalance = () =>
    auth &&
    fetch(`${API}users/tokens`, { headers: { Accept: "application/json", Authorization: auth } })
      .then((r) => r.json())
      .then((j) => setBalance(j.data))
      .catch(() => {});

  useEffect(() => {
    refreshBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth]);

  const onPaid = async () => {
    await refreshBalance();
    setPaid(true);
    try {
      window.parent?.postMessage({ type: "reelmotion:tokens-purchased" }, "*");
    } catch {
      /* not embedded */
    }
  };

  return (
    <div className="min-h-screen bg-[#0C0C0D] text-white">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <img src="/logos/logo_reelmotion_new.webp" alt="Reelmotion AI" className="h-7" />
        <LanguageSelector />
      </div>

      <div className="max-w-md mx-auto px-4 py-10">
        <div className="bg-darkBox rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-lg montserrat-medium flex items-center gap-2"><Coins className="text-[#F2D543]" size={20} /> {t("chat.tokens.title")}</h1>
            {balance !== null && (
              <div className="text-right">
                <p className="text-xs text-gray-500">{s.balance}</p>
                <p className="text-[#F2D543] montserrat-medium">{Number(balance).toLocaleString()} {s.tokens}</p>
              </div>
            )}
          </div>

          {expired ? (
            <p className="text-sm text-gray-400">{s.expired}</p>
          ) : paid ? (
            <div className="text-center space-y-3 py-4">
              <CheckCircle2 className="mx-auto text-green-400" size={40} />
              <p className="text-gray-300 text-sm">{s.done}</p>
              <button onClick={() => setPaid(false)} className="text-sm text-[#F2D543] hover:underline">{s.again}</button>
            </div>
          ) : auth ? (
            <Elements stripe={stripePromise}>
              <CheckoutForm auth={auth} onPaid={onPaid} t={t} s={s} />
            </Elements>
          ) : (
            <p className="text-sm text-gray-500">…</p>
          )}
        </div>
      </div>
    </div>
  );
}
