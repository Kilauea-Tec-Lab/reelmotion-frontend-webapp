import { useEffect, useState } from "react";
import {
  Copy,
  Check,
  Filter,
  Search,
  Download,
  Calendar,
  CreditCard,
  Box,
  AlertCircle,
  Clock,
  CheckCircle2,
  ChevronRight,
  X,
  Zap,
  Crown as CrownIcon,
} from "lucide-react";
import { getMySubscription, cancelSubscription } from "./functions";
import { useNavigate, useOutletContext } from "react-router-dom";

export default function MySubscription() {
  const [subscription, setSubscription] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showChangePlanModal, setShowChangePlanModal] = useState(false);
  const [showProrationModal, setShowProrationModal] = useState(false);
  const [pendingSelection, setPendingSelection] = useState(null);
  // Estado local para alternar ciclo dentro del modal de cambio de plan
  const [modalBillingCycle, setModalBillingCycle] = useState(null);
  const navigate = useNavigate();
  const context = useOutletContext();
  const revalidate = context?.revalidate;

  useEffect(() => {
    // Cuando cargue la suscripción, iniciamos el toggle con su ciclo actual
    if (subscription?.billing_cycle) {
      setModalBillingCycle(subscription.billing_cycle);
    }
  }, [subscription]);

  const features = {
    pro: [
      { text: "Fast Rendering", included: true },
      { text: "Quality 1080p HD", included: true },
      { text: "No watermark", included: true },
      { text: "1000 credits / month", included: true },
      { text: "All resize options", included: true },
      { text: "Access to all stock footage/images", included: true },
      { text: "Access to text fonts", included: true },
      { text: "Access to adding captions", included: true },
    ],
    elite: [
      { text: "Fast Rendering", included: true },
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

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const data = await getMySubscription();

      if (!data.suscription && !data.invoices) {
        // Redirigir a la página de planes si no hay suscripción
        // Asumiendo que /pro es la ruta para pro-page.jsx
        // Necesito confirmar la ruta en App.jsx, pero por el contexto parece ser una navegación lógica.
        navigate("/pro");
        return;
      }

      setSubscription(formatSubscriptionData(data.suscription));
      setInvoices(data.invoices || []);
    } catch (error) {
      console.error("Error loading subscription", error);
    } finally {
      setLoading(false);
    }
  };

  const formatSubscriptionData = (rawSub) => {
    if (!rawSub) return null;

    let price = 0;
    if (rawSub.suscription === "pro") {
      price = rawSub.payment_recurrency === "yearly" ? 323.89 : 29.99;
    } else if (rawSub.suscription === "elite") {
      price = rawSub.payment_recurrency === "yearly" ? 647.89 : 59.99;
    }

    let nextBilling = new Date(rawSub.ultimate_pay);
    if (!isNaN(nextBilling.getTime())) {
      if (rawSub.payment_recurrency === "monthly") {
        nextBilling.setMonth(nextBilling.getMonth() + 1);
      } else if (rawSub.payment_recurrency === "yearly") {
        nextBilling.setFullYear(nextBilling.getFullYear() + 1);
      }
    } else {
      nextBilling = null;
    }

    const nextBillingDate = nextBilling
      ? nextBilling.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "N/A";

    return {
      plan_name: rawSub.suscription,
      status: rawSub.status === "1" ? "active" : "inactive",
      price: price.toFixed(2),
      billing_cycle: rawSub.payment_recurrency,
      next_billing_date: nextBillingDate,
      current_period_end_date: nextBilling ? nextBilling.toISOString() : null,
      ...rawSub,
    };
  };

  const handleCancelSubscription = async () => {
    try {
      setLoading(true);
      const data = await cancelSubscription();
      setShowCancelModal(false);

      if (data.message === "Suscription cancelled successfully") {
        loadSubscription();
        if (revalidate) revalidate();
      } else {
        alert("Could not cancel subscription: " + data.message);
      }
    } catch (error) {
      console.error("Error cancelling subscription", error);
      alert("Error cancelling subscription");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 h-screen bg-[#212121] text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  // Si llegamos aquí y no hay suscripción (pero el check de redirección falló o algo), mostramos algo básico
  if (!subscription) {
    return null; // O un estado vacío temporal
  }

  return (
    <div className="flex-1 h-screen overflow-y-auto bg-[#212121] text-white p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            My Subscription
          </h1>
        </div>

        {/* Subscription Card */}
        <div className="bg-[#171717] rounded-2xl p-6 border border-gray-800 shadow-xl">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold capitalize">
                  {subscription.plan_name || "Free Tier"}
                </h2>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    subscription.status === "active"
                      ? "bg-green-500/20 text-green-400"
                      : "bg-yellow-500/20 text-yellow-500"
                  }`}
                >
                  {subscription.status || "Active"}
                </span>
              </div>
              <p className="text-gray-400 flex items-center gap-2">
                <Calendar size={16} />
                Next billing date:{" "}
                <span className="text-white font-medium">
                  {subscription.next_billing_date || "N/A"}
                </span>
              </p>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="text-right">
                <span className="text-3xl font-bold">
                  ${subscription.price || "0.00"}
                </span>
                <span className="text-gray-400 text-sm">
                  /{subscription.billing_cycle || "month"}
                </span>
              </div>
              {/* Botones de acción */}
              <div className="flex gap-3 mt-4 md:mt-0">
                <button
                  onClick={() => setShowChangePlanModal(true)}
                  className="px-4 py-2 bg-[#DC569D] hover:bg-[#c44a87] text-white rounded-lg text-sm font-bold transition-colors shadow-lg shadow-[#DC569D]/20"
                >
                  Change Plan
                </button>
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="px-4 py-2 bg-[#2f2f2f] hover:bg-[#3a3a3a] text-gray-300 rounded-lg text-sm font-medium transition-colors border border-gray-700"
                >
                  Cancel Plan
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Change Plan Modal */}
        {showChangePlanModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div
              className="bg-[#171717] rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto border border-gray-800 flex flex-col animate-in fade-in zoom-in duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-800 flex justify-between items-center sticky top-0 bg-[#171717] z-10">
                <div>
                  <h2 className="text-2xl font-bold">Change your plan</h2>
                  <p className="text-gray-400 text-sm">
                    Choose the plan that best fits your needs
                  </p>
                </div>

                {/* Billing Toggle for Upgrade Modal */}
                <div className="flex items-center gap-3 bg-[#212121] p-1 rounded-full border border-gray-700">
                  <button
                    onClick={() => setModalBillingCycle("monthly")}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                      modalBillingCycle === "monthly"
                        ? "bg-[#DC569D] text-white shadow-lg"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setModalBillingCycle("yearly")}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                      modalBillingCycle === "yearly"
                        ? "bg-[#DC569D] text-white shadow-lg"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Yearly
                  </button>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => setShowChangePlanModal(false)}
                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors ml-4"
                  >
                    <X size={20} className="text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Pro Tier */}
                <div
                  className={`rounded-xl p-6 border relative flex flex-col transition-colors ${subscription.plan_name === "pro" && subscription.billing_cycle === modalBillingCycle ? "bg-[#1e1e1e] border-[#DC569D] opacity-80 cursor-not-allowed" : "bg-[#121212] border-gray-800 hover:border-[#DC569D]/50"}`}
                >
                  {subscription.plan_name === "pro" &&
                    subscription.billing_cycle === modalBillingCycle && (
                      <div className="absolute top-4 right-4 bg-[#DC569D]/20 text-[#DC569D] text-xs font-bold px-2 py-1 rounded">
                        Current Plan
                      </div>
                    )}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap size={20} className="text-[#DC569D]" />
                      <h3 className="text-xl font-semibold">Pro Tier</h3>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold">
                        {modalBillingCycle === "yearly" ? "$323.89" : "$29.99"}
                      </span>
                      <span className="text-sm text-gray-400">
                        /{modalBillingCycle === "yearly" ? "year" : "month"}
                      </span>
                    </div>
                    {modalBillingCycle === "yearly" && (
                      <span className="text-xs text-[#DC569D] font-bold">
                        Save 10%
                      </span>
                    )}
                    <button
                      disabled={
                        subscription.plan_name === "pro" &&
                        subscription.billing_cycle === modalBillingCycle
                      }
                      onClick={() => {
                        setPendingSelection({
                          selectedPlan: "pro",
                          billingCycle: modalBillingCycle,
                          isUpdate: true,
                          currentPlan:
                            subscription.plan_name === "pro"
                              ? "pro"
                              : subscription.plan_name === "elite"
                                ? "elite"
                                : "free",
                          currentPeriodEnd:
                            subscription.current_period_end_date,
                          currentPrice: subscription.price,
                        });
                        setShowProrationModal(true);
                      }}
                      className="w-full mt-4 py-2 px-4 rounded-lg bg-[#DC569D] text-white font-medium hover:bg-[#c44a87] disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
                    >
                      {subscription.plan_name === "pro" &&
                      subscription.billing_cycle === modalBillingCycle
                        ? "Current Plan"
                        : "Select Plan"}
                    </button>
                  </div>
                  <div className="flex-1 space-y-3">
                    {features.pro.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <Check className="w-4 h-4 text-[#DC569D] flex-shrink-0 mt-1" />
                        <span className="text-sm text-gray-300">
                          {feature.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Elite Tier */}
                <div
                  className={`rounded-xl p-6 border relative flex flex-col transition-colors ${subscription.plan_name === "elite" && subscription.billing_cycle === modalBillingCycle ? "bg-[#1e1e1e] border-[#DC569D] opacity-80 cursor-not-allowed" : "bg-[#121212] border-gray-800 hover:border-[#DC569D]/50"}`}
                >
                  {subscription.plan_name === "elite" &&
                    subscription.billing_cycle === modalBillingCycle && (
                      <div className="absolute top-4 right-4 bg-[#DC569D]/20 text-[#DC569D] text-xs font-bold px-2 py-1 rounded">
                        Current Plan
                      </div>
                    )}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <CrownIcon size={20} className="text-yellow-500" />
                      <h3 className="text-xl font-semibold">Elite Tier</h3>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold">
                        {modalBillingCycle === "yearly" ? "$647.89" : "$59.99"}
                      </span>
                      <span className="text-sm text-gray-400">
                        /{modalBillingCycle === "yearly" ? "year" : "month"}
                      </span>
                    </div>
                    {modalBillingCycle === "yearly" && (
                      <span className="text-xs text-[#DC569D] font-bold">
                        Save 10%
                      </span>
                    )}
                    <button
                      disabled={
                        subscription.plan_name === "elite" &&
                        subscription.billing_cycle === modalBillingCycle
                      }
                      onClick={() => {
                        setPendingSelection({
                          selectedPlan: "elite",
                          billingCycle: modalBillingCycle,
                          isUpdate: true,
                          currentPlan:
                            subscription.plan_name === "elite"
                              ? "elite"
                              : subscription.plan_name === "pro"
                                ? "pro"
                                : "free",
                          currentPeriodEnd:
                            subscription.current_period_end_date,
                          currentPrice: subscription.price,
                        });
                        setShowProrationModal(true);
                      }}
                      className="w-full mt-4 py-2 px-4 rounded-lg bg-[#DC569D] text-white font-medium hover:bg-[#c44a87] disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
                    >
                      {subscription.plan_name === "elite" &&
                      subscription.billing_cycle === modalBillingCycle
                        ? "Current Plan"
                        : "Select Plan"}
                    </button>
                  </div>
                  <div className="flex-1 space-y-3">
                    {features.elite.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <Check className="w-4 h-4 text-[#DC569D] flex-shrink-0 mt-1" />
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
        )}

        {/* Proration Choice Modal */}
        {showProrationModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div
              className="bg-[#171717] rounded-xl max-w-lg w-full border border-gray-800 p-6 animate-in fade-in zoom-in duration-200 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Billing Preferences
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Choose how you want to apply this change to your
                    subscription.
                  </p>
                </div>
                <button
                  onClick={() => setShowProrationModal(false)}
                  className="p-1 hover:bg-gray-800 rounded text-gray-400 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => {
                    navigate("/pro", {
                      state: {
                        ...pendingSelection,
                        prorationBehavior: "new_cycle",
                      },
                    });
                    setShowProrationModal(false);
                    setShowChangePlanModal(false);
                  }}
                  className="w-full text-left p-4 rounded-xl border border-gray-700 hover:border-[#DC569D] hover:bg-[#1e1e1e] transition-all group"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-full bg-blue-500/10 text-blue-400 group-hover:bg-[#DC569D]/10 group-hover:text-[#DC569D] transition-colors">
                      <Zap size={20} />
                    </div>
                    <span className="font-bold text-white">
                      Start New Cycle
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 pl-[52px]">
                    Start a fresh billing cycle today. You will be charged the
                    full amount immediately.
                  </p>
                </button>

                <button
                  onClick={() => {
                    navigate("/pro", {
                      state: {
                        ...pendingSelection,
                        prorationBehavior: "prorate",
                      },
                    });
                    setShowProrationModal(false);
                    setShowChangePlanModal(false);
                  }}
                  className="w-full text-left p-4 rounded-xl border border-gray-700 hover:border-[#DC569D] hover:bg-[#1e1e1e] transition-all group"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-full bg-green-500/10 text-green-400 group-hover:bg-[#DC569D]/10 group-hover:text-[#DC569D] transition-colors">
                      <Calendar size={20} />
                    </div>
                    <span className="font-bold text-white">
                      Prorate Current Cycle
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 pl-[52px]">
                    Pay only the difference for the remaining days. Your billing
                    date stays the same.
                  </p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Confirmation Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div
              className="bg-[#171717] rounded-xl max-w-md w-full border border-gray-800 p-6 animate-in fade-in zoom-in duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-4 mb-4 text-red-500">
                <AlertCircle size={32} />
                <h3 className="text-xl font-bold text-white">
                  Cancel Subscription?
                </h3>
              </div>

              <p className="text-gray-300 mb-6">
                Are you sure you want to cancel your subscription?{" "}
                <span className="font-bold text-white">
                  At this moment you will return to the free plan
                </span>{" "}
                and lose access to premium features immediately.
              </p>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2 bg-[#2f2f2f] hover:bg-[#3a3a3a] text-white rounded-lg font-medium transition-colors"
                >
                  Keep Plan
                </button>
                <button
                  onClick={handleCancelSubscription}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors"
                >
                  Confirm Cancellation
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Invoices Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Billing History</h2>

          <div className="bg-[#171717] rounded-xl border border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#1e1e1e] text-gray-400 text-sm">
                  <tr>
                    <th className="p-4 font-medium">Date</th>
                    <th className="p-4 font-medium">Description</th>
                    <th className="p-4 font-medium">Amount</th>
                    <th className="p-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {invoices.length > 0 ? (
                    invoices.map((invoice, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-[#1e1e1e]/50 transition-colors"
                      >
                        <td className="p-4 text-gray-300">
                          {invoice.created_at
                            ? new Date(invoice.created_at).toLocaleDateString()
                            : "-"}
                        </td>
                        <td className="p-4">
                          <div className="font-medium text-white">
                            {invoice.product}
                          </div>
                          <div className="text-xs text-gray-500">
                            {invoice.type_of_document === "1"
                              ? "Subscription"
                              : invoice.type_of_document === "2"
                                ? "Tokens Purchase"
                                : "Purchase"}
                          </div>
                        </td>
                        <td className="p-4 text-white font-medium">
                          ${invoice.total}
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-1 rounded text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                            Paid
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-gray-500">
                        No invoices found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
