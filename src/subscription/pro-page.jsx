import { useState, useEffect } from "react";
import { Check, X, Zap, Crown, ArrowLeft, ShieldCheck } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { createSubscription, updateSubscription } from "./functions";
import { useNavigate, useOutletContext, useLocation } from "react-router-dom";

const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY_TEST ||
    import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
);

function SuccessMessage({ onContinue }) {
  return (
    <div className="max-w-2xl mx-auto pt-16 text-center space-y-8 animate-in fade-in duration-500">
      <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
        <ShieldCheck size={48} className="text-green-500" />
      </div>
      <div>
        <h2 className="text-3xl font-bold mb-4">Thank you for subscribing!</h2>
        <p className="text-gray-400 text-lg">
          Your subscription has been successfully created. Welcome to the team!
        </p>
      </div>
      <button
        onClick={onContinue}
        className="px-8 py-3 bg-[#DC569D] text-white font-bold rounded-lg hover:bg-[#c44a87] transition-all"
      >
        View My Subscription
      </button>
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
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardNumberComplete, setCardNumberComplete] = useState(false);
  const [cardExpiryComplete, setCardExpiryComplete] = useState(false);
  const [cardCvcComplete, setCardCvcComplete] = useState(false);
  const [cardErrors, setCardErrors] = useState({});

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
    cardNumberComplete && cardExpiryComplete && cardCvcComplete;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements || !allFieldsComplete) return;

    setIsProcessing(true);
    setCardErrors({}); // Clear previous errors

    try {
      // 1. Create Payment Method with Stripe
      const cardElement = elements.getElement(CardNumberElement);
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
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

      // Check if running in test mode based on available keys
      if (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY_TEST) {
        if (pName === "pro" && bCycle === "monthly") {
          priceId = import.meta.env.VITE_STRIPE_PRO_MONTHLY_PRICE_ID_TEST;
        } else if (pName === "pro" && bCycle === "yearly") {
          priceId = import.meta.env.VITE_STRIPE_PRO_YEARLY_PRICE_ID_TEST;
        } else if (pName === "elite" && bCycle === "monthly") {
          priceId = import.meta.env.VITE_STRIPE_ELITE_MONTHLY_PRICE_ID_TEST;
        } else if (pName === "elite" && bCycle === "yearly") {
          priceId = import.meta.env.VITE_STRIPE_ELITE_YEARLY_PRICE_ID_TEST;
        }
      } else {
        if (pName === "pro" && bCycle === "monthly") {
          priceId = import.meta.env.VITE_STRIPE_PRO_MONTHLY_PRICE_ID;
        } else if (pName === "pro" && bCycle === "yearly") {
          priceId = import.meta.env.VITE_STRIPE_PRO_YEARLY_PRICE_ID;
        } else if (pName === "elite" && bCycle === "monthly") {
          priceId = import.meta.env.VITE_STRIPE_ELITE_MONTHLY_PRICE_ID;
        } else if (pName === "elite" && bCycle === "yearly") {
          priceId = import.meta.env.VITE_STRIPE_ELITE_YEARLY_PRICE_ID;
        }
      }

      if (!priceId) {
        throw new Error(
          "Configuration Error: Price ID not found for this plan.",
        );
      }

      // 3. Send to backend
      console.log("Sending to backend:", {
        plan: plan.name,
        billing_cycle: billingCycle,
        price: price,
        payment_method: paymentMethod.id,
        price_id: priceId,
      });

      let response;
      if (isUpdate) {
        response = await updateSubscription({
          plan: plan.name,
          billing_cycle: billingCycle,
          price: price,
          payment_method: paymentMethod.id,
          price_id: priceId,
          proration_behavior: prorationBehavior,
          prorate_amount: estimatedProration,
        });
      } else {
        response = await createSubscription({
          plan: plan.name,
          billing_cycle: billingCycle,
          price: price,
          payment_method: paymentMethod.id,
          price_id: priceId,
        });
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
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
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Tax</span>
                <span>$0.00</span>
              </div>
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
                      estimatedProration ? (
                        `~$${estimatedProration}`
                      ) : (
                        <span className="text-lg">Difference Only</span>
                      )
                    ) : (
                      `$${price}`
                    )}
                  </span>
                  {isUpdate && prorationBehavior === "prorate" && (
                    <p className="text-xs text-green-400 mt-1">
                      {estimatedProration
                        ? "Rough estimate *"
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
                  : `Pay $${price}`}
            </button>

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

  // Inicializar estado si vienen parámetros de navegación (ej. desde my-subscription "Upgrade")
  useEffect(() => {
    if (location.state?.selectedPlan && !selectedPlan) {
      if (location.state.billingCycle) {
        setBillingCycle(location.state.billingCycle);
      }

      const planName = location.state.selectedPlan;
      let price = 0;
      if (planName === "pro")
        price = location.state.billingCycle === "yearly" ? 323.89 : 29.99;
      if (planName === "elite")
        price = location.state.billingCycle === "yearly" ? 647.89 : 59.99;

      setSelectedPlan({ name: planName, price: Number(price).toFixed(2) });
    }
  }, [location.state]);

  const handleSubscribe = (planName, monthlyPrice) => {
    let price;
    if (billingCycle === "yearly") {
      price = (monthlyPrice * 12 * 0.9).toFixed(0);
    } else {
      price = monthlyPrice;
    }
    setSelectedPlan({ name: planName, price: price });
  };

  const handleSuccessContinue = () => {
    navigate("/my-subscription");
  };

  const features = {
    free: [
      { text: "Quality - 720p", included: true },
      { text: "Comes with watermark", included: true },
      { text: "20 credits (one time)", included: true },
      { text: "Only 16:9 and 9:16 resize options", included: true },
      { text: "Limited access to stock footage/images", included: true },
      { text: "Limited access to Text fonts", included: true },
      { text: "No access to adding captions", included: false },
    ],
    pro: [
      { text: "Faster Renderization", included: true },
      { text: "Quality 1080p HD", included: true },
      { text: "No watermark", included: true },
      { text: "1000 credits / month", included: true },
      { text: "All resize options", included: true },
      { text: "Access to all stock footage/images", included: true },
      { text: "Access to text fonts", included: true },
      { text: "Access to adding captions", included: true },
    ],
    elite: [
      { text: "Faster Renderization", included: true },
      { text: "Quality 1080p HD", included: true },
      { text: "No watermark", included: true },
      { text: "4000 credits / month", included: true },
      { text: "All resize options", included: true },
      { text: "Access to all stock footage/images", included: true },
      { text: "Access to text fonts", included: true },
      { text: "Access to adding captions", included: true },
      { text: "Includes 4K video export", included: true },
      {
        text: "10% bonus on credit top-ups",
        included: true,
        tooltip: "Everytime you top up, get extra 10% credits",
      },
    ],
  };

  const getPriceContent = (priceMonthly) => {
    if (billingCycle === "yearly") {
      const yearlyPrice = priceMonthly * 12 * 0.9;
      return (
        <div className="flex flex-col">
          <span className="text-3xl font-bold">${yearlyPrice.toFixed(0)}</span>
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
    <div className="flex-1 h-screen overflow-y-auto bg-[#212121] text-white p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Upgrade your plan
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
              Monthly
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
              Yearly{" "}
              <span className="text-[#DC569D] text-xs font-bold">
                (Save 10%)
              </span>
            </span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
                {getPriceContent(29.99)}
              </div>
              <button
                onClick={() => handleSubscribe("pro", 29.99)}
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
                {getPriceContent(59.99)}
              </div>
              <button
                onClick={() => handleSubscribe("elite", 59.99)}
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
