import { useState, useEffect, useRef } from "react";
import { useI18n } from "../i18n/i18n-context";
import {
  Check,
  X,
  Zap,
  Crown,
  ArrowLeft,
  ShieldCheck,
  ChevronDown,
  Search,
} from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import {
  createSubscription,
  updateSubscription,
  getBillingInfo,
  confirmSubscription,
  createPaypalSubscription,
  capturePaypalSubscription,
  updatePaypalSubscription,
  switchSubscriptionProvider,
  forceResetPaypalSubscription,
} from "./functions";
import { useNavigate, useOutletContext, useLocation } from "react-router-dom";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const PAYPAL_IS_SANDBOX =
  import.meta.env.VITE_PAYPAL_ENVIRONMENT === "sandbox";

const PAYPAL_CLIENT_ID = PAYPAL_IS_SANDBOX
  ? import.meta.env.VITE_PAYPAL_CLIENT_ID_TEST
  : import.meta.env.VITE_PAYPAL_CLIENT_ID;

const PAYPAL_PLAN_IDS = PAYPAL_IS_SANDBOX
  ? {
      pro: {
        monthly: import.meta.env.VITE_PAYPAL_PLAN_PRO_MONTHLY_ID_TEST,
        yearly: import.meta.env.VITE_PAYPAL_PLAN_PRO_YEARLY_ID_TEST,
      },
      elite: {
        monthly: import.meta.env.VITE_PAYPAL_PLAN_ELITE_MONTHLY_ID_TEST,
        yearly: import.meta.env.VITE_PAYPAL_PLAN_ELITE_YEARLY_ID_TEST,
      },
    }
  : {
      pro: {
        monthly: import.meta.env.VITE_PAYPAL_PLAN_PRO_MONTHLY_ID,
        yearly: import.meta.env.VITE_PAYPAL_PLAN_PRO_YEARLY_ID,
      },
      elite: {
        monthly: import.meta.env.VITE_PAYPAL_PLAN_ELITE_MONTHLY_ID,
        yearly: import.meta.env.VITE_PAYPAL_PLAN_ELITE_YEARLY_ID,
      },
    };

function resolvePaypalPlanId(planName, billingCycle) {
  const p = planName?.toLowerCase();
  const c = billingCycle?.toLowerCase();
  return PAYPAL_PLAN_IDS?.[p]?.[c] || null;
}

async function ensurePaypalSdkLoaded(clientId) {
  if (typeof window === "undefined") return null;
  if (window.paypal && window.paypal.Buttons) return window.paypal;

  // Remove any prior checkout-only SDK (intent=capture) to avoid conflicts
  const existing = document.querySelector('script[data-paypal-sdk="subscription"]');
  if (!existing) {
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&vault=true&intent=subscription&components=buttons`;
    script.async = true;
    script.dataset.paypalSdk = "subscription";
    document.head.appendChild(script);
    await new Promise((resolve, reject) => {
      script.onload = resolve;
      script.onerror = () =>
        reject(new Error("Failed to load PayPal SDK"));
    });
  } else {
    // Wait until the already-injected script finishes loading
    await new Promise((resolve) => {
      if (window.paypal) return resolve();
      existing.addEventListener("load", resolve, { once: true });
    });
  }
  return window.paypal || null;
}

const COUNTRIES = [
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "AF", name: "Afghanistan", flag: "🇦🇫" },
  { code: "AL", name: "Albania", flag: "🇦🇱" },
  { code: "DZ", name: "Algeria", flag: "🇩🇿" },
  { code: "AD", name: "Andorra", flag: "🇦🇩" },
  { code: "AO", name: "Angola", flag: "🇦🇴" },
  { code: "AG", name: "Antigua & Barbuda", flag: "🇦🇬" },
  { code: "AR", name: "Argentina", flag: "🇦🇷" },
  { code: "AM", name: "Armenia", flag: "🇦🇲" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "AT", name: "Austria", flag: "🇦🇹" },
  { code: "AZ", name: "Azerbaijan", flag: "🇦🇿" },
  { code: "BS", name: "Bahamas", flag: "🇧🇸" },
  { code: "BH", name: "Bahrain", flag: "🇧🇭" },
  { code: "BD", name: "Bangladesh", flag: "🇧🇩" },
  { code: "BB", name: "Barbados", flag: "🇧🇧" },
  { code: "BY", name: "Belarus", flag: "🇧🇾" },
  { code: "BE", name: "Belgium", flag: "🇧🇪" },
  { code: "BZ", name: "Belize", flag: "🇧🇿" },
  { code: "BJ", name: "Benin", flag: "🇧🇯" },
  { code: "BT", name: "Bhutan", flag: "🇧🇹" },
  { code: "BO", name: "Bolivia", flag: "🇧🇴" },
  { code: "BA", name: "Bosnia & Herzegovina", flag: "🇧🇦" },
  { code: "BW", name: "Botswana", flag: "🇧🇼" },
  { code: "BR", name: "Brazil", flag: "🇧🇷" },
  { code: "BN", name: "Brunei", flag: "🇧🇳" },
  { code: "BG", name: "Bulgaria", flag: "🇧🇬" },
  { code: "BF", name: "Burkina Faso", flag: "🇧🇫" },
  { code: "BI", name: "Burundi", flag: "🇧🇮" },
  { code: "KH", name: "Cambodia", flag: "🇰🇭" },
  { code: "CM", name: "Cameroon", flag: "🇨🇲" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "CV", name: "Cape Verde", flag: "🇨🇻" },
  { code: "CF", name: "Central African Rep.", flag: "🇨🇫" },
  { code: "TD", name: "Chad", flag: "🇹🇩" },
  { code: "CL", name: "Chile", flag: "🇨🇱" },
  { code: "CN", name: "China", flag: "🇨🇳" },
  { code: "CO", name: "Colombia", flag: "🇨🇴" },
  { code: "KM", name: "Comoros", flag: "🇰🇲" },
  { code: "CG", name: "Congo - Brazzaville", flag: "🇨🇬" },
  { code: "CD", name: "Congo - Kinshasa", flag: "🇨🇩" },
  { code: "CR", name: "Costa Rica", flag: "🇨🇷" },
  { code: "HR", name: "Croatia", flag: "🇭🇷" },
  { code: "CU", name: "Cuba", flag: "🇨🇺" },
  { code: "CY", name: "Cyprus", flag: "🇨🇾" },
  { code: "CZ", name: "Czech Republic", flag: "🇨🇿" },
  { code: "DK", name: "Denmark", flag: "🇩🇰" },
  { code: "DJ", name: "Djibouti", flag: "🇩🇯" },
  { code: "DM", name: "Dominica", flag: "🇩🇲" },
  { code: "DO", name: "Dominican Republic", flag: "🇩🇴" },
  { code: "EC", name: "Ecuador", flag: "🇪🇨" },
  { code: "EG", name: "Egypt", flag: "🇪🇬" },
  { code: "SV", name: "El Salvador", flag: "🇸🇻" },
  { code: "GQ", name: "Equatorial Guinea", flag: "🇬🇶" },
  { code: "ER", name: "Eritrea", flag: "🇪🇷" },
  { code: "EE", name: "Estonia", flag: "🇪🇪" },
  { code: "ET", name: "Ethiopia", flag: "🇪🇹" },
  { code: "FJ", name: "Fiji", flag: "🇫🇯" },
  { code: "FI", name: "Finland", flag: "🇫🇮" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "GA", name: "Gabon", flag: "🇬🇦" },
  { code: "GM", name: "Gambia", flag: "🇬🇲" },
  { code: "GE", name: "Georgia", flag: "🇬🇪" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "GH", name: "Ghana", flag: "🇬🇭" },
  { code: "GR", name: "Greece", flag: "🇬🇷" },
  { code: "GD", name: "Grenada", flag: "🇬🇩" },
  { code: "GT", name: "Guatemala", flag: "🇬🇹" },
  { code: "GN", name: "Guinea", flag: "🇬🇳" },
  { code: "GW", name: "Guinea-Bissau", flag: "🇬🇼" },
  { code: "GY", name: "Guyana", flag: "🇬🇾" },
  { code: "HT", name: "Haiti", flag: "🇭🇹" },
  { code: "HN", name: "Honduras", flag: "🇭🇳" },
  { code: "HU", name: "Hungary", flag: "🇭🇺" },
  { code: "IS", name: "Iceland", flag: "🇮🇸" },
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "ID", name: "Indonesia", flag: "🇮🇩" },
  { code: "IR", name: "Iran", flag: "🇮🇷" },
  { code: "IQ", name: "Iraq", flag: "🇮🇶" },
  { code: "IE", name: "Ireland", flag: "🇮🇪" },
  { code: "IL", name: "Israel", flag: "🇮🇱" },
  { code: "IT", name: "Italy", flag: "🇮🇹" },
  { code: "CI", name: "Ivory Coast", flag: "🇨🇮" },
  { code: "JM", name: "Jamaica", flag: "🇯🇲" },
  { code: "JP", name: "Japan", flag: "🇯🇵" },
  { code: "JO", name: "Jordan", flag: "🇯🇴" },
  { code: "KZ", name: "Kazakhstan", flag: "🇰🇿" },
  { code: "KE", name: "Kenya", flag: "🇰🇪" },
  { code: "KI", name: "Kiribati", flag: "🇰🇮" },
  { code: "KP", name: "North Korea", flag: "🇰🇵" },
  { code: "KR", name: "South Korea", flag: "🇰🇷" },
  { code: "KW", name: "Kuwait", flag: "🇰🇼" },
  { code: "KG", name: "Kyrgyzstan", flag: "🇰🇬" },
  { code: "LA", name: "Laos", flag: "🇱🇦" },
  { code: "LV", name: "Latvia", flag: "🇱🇻" },
  { code: "LB", name: "Lebanon", flag: "🇱🇧" },
  { code: "LS", name: "Lesotho", flag: "🇱🇸" },
  { code: "LR", name: "Liberia", flag: "🇱🇷" },
  { code: "LY", name: "Libya", flag: "🇱🇾" },
  { code: "LI", name: "Liechtenstein", flag: "🇱🇮" },
  { code: "LT", name: "Lithuania", flag: "🇱🇹" },
  { code: "LU", name: "Luxembourg", flag: "🇱🇺" },
  { code: "MK", name: "Macedonia", flag: "🇲🇰" },
  { code: "MG", name: "Madagascar", flag: "🇲🇬" },
  { code: "MW", name: "Malawi", flag: "🇲🇼" },
  { code: "MY", name: "Malaysia", flag: "🇲🇾" },
  { code: "MV", name: "Maldives", flag: "🇲🇻" },
  { code: "ML", name: "Mali", flag: "🇲🇱" },
  { code: "MT", name: "Malta", flag: "🇲🇹" },
  { code: "MH", name: "Marshall Islands", flag: "🇲🇭" },
  { code: "MR", name: "Mauritania", flag: "🇲🇷" },
  { code: "MU", name: "Mauritius", flag: "🇲🇺" },
  { code: "MX", name: "Mexico", flag: "🇲🇽" },
  { code: "FM", name: "Micronesia", flag: "🇫🇲" },
  { code: "MD", name: "Moldova", flag: "🇲🇩" },
  { code: "MC", name: "Monaco", flag: "🇲🇨" },
  { code: "MN", name: "Mongolia", flag: "🇲🇳" },
  { code: "ME", name: "Montenegro", flag: "🇲🇪" },
  { code: "MA", name: "Morocco", flag: "🇲🇦" },
  { code: "MZ", name: "Mozambique", flag: "🇲🇿" },
  { code: "MM", name: "Myanmar", flag: "🇲🇲" },
  { code: "NA", name: "Namibia", flag: "🇳🇦" },
  { code: "NR", name: "Nauru", flag: "🇳🇷" },
  { code: "NP", name: "Nepal", flag: "🇳🇵" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱" },
  { code: "NZ", name: "New Zealand", flag: "🇳🇿" },
  { code: "NI", name: "Nicaragua", flag: "🇳🇮" },
  { code: "NE", name: "Niger", flag: "🇳🇪" },
  { code: "NG", name: "Nigeria", flag: "🇳🇬" },
  { code: "NO", name: "Norway", flag: "🇳🇴" },
  { code: "OM", name: "Oman", flag: "🇴🇲" },
  { code: "PK", name: "Pakistan", flag: "🇵🇰" },
  { code: "PW", name: "Palau", flag: "🇵🇼" },
  { code: "PA", name: "Panama", flag: "🇵🇦" },
  { code: "PG", name: "Papua New Guinea", flag: "🇵🇬" },
  { code: "PY", name: "Paraguay", flag: "🇵🇾" },
  { code: "PE", name: "Peru", flag: "🇵🇪" },
  { code: "PH", name: "Philippines", flag: "🇵🇭" },
  { code: "PL", name: "Poland", flag: "🇵🇱" },
  { code: "PT", name: "Portugal", flag: "🇵🇹" },
  { code: "QA", name: "Qatar", flag: "🇶🇦" },
  { code: "RO", name: "Romania", flag: "🇷🇴" },
  { code: "RU", name: "Russia", flag: "🇷🇺" },
  { code: "RW", name: "Rwanda", flag: "🇷🇼" },
  { code: "KN", name: "St. Kitts & Nevis", flag: "🇰🇳" },
  { code: "LC", name: "St. Lucia", flag: "🇱🇨" },
  { code: "VC", name: "St. Vincent & Grenadines", flag: "🇻🇨" },
  { code: "WS", name: "Samoa", flag: "🇼🇸" },
  { code: "SM", name: "San Marino", flag: "🇸🇲" },
  { code: "ST", name: "Sao Tome & Principe", flag: "🇸🇹" },
  { code: "SA", name: "Saudi Arabia", flag: "🇸🇦" },
  { code: "SN", name: "Senegal", flag: "🇸🇳" },
  { code: "RS", name: "Serbia", flag: "🇷🇸" },
  { code: "SC", name: "Seychelles", flag: "🇸🇨" },
  { code: "SL", name: "Sierra Leone", flag: "🇸🇱" },
  { code: "SG", name: "Singapore", flag: "🇸🇬" },
  { code: "SK", name: "Slovakia", flag: "🇸🇰" },
  { code: "SI", name: "Slovenia", flag: "🇸🇮" },
  { code: "SB", name: "Solomon Islands", flag: "🇸🇧" },
  { code: "SO", name: "Somalia", flag: "🇸🇴" },
  { code: "ZA", name: "South Africa", flag: "🇿🇦" },
  { code: "SS", name: "South Sudan", flag: "🇸🇸" },
  { code: "LK", name: "Sri Lanka", flag: "🇱🇰" },
  { code: "SD", name: "Sudan", flag: "🇸🇩" },
  { code: "SR", name: "Suriname", flag: "🇸🇷" },
  { code: "SZ", name: "Swaziland", flag: "🇸🇿" },
  { code: "SE", name: "Sweden", flag: "🇸🇪" },
  { code: "CH", name: "Switzerland", flag: "🇨🇭" },
  { code: "SY", name: "Syria", flag: "🇸🇾" },
  { code: "TW", name: "Taiwan", flag: "🇹🇼" },
  { code: "TJ", name: "Tajikistan", flag: "🇹🇯" },
  { code: "TZ", name: "Tanzania", flag: "🇹🇿" },
  { code: "TH", name: "Thailand", flag: "🇹🇭" },
  { code: "TL", name: "Timor-Leste", flag: "🇹🇱" },
  { code: "TG", name: "Togo", flag: "🇹🇬" },
  { code: "TO", name: "Tonga", flag: "🇹🇴" },
  { code: "TT", name: "Trinidad & Tobago", flag: "🇹🇹" },
  { code: "TN", name: "Tunisia", flag: "🇹🇳" },
  { code: "TR", name: "Turkey", flag: "🇹🇷" },
  { code: "TM", name: "Turkmenistan", flag: "🇹🇲" },
  { code: "TV", name: "Tuvalu", flag: "🇹🇻" },
  { code: "UG", name: "Uganda", flag: "🇺🇬" },
  { code: "UA", name: "Ukraine", flag: "🇺🇦" },
  { code: "AE", name: "United Arab Emirates", flag: "🇦🇪" },
  { code: "UY", name: "Uruguay", flag: "🇺🇾" },
  { code: "UZ", name: "Uzbekistan", flag: "🇺🇿" },
  { code: "VU", name: "Vanuatu", flag: "🇻🇺" },
  { code: "VA", name: "Vatican City", flag: "🇻🇦" },
  { code: "VE", name: "Venezuela", flag: "🇻🇪" },
  { code: "VN", name: "Vietnam", flag: "🇻🇳" },
  { code: "YE", name: "Yemen", flag: "🇾🇪" },
  { code: "ZM", name: "Zambia", flag: "🇿🇲" },
  { code: "ZW", name: "Zimbabwe", flag: "🇿🇼" },
];

function SearchableCountrySelect({ value, onChange, countries }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCountries = countries.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  const selectedCountry = countries.find((c) => c.code === value);

  return (
    <div className="relative" ref={wrapperRef}>
      <div
        className="w-full p-3 border border-gray-700 rounded-lg bg-[#212121] text-white flex items-center justify-between cursor-pointer focus:outline-none focus:border-[#DC569D] transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="flex items-center gap-2">
          {selectedCountry ? (
            <>
              <span className="text-xl">{selectedCountry.flag}</span>
              <span>{selectedCountry.name}</span>
            </>
          ) : (
            <span className="text-gray-400">Select a country</span>
          )}
        </span>
        <ChevronDown
          size={16}
          className={`text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-[#212121] border border-gray-700 rounded-lg shadow-xl max-h-60 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-gray-700 sticky top-0 bg-[#212121]">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search country..."
                className="w-full pl-9 pr-3 py-2 bg-[#171717] border border-gray-700 rounded-md text-sm text-white focus:outline-none focus:border-[#DC569D]"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <div className="overflow-y-auto flex-1">
            {filteredCountries.map((c) => (
              <div
                key={c.code}
                className={`px-4 py-2 flex items-center gap-3 cursor-pointer hover:bg-white/5 transition-colors ${value === c.code ? "bg-white/10" : ""}`}
                onClick={() => {
                  onChange(c.code);
                  setIsOpen(false);
                  setSearch("");
                }}
              >
                <span className="text-xl">{c.flag}</span>
                <span>{c.name}</span>
                {value === c.code && (
                  <Check size={16} className="ml-auto text-[#DC569D]" />
                )}
              </div>
            ))}
            {filteredCountries.length === 0 && (
              <div className="p-4 text-center text-gray-500 text-sm">
                No countries found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SuccessMessage({ onContinue }) {
  const { t } = useI18n();
  return (
    <div className="max-w-2xl mx-auto pt-16 text-center space-y-8 animate-in fade-in duration-500">
      <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
        <ShieldCheck size={48} className="text-green-500" />
      </div>
      <div>
        <h2 className="text-3xl font-bold mb-4">{t("pricing.pro.name")} - {t("subscription.active")}</h2>
        <p className="text-gray-400 text-lg">
          {t("subscription.title")}
        </p>
      </div>
      <button
        onClick={onContinue}
        className="px-8 py-3 bg-[#DC569D] text-white font-bold rounded-lg hover:bg-[#c44a87] transition-all"
      >
        {t("subscription.manage")}
      </button>
    </div>
  );
}

function PayPalSubscriptionButton({
  plan,
  billingCycle,
  isUpdate,
  currentProvider,
  currentSubscriptionId,
  billingDetails,
  isBillingComplete,
  onSuccess,
  onError,
}) {
  const containerRef = useRef(null);
  const buttonsInstanceRef = useRef(null);
  const [sdkStatus, setSdkStatus] = useState("idle"); // idle | loading | ready | error
  const [isProcessing, setIsProcessing] = useState(false);
  const [approvalUrl, setApprovalUrl] = useState(null);
  const [reviseLoading, setReviseLoading] = useState(false);
  const [orphanedSubscription, setOrphanedSubscription] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const paypalPlanId = resolvePaypalPlanId(plan?.name, billingCycle);
  const needsSwitch =
    isUpdate && currentProvider && currentProvider !== "paypal";
  const isPaypalUpdate = isUpdate && currentProvider === "paypal";

  // PayPal → PayPal updates use the "revise" flow (native button + redirect),
  // NOT the PayPal Buttons SDK. Mounting the SDK for this case would force us
  // to throw inside createSubscription, which the SDK logs as create_order_error.
  function isOrphanedSubscriptionError(err) {
    // Check top-level error message
    const msg = String(err?.message || err || "").toUpperCase();
    if (
      msg.includes("RESOURCE_NOT_FOUND") ||
      msg.includes("INVALID_RESOURCE_ID") ||
      msg.includes("THE SPECIFIED RESOURCE DOES NOT EXIST")
    ) {
      return true;
    }
    // Check nested PayPal error payload (backend format: { error, paypal: { name, details } })
    const paypalErr = err?.response?.paypal;
    if (paypalErr) {
      if (paypalErr.name === "RESOURCE_NOT_FOUND") return true;
      if (Array.isArray(paypalErr.details)) {
        return paypalErr.details.some(
          (d) => d?.issue === "INVALID_RESOURCE_ID",
        );
      }
    }
    return false;
  }

  async function handleReviseClick() {
    setReviseLoading(true);
    setOrphanedSubscription(false);
    try {
      const res = await updatePaypalSubscription({
        current_paypal_subscription_id: currentSubscriptionId,
        new_plan_id: paypalPlanId,
        proration_behavior: "prorate",
      });
      if (res?.requires_approval && res?.approval_url) {
        setApprovalUrl(res.approval_url);
        window.open(res.approval_url, "_blank", "noopener,noreferrer");
      } else {
        onSuccess?.();
      }
    } catch (err) {
      if (isOrphanedSubscriptionError(err)) {
        setOrphanedSubscription(true);
      } else {
        onError?.(err?.message || "Failed to update PayPal subscription.");
      }
    } finally {
      setReviseLoading(false);
    }
  }

  async function handleResetOrphaned() {
    setResetLoading(true);
    try {
      await forceResetPaypalSubscription();
      setOrphanedSubscription(false);
      // Reload so the page re-fetches the now-cleared subscription state
      // and treats the user as a new subscriber
      window.location.href = "/app/pro";
    } catch (err) {
      onError?.(
        err?.message ||
          "Could not reset subscription. Please contact support and provide subscription ID " +
            currentSubscriptionId +
            ".",
      );
    } finally {
      setResetLoading(false);
    }
  }

  useEffect(() => {
    // Skip Buttons SDK mount for paypal→paypal update flow
    if (isPaypalUpdate) {
      setSdkStatus("idle");
      return;
    }

    let cancelled = false;

    async function mount() {
      if (!PAYPAL_CLIENT_ID) {
        setSdkStatus("error");
        onError?.("PayPal is not configured.");
        return;
      }
      if (!paypalPlanId) {
        setSdkStatus("error");
        onError?.(
          `PayPal plan ID missing for ${plan?.name}/${billingCycle}. Configure VITE_PAYPAL_PLAN_* env vars.`,
        );
        return;
      }
      if (!isBillingComplete) {
        // Wait for billing address to be filled before mounting buttons
        setSdkStatus("idle");
        return;
      }

      try {
        setSdkStatus("loading");
        const paypal = await ensurePaypalSdkLoaded(PAYPAL_CLIENT_ID);
        if (cancelled || !paypal) return;

        if (!containerRef.current) return;
        containerRef.current.innerHTML = "";

        const buttons = paypal.Buttons({
          style: {
            shape: "rect",
            color: "gold",
            layout: "vertical",
            label: "subscribe",
          },
          createSubscription: async () => {
            // If switching from Stripe to PayPal, cancel the old sub first
            if (needsSwitch) {
              await switchSubscriptionProvider({
                target_provider: "paypal",
                new_plan_id: paypalPlanId,
                current_subscription_id: currentSubscriptionId,
              });
            }

            const res = await createPaypalSubscription({
              plan: plan.name,
              billing_cycle: billingCycle,
              paypal_plan_id: paypalPlanId,
              billing_details: billingDetails,
              is_update: Boolean(isUpdate),
              is_switch: needsSwitch,
            });

            if (!res?.paypal_subscription_id) {
              const msg =
                res?.message ||
                "Backend did not return a PayPal subscription ID.";
              onError?.(msg);
              throw new Error(msg);
            }
            return res.paypal_subscription_id;
          },
          onApprove: async (data) => {
            setIsProcessing(true);
            try {
              const res = await capturePaypalSubscription({
                subscription_id: data.subscriptionID,
              });
              if (res?.success || res?.status === "active") {
                onSuccess?.();
              } else {
                onError?.(
                  res?.message ||
                    "PayPal subscription was approved but not yet active. You'll be notified once it activates.",
                );
              }
            } catch (err) {
              onError?.(err?.message || "Failed to finalize PayPal subscription.");
            } finally {
              setIsProcessing(false);
            }
          },
          onError: (err) => {
            console.error("PayPal Buttons error", err);
            onError?.("PayPal encountered an error. Please try again.");
          },
          onCancel: () => {
            onError?.("PayPal checkout was cancelled.");
          },
        });

        buttonsInstanceRef.current = buttons;
        await buttons.render(containerRef.current);
        if (!cancelled) setSdkStatus("ready");
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setSdkStatus("error");
          onError?.(err?.message || "Failed to load PayPal.");
        }
      }
    }

    mount();

    return () => {
      cancelled = true;
      try {
        buttonsInstanceRef.current?.close?.();
      } catch {
        /* noop */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paypalPlanId, isBillingComplete, needsSwitch, isPaypalUpdate]);

  if (isPaypalUpdate) {
    if (orphanedSubscription) {
      return (
        <div className="space-y-3">
          <div className="bg-amber-500/10 border border-amber-500/40 rounded-lg p-4 space-y-2">
            <div className="text-amber-400 font-semibold text-sm">
              Your PayPal subscription is no longer valid
            </div>
            <div className="text-gray-300 text-xs leading-relaxed">
              Subscription{" "}
              <code className="bg-black/30 px-1 py-0.5 rounded">
                {currentSubscriptionId}
              </code>{" "}
              was not found on PayPal. This usually happens when a test
              subscription carries over to a different environment. Reset it to
              subscribe fresh — no charges apply until you approve the new
              subscription.
            </div>
          </div>
          <button
            type="button"
            onClick={handleResetOrphaned}
            disabled={resetLoading}
            className="w-full py-3 px-4 bg-[#DC569D] text-white font-bold rounded-lg hover:bg-[#c9458b] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resetLoading ? "Resetting..." : "Reset and resubscribe"}
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <button
          type="button"
          onClick={handleReviseClick}
          disabled={reviseLoading || !paypalPlanId}
          className="w-full py-3 px-4 bg-[#0070ba] text-white font-bold rounded-lg hover:bg-[#005ea6] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {reviseLoading ? "Preparing plan change..." : "Change plan on PayPal"}
        </button>
        {approvalUrl && (
          <a
            href={approvalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center py-3 px-4 bg-[#0070ba]/20 border border-[#0070ba] text-white rounded-lg hover:bg-[#0070ba]/30 transition-all"
          >
            Re-open approval on PayPal
          </a>
        )}
        <div className="text-center text-xs text-gray-500 leading-relaxed">
          PayPal may ask you to re-approve the new plan amount. After approving,
          come back to this page.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {!isBillingComplete && (
        <div className="text-xs text-gray-400 bg-[#212121] border border-gray-700 rounded-lg p-3">
          Complete your billing address above to enable the PayPal button.
        </div>
      )}
      {sdkStatus === "loading" && (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Loading PayPal...
        </div>
      )}
      <div
        ref={containerRef}
        id="paypal-subscription-container"
        className="min-h-[50px]"
      />
      {isProcessing && (
        <div className="text-sm text-gray-400 flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Finalizing subscription...
        </div>
      )}
      <div className="text-center text-xs text-gray-500 leading-relaxed">
        By subscribing with PayPal you authorize ReelMotion to charge your
        PayPal account on a recurring basis until you cancel.
      </div>
    </div>
  );
}

function CheckoutForm({
  plan,
  billingCycle,
  price,
  onBack,
  onSuccess,
  isUpdate,
  prorationBehavior = "prorate",
  currentPeriodEnd,
  currentPlanPrice,
  currentProvider,
  currentSubscriptionId,
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardNumberComplete, setCardNumberComplete] = useState(false);
  const [cardExpiryComplete, setCardExpiryComplete] = useState(false);
  const [cardCvcComplete, setCardCvcComplete] = useState(false);
  const [cardErrors, setCardErrors] = useState({});

  // Payment provider selector: "stripe" | "paypal"
  // Defaults to whatever the user is currently subscribed with (if any), otherwise stripe.
  const [paymentProvider, setPaymentProvider] = useState(
    currentProvider === "paypal" ? "paypal" : "stripe",
  );

  // Billing Details State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("US");

  // VAT and Total Calculation
  const [vatAmount, setVatAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(parseFloat(price));

  useEffect(() => {
    getBillingInfo()
      .then((response) => {
        const data = response?.billing_info;
        if (data) {
          if (data.first_name) setFirstName(data.first_name);
          if (data.last_name) setLastName(data.last_name);
          if (data.address) setAddress(data.address);
          if (data.postal_code) setPostalCode(data.postal_code);
          if (data.country_code) setCountry(data.country_code);
        }
      })
      .catch(() => {
        // Silent fail if no info exists
      });
  }, []);

  useEffect(() => {
    const basePrice = parseFloat(price);
    if (country === "GB") {
      const vat = basePrice * 0.2;
      setVatAmount(vat);
      setTotalAmount(basePrice + vat);
    } else {
      const tax = basePrice * 0.15;
      setVatAmount(tax);
      setTotalAmount(basePrice + tax);
    }
  }, [country, price]);

  const calculateProrationEstimate = () => {
    if (!currentPlanPrice) return null;

    const oldPrice = parseFloat(currentPlanPrice);
    const newPrice = parseFloat(price);

    // Calculate straight difference as requested
    let difference = newPrice - oldPrice;

    if (difference <= 0) difference = 0;

    return difference.toFixed(2);
  };

  const estimatedProration =
    isUpdate && prorationBehavior === "prorate"
      ? calculateProrationEstimate()
      : null;

  // Apply VAT to proration estimate when applicable (e.g. UK)
  const taxRate = country === "GB" ? 0.2 : 0.15;
  const estimatedProrationWithVat = estimatedProration
    ? (
        parseFloat(estimatedProration) +
        parseFloat(estimatedProration) * taxRate
      ).toFixed(2)
    : null;

  const handleCardNumberChange = (event) => {
    setCardNumberComplete(event.complete);
    setCardErrors((prev) => ({
      ...prev,
      cardNumber: event.error?.message || null,
    }));
  };

  const handleCardExpiryChange = (event) => {
    setCardExpiryComplete(event.complete);
    setCardErrors((prev) => ({
      ...prev,
      cardExpiry: event.error?.message || null,
    }));
  };

  const handleCardCvcChange = (event) => {
    setCardCvcComplete(event.complete);
    setCardErrors((prev) => ({
      ...prev,
      cardCvc: event.error?.message || null,
    }));
  };

  const allFieldsComplete =
    cardNumberComplete &&
    cardExpiryComplete &&
    cardCvcComplete &&
    firstName &&
    lastName &&
    address &&
    postalCode;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements || !allFieldsComplete) return;

    setIsProcessing(true);
    setCardErrors({}); // Clear previous errors

    try {
      // If the user is switching from PayPal to Stripe, cancel PayPal first
      if (isUpdate && currentProvider === "paypal") {
        await switchSubscriptionProvider({
          target_provider: "stripe",
          current_subscription_id: currentSubscriptionId,
        });
      }

      // 1. Create Payment Method with Stripe
      const cardElement = elements.getElement(CardNumberElement);
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
        billing_details: {
          name: `${firstName} ${lastName}`,
          address: {
            line1: address,
            postal_code: postalCode,
            country: country,
          },
        },
      });

      if (error) {
        setCardErrors((prev) => ({ ...prev, apiError: error.message }));
        setIsProcessing(false);
        return;
      }

      // 2. Get correct Price ID from .env
      let priceId = "";
      const pName = plan.name.toLowerCase();
      const bCycle = billingCycle.toLowerCase();

      // Using TEST mode - all prices are test prices
      if (pName === "pro" && bCycle === "monthly") {
        priceId = import.meta.env.VITE_STRIPE_PRO_MONTHLY_PRICE_ID;
      } else if (pName === "pro" && bCycle === "yearly") {
        priceId = import.meta.env.VITE_STRIPE_PRO_YEARLY_PRICE_ID;
      } else if (pName === "elite" && bCycle === "monthly") {
        priceId = import.meta.env.VITE_STRIPE_ELITE_MONTHLY_PRICE_ID;
      } else if (pName === "elite" && bCycle === "yearly") {
        priceId = import.meta.env.VITE_STRIPE_ELITE_YEARLY_PRICE_ID;
      }

      if (!priceId) {
        throw new Error(
          "Configuration Error: Price ID not found for this plan.",
        );
      }

      const isUK = country === "GB";
      const subscriptionData = {
        plan: plan.name,
        billing_cycle: billingCycle,
        price: totalAmount.toFixed(2), // Send the total with taxes included
        payment_method: paymentMethod.id,
        price_id: priceId,
        billing_details: {
          first_name: firstName,
          last_name: lastName,
          address: address,
          postal_code: postalCode,
          country: country,
          vat_amount: isUK ? vatAmount.toFixed(2) : "0.00",
          tax_amount: !isUK ? vatAmount.toFixed(2) : "0.00",
          tax_rate: isUK ? 20 : 15,
          tax_type: isUK ? "vat" : "tax",
        },
      };

      const isSwitchFromPaypal =
        isUpdate && currentProvider === "paypal";

      let response;
      if (isUpdate && !isSwitchFromPaypal) {
        response = await updateSubscription({
          ...subscriptionData,
          proration_behavior: prorationBehavior,
          prorate_amount: estimatedProration,
        });
      } else {
        response = await createSubscription({
          ...subscriptionData,
          is_switch: isSwitchFromPaypal,
        });
      }

      // Handle 3D Secure authentication
      if (
        response &&
        response.requires_action &&
        response.payment_intent_client_secret
      ) {
        const { error: confirmError, paymentIntent } =
          await stripe.confirmCardPayment(
            response.payment_intent_client_secret,
          );

        if (confirmError) {
          throw new Error(
            confirmError.message || "3D Secure authentication failed.",
          );
        }

        if (paymentIntent && paymentIntent.status === "succeeded") {
          // Confirm with backend after 3DS success
          const confirmResponse = await confirmSubscription({
            subscription_id: response.subscription_id,
            payment_intent_id: paymentIntent.id,
          });

          if (
            confirmResponse &&
            (confirmResponse.message ===
              "Suscription created/updated successfully" ||
              confirmResponse.message === "Suscription updated successfully" ||
              confirmResponse.message === "Subscription updated successfully" ||
              confirmResponse.message ===
                "Subscription confirmed successfully" ||
              confirmResponse.message ===
                "Subscription confirmed and activated successfully" ||
              confirmResponse.status === "active")
          ) {
            onSuccess();
            return;
          } else {
            throw new Error(
              confirmResponse.message ||
                "Failed to confirm subscription after 3D Secure.",
            );
          }
        } else {
          throw new Error("Payment was not completed. Please try again.");
        }
      }

      if (
        response &&
        (response.message === "Suscription created/updated successfully" ||
          response.message === "Suscription updated successfully" ||
          response.message === "Subscription updated successfully" ||
          response.status === "active")
      ) {
        onSuccess();
      } else {
        throw new Error(
          response.message || "Failed to create subscription on server.",
        );
      }
    } catch (err) {
      console.error(err);
      setCardErrors((prev) => ({
        ...prev,
        apiError: err.message || "An error occurred during payment processing.",
      }));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTestPayment = async () => {
    setIsProcessing(true);
    try {
      const response = await createSubscription({
        plan: plan.name,
        billing_cycle: billingCycle,
        price: price,
      });

      if (
        response &&
        response.message === "Suscription created/updated successfully"
      ) {
        onSuccess();
      } else {
        alert("Subscription created!"); // Fallback
        onBack();
      }
    } catch (error) {
      alert("Error creating subscription: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const elementStyle = {
    style: {
      base: {
        fontSize: "16px",
        color: "#ffffff",
        "::placeholder": {
          color: "#9ca3af",
        },
      },
      invalid: {
        color: "#ef4444",
      },
    },
  };

  return (
    <div className="max-w-4xl mx-auto pt-4 md:pt-8 animate-in fade-in duration-500">
      <button
        onClick={onBack}
        className="flex items-center text-gray-400 hover:text-white mb-8 transition-colors group"
      >
        <ArrowLeft
          size={20}
          className="mr-2 group-hover:-translate-x-1 transition-transform"
        />
        Back to plans
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12">
        {/* Order Summary */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Order Summary</h2>
          <div className="bg-[#171717] rounded-xl p-6 border border-gray-800 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-gray-700 pb-4">
              <div>
                <h3 className="font-semibold text-lg capitalize flex items-center gap-2">
                  {plan.name === "elite" && (
                    <Crown size={18} className="text-yellow-500" />
                  )}
                  {plan.name} Plan
                </h3>
                <p className="text-gray-400 text-sm capitalize">
                  {billingCycle} subscription
                </p>
              </div>
              <span className="text-xl font-bold">${price}</span>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Subtotal</span>
                <span>${price}</span>
              </div>
              {vatAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">
                    {country === "GB" ? "VAT (20%)" : "Tax (15%)"}
                  </span>
                  <span>${vatAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-4 border-t border-gray-700">
                <div className="flex flex-col">
                  <span className="font-bold text-lg">
                    {isUpdate && prorationBehavior === "prorate"
                      ? "Estimated Due Now"
                      : "Total due today"}
                  </span>
                  {isUpdate && prorationBehavior === "prorate" && (
                    <span className="text-xs text-gray-400 mt-0.5">
                      *Exact amount calculated by Stripe
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-[#DC569D]">
                    {isUpdate && prorationBehavior === "prorate" ? (
                      estimatedProrationWithVat ? (
                        `~$${estimatedProrationWithVat}`
                      ) : (
                        <span className="text-lg">Difference Only</span>
                      )
                    ) : (
                      `$${totalAmount.toFixed(2)}`
                    )}
                  </span>
                  {isUpdate && prorationBehavior === "prorate" && (
                    <p className="text-xs text-green-400 mt-1">
                      {estimatedProrationWithVat
                        ? `Rough estimate *${vatAmount > 0 ? (country === "GB" ? " (incl. VAT)" : " (incl. Tax)") : ""}`
                        : "Less unused time credit"}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {isUpdate ? (
            <div className="flex items-start gap-4 text-sm text-gray-400 bg-blue-500/10 p-4 rounded-lg border border-blue-500/20">
              <Zap className="text-blue-400 flex-shrink-0 mt-0.5" size={24} />
              <div>
                <p className="font-semibold text-blue-300 mb-1">
                  Proration Applied
                </p>
                <p>
                  You will only be charged the difference between your current
                  plan and the new plan for the remainder of this cycle. The
                  full amount shown is the renewal price.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-4 text-sm text-gray-400 bg-[#171717]/50 p-4 rounded-lg border border-gray-800/50">
              <ShieldCheck
                className="text-[#DC569D] flex-shrink-0 mt-0.5"
                size={24}
              />
              <div>
                <p className="font-semibold text-gray-300 mb-1">
                  Secure Payment
                </p>
                <p>
                  Your payment is secure. You can cancel your subscription at
                  any time from your account settings.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Payment Form */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Payment Details</h2>
          <form
            onSubmit={handleSubmit}
            className="space-y-6 bg-[#171717] p-6 rounded-xl border border-gray-800 shadow-xl"
          >
            {/* Payment Method Selector */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white">
                Payment Method
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentProvider("stripe")}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    paymentProvider === "stripe"
                      ? "border-[#DC569D] bg-[#DC569D]/10"
                      : "border-gray-700 hover:border-gray-500"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <rect x="2" y="5" width="20" height="14" rx="2" />
                        <path d="M2 10h20" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-white font-medium text-sm">
                        Credit/Debit Card
                      </div>
                      <div className="text-gray-400 text-xs">
                        Powered by Stripe
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  disabled={!PAYPAL_CLIENT_ID}
                  onClick={() => PAYPAL_CLIENT_ID && setPaymentProvider("paypal")}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    !PAYPAL_CLIENT_ID
                      ? "border-gray-700 opacity-50 cursor-not-allowed"
                      : paymentProvider === "paypal"
                        ? "border-[#DC569D] bg-[#DC569D]/10"
                        : "border-gray-700 hover:border-gray-500"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 4.814-4.622 6.969-8.956 6.969H8.563c-.34 0-.62.24-.669.566l-.284 1.793-.13.919c-.028.213-.174.339-.386.339z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-white font-medium text-sm">
                        PayPal
                      </div>
                      <div className="text-gray-400 text-xs">
                        {PAYPAL_CLIENT_ID
                          ? "Pay with your PayPal account"
                          : "Unavailable"}
                      </div>
                    </div>
                  </div>
                </button>
              </div>
              {isUpdate &&
                currentProvider &&
                currentProvider !== paymentProvider && (
                  <div className="text-xs text-yellow-300 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                    You are switching payment providers. Your current{" "}
                    {currentProvider === "paypal" ? "PayPal" : "Stripe"}{" "}
                    subscription will be cancelled at the end of the current
                    period and replaced with a{" "}
                    {paymentProvider === "paypal" ? "PayPal" : "Stripe"} one.
                  </div>
                )}
            </div>

            {/* Billing Info */}
            <div className="space-y-4 pt-2 pb-6 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">
                Billing Address
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-gray-300 text-sm font-medium">
                    First Name
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full p-3 border border-gray-700 rounded-lg bg-[#212121] text-white focus:outline-none focus:border-[#DC569D] transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-gray-300 text-sm font-medium">
                    Last Name
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full p-3 border border-gray-700 rounded-lg bg-[#212121] text-white focus:outline-none focus:border-[#DC569D] transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-gray-300 text-sm font-medium">
                  Address
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-3 border border-gray-700 rounded-lg bg-[#212121] text-white focus:outline-none focus:border-[#DC569D] transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-gray-300 text-sm font-medium">
                    Country
                  </label>
                  <div className="relative">
                    <SearchableCountrySelect
                      value={country}
                      onChange={setCountry}
                      countries={COUNTRIES}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-gray-300 text-sm font-medium">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    required
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full p-3 border border-gray-700 rounded-lg bg-[#212121] text-white focus:outline-none focus:border-[#DC569D] transition-colors"
                  />
                </div>
              </div>
            </div>

            {paymentProvider === "stripe" && (
              <>
                {/* Card Number */}
                <div className="space-y-2">
                  <label className="block text-gray-300 text-sm font-medium">
                    Card Number
                  </label>
                  <div className="p-3 border border-gray-700 rounded-lg bg-[#212121] focus-within:border-[#DC569D] transition-colors">
                    <CardNumberElement
                      onChange={handleCardNumberChange}
                      options={elementStyle}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-gray-300 text-sm font-medium">
                      Expiry Date
                    </label>
                    <div className="p-3 border border-gray-700 rounded-lg bg-[#212121] focus-within:border-[#DC569D] transition-colors">
                      <CardExpiryElement
                        onChange={handleCardExpiryChange}
                        options={elementStyle}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-gray-300 text-sm font-medium">
                      CVC
                    </label>
                    <div className="p-3 border border-gray-700 rounded-lg bg-[#212121] focus-within:border-[#DC569D] transition-colors">
                      <CardCvcElement
                        onChange={handleCardCvcChange}
                        options={elementStyle}
                      />
                    </div>
                  </div>
                </div>

                {(cardErrors.cardNumber ||
                  cardErrors.cardExpiry ||
                  cardErrors.cardCvc ||
                  cardErrors.apiError) && (
                  <div className="text-red-400 text-sm p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                    {cardErrors.apiError ||
                      cardErrors.cardNumber ||
                      cardErrors.cardExpiry ||
                      cardErrors.cardCvc}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!stripe || isProcessing || !allFieldsComplete}
                  className="w-full py-3 px-4 bg-[#DC569D] text-white font-bold rounded-lg hover:bg-[#c44a87] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#DC569D]/20 mt-4 flex justify-center items-center gap-2"
                >
                  {isProcessing && (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  {isProcessing
                    ? "Processing..."
                    : isUpdate
                      ? "Update Subscription"
                      : `Pay $${totalAmount.toFixed(2)}`}
                </button>
              </>
            )}

            {paymentProvider === "paypal" && (
              <PayPalSubscriptionButton
                plan={plan}
                billingCycle={billingCycle}
                isUpdate={isUpdate}
                currentProvider={currentProvider}
                currentSubscriptionId={currentSubscriptionId}
                billingDetails={{
                  first_name: firstName,
                  last_name: lastName,
                  address: address,
                  postal_code: postalCode,
                  country: country,
                  vat_amount:
                    country === "GB" ? vatAmount.toFixed(2) : "0.00",
                  tax_amount:
                    country !== "GB" ? vatAmount.toFixed(2) : "0.00",
                  tax_rate: country === "GB" ? 20 : 15,
                  tax_type: country === "GB" ? "vat" : "tax",
                }}
                isBillingComplete={Boolean(
                  firstName && lastName && address && postalCode,
                )}
                onSuccess={onSuccess}
                onError={(msg) =>
                  setCardErrors((prev) => ({ ...prev, apiError: msg }))
                }
              />
            )}

            <div className="text-center text-xs text-gray-500 mt-4 leading-relaxed">
              By confirming your subscription, you allow ReelMotion to charge
              your card for this payment and future payments in accordance with
              our terms.
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ProPage() {
  const { t } = useI18n();
  const [billingCycle, setBillingCycle] = useState("monthly"); // "monthly" | "yearly"
  const [selectedPlan, setSelectedPlan] = useState(null); // { name: 'pro' | 'elite', price: number }
  const [showSuccess, setShowSuccess] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const context = useOutletContext();
  const revalidate = context?.revalidate;

  // Detectar modo update desde navegación
  const isUpdate = location.state?.isUpdate || false;
  const prorationBehavior = location.state?.prorationBehavior || "prorate";
  const currentPeriodEnd = location.state?.currentPeriodEnd;
  const currentPlanPrice = location.state?.currentPrice;
  const currentProvider = location.state?.currentProvider;
  const currentSubscriptionId = location.state?.currentSubscriptionId;

  // Inicializar estado si vienen parámetros de navegación (ej. desde my-subscription "Upgrade")
  useEffect(() => {
    if (location.state?.selectedPlan && !selectedPlan) {
      if (location.state.billingCycle) {
        setBillingCycle(location.state.billingCycle);
      }

      const planName = location.state.selectedPlan;
      let price = 0;
      if (planName === "pro")
        price = location.state.billingCycle === "yearly" ? 194.99 : 17.99;
      if (planName === "elite")
        price = location.state.billingCycle === "yearly" ? 518.28 : 47.99;

      setSelectedPlan({ name: planName, price: Number(price).toFixed(2) });
    }
  }, [location.state]);

  const handleSubscribe = (planName, monthlyPrice, yearlyPrice) => {
    let price;
    if (billingCycle === "yearly") {
      price = yearlyPrice;
    } else {
      price = monthlyPrice;
    }
    setSelectedPlan({ name: planName, price: price });
  };

  const handleSuccessContinue = () => {
    navigate("/app/my-subscription");
  };

  const features = {
    free: [
      { text: "Quality - 720p", included: true },
      { text: "Comes with watermark", included: true },
      { text: "20 credits (one time)", included: true },
      { text: "3 rendered videos per month", included: true },
      { text: "Limited access to the chat system", included: true },
    ],
    pro: [
      { text: "1,000 Tokens ($10.00 to generate)", included: true },
      { text: "Full Unlimited Editing Tool", included: true },
      { text: "Full Unlimited Chat System", included: true },
      { text: "No Watermark", included: true },
      { text: "1080p HD Quality Rendering", included: true },
      { text: "Fast Rendering Speeds", included: true },
    ],
    elite: [
      { text: "4,000 Tokens ($40.00 to generate)", included: true },
      { text: "Full Unlimited Editing Access", included: true },
      { text: "Full Unlimited Chat System", included: true },
      { text: "No Watermarks", included: true },
      { text: "Ultra HD 4K Rendering", included: true },
      { text: "High-Speed Rendering", included: true },
    ],
  };

  const getPriceContent = (priceMonthly, priceYearly) => {
    if (billingCycle === "yearly") {
      return (
        <div className="flex flex-col">
          <span className="text-3xl font-bold">${priceYearly}</span>
          <span className="text-sm text-gray-400">/year (save 10%)</span>
        </div>
      );
    }
    return (
      <div className="flex flex-col">
        <span className="text-3xl font-bold">${priceMonthly}</span>
        <span className="text-sm text-gray-400">/month</span>
      </div>
    );
  };

  if (showSuccess) {
    return (
      <div className="flex-1 h-screen overflow-y-auto bg-[#212121] text-white p-6 md:p-12">
        <SuccessMessage onContinue={handleSuccessContinue} />
      </div>
    );
  }

  if (selectedPlan) {
    return (
      <div className="flex-1 h-screen overflow-y-auto bg-[#212121] text-white p-6 md:p-12">
        <Elements stripe={stripePromise}>
          <CheckoutForm
            plan={selectedPlan}
            billingCycle={billingCycle}
            price={selectedPlan.price}
            isUpdate={isUpdate}
            prorationBehavior={prorationBehavior}
            currentPeriodEnd={currentPeriodEnd}
            currentPlanPrice={currentPlanPrice}
            currentProvider={currentProvider}
            currentSubscriptionId={currentSubscriptionId}
            onBack={() => {
              setSelectedPlan(null);
              // Limpiar estado de navegación por si cancela
              navigate(location.pathname, { replace: true, state: {} });
            }}
            onSuccess={() => {
              setShowSuccess(true);
              if (revalidate) revalidate();
            }}
          />
        </Elements>
      </div>
    );
  }

  return (
    <div className="flex-1 h-screen overflow-y-auto bg-[#212121] text-white p-4 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8 md:space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent py-2">
            {t("pricing.title")}
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Get more credits, better quality, and unlock all features.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <span
              className={`text-sm ${
                billingCycle === "monthly" ? "text-white" : "text-gray-400"
              }`}
            >
              {t("pricing.monthly")}
            </span>
            <button
              onClick={() =>
                setBillingCycle(
                  billingCycle === "monthly" ? "yearly" : "monthly",
                )
              }
              className="w-12 h-6 bg-gray-700 rounded-full relative transition-colors duration-200 focus:outline-none"
            >
              <div
                className={`absolute top-1 w-4 h-4 rounded-full bg-[#DC569D] transition-transform duration-200 ${
                  billingCycle === "yearly" ? "left-7" : "left-1"
                }`}
              />
            </button>
            <span
              className={`text-sm ${
                billingCycle === "yearly" ? "text-white" : "text-gray-400"
              }`}
            >
              {t("pricing.yearly")}{" "}
              <span className="text-[#DC569D] text-xs font-bold">
                ({t("pricing.save10")})
              </span>
            </span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
          {/* Free Tier */}
          <div className="bg-[#171717] rounded-2xl p-6 border border-gray-800 flex flex-col hover:border-gray-600 transition-colors">
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2">Free Tier</h3>
              <div className="h-16 flex items-center">
                <span className="text-3xl font-bold">$0</span>
              </div>
              <button className="w-full mt-4 py-2 px-4 rounded-lg bg-[#2f2f2f] text-white font-medium hover:bg-[#3a3a3a] transition-colors cursor-default">
                Current Plan
              </button>
            </div>
            <div className="flex-1 space-y-4">
              {features.free.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  {feature.included ? (
                    <Check className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <X className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                  )}
                  <span
                    className={`text-sm ${
                      feature.included ? "text-gray-300" : "text-gray-500"
                    }`}
                  >
                    {feature.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Pro Tier */}
          <div className="bg-[#171717] rounded-2xl p-6 border border-[#DC569D]/50 relative flex flex-col hover:border-[#DC569D] transition-colors shadow-lg shadow-[#DC569D]/5">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[#DC569D] text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
              <Zap size={12} fill="currentColor" /> POPULAR
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2">Pro Tier</h3>
              <div className="h-16 flex items-center">
                {getPriceContent(17.99, 194.99)}
              </div>
              <button
                onClick={() => handleSubscribe("pro", 17.99, 194.99)}
                className="w-full mt-4 py-2 px-4 rounded-lg bg-[#DC569D] text-white font-medium hover:bg-[#c44a87] transition-colors shadow-lg shadow-[#DC569D]/20"
              >
                Subscribe
              </button>
            </div>
            <div className="flex-1 space-y-4">
              {features.pro.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  {feature.included ? (
                    <Check className="w-5 h-5 text-[#DC569D] flex-shrink-0 mt-0.5" />
                  ) : (
                    <X className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                  )}
                  <span className="text-sm text-gray-300">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Elite Tier */}
          <div className="bg-[#171717] rounded-2xl p-6 border border-gray-800 flex flex-col hover:border-[#DC569D]/50 transition-colors">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-semibold">Elite Tier</h3>
                <Crown size={18} className="text-yellow-500" />
              </div>
              <div className="h-16 flex items-center">
                {getPriceContent(47.99, 518.28)}
              </div>
              <button
                onClick={() => handleSubscribe("elite", 47.99, 518.28)}
                className="w-full mt-4 py-2 px-4 rounded-lg bg-[#2f2f2f] text-white font-medium hover:bg-[#DC569D] hover:text-white transition-all"
              >
                Subscribe
              </button>
            </div>
            <div className="flex-1 space-y-4">
              {features.elite.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  {feature.included ? (
                    <Check className="w-5 h-5 text-[#DC569D] flex-shrink-0 mt-0.5" />
                  ) : (
                    <X className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                  )}
                  <span className="text-sm text-gray-300">
                    {feature.text}
                    {feature.tooltip && (
                      <span className="block text-xs text-gray-500 mt-0.5">
                        {feature.tooltip}
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
