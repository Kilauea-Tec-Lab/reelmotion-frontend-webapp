import React, { useState, useEffect, useRef } from "react";
import {
  Bell,
  User,
  Search,
  LogOut,
  ChevronDown,
  Cog,
  Play,
  RefreshCw,
  CreditCard,
  DollarSign,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { searchProjects } from "../create_elements/functions";
import PostModal from "../discover/components/post-modal";
import { getUserNotifications, deleteNotification } from "../auth/functions";
import { getPostById } from "../discover/functions";
import { createPusherClient } from "@/pusher";

// PayPal configuration
let paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;
let paypalEnvironment = import.meta.env.VITE_PAYPAL_ENVIRONMENT || "sandbox"; // 'sandbox' or 'production'

function MainTopMenu({ user_info }) {
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const menuRef = useRef(null);
  const notificationsRef = useRef(null);
  const searchRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [notificationsInfo, setNotificationsInfo] = useState([]);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [selectedNotificationPost, setSelectedNotificationPost] =
    useState(null);

  // Token system states
  const [tokens, setTokens] = useState(0);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [tokenPurchaseStep, setTokenPurchaseStep] = useState("select-amount"); // 'select-amount', 'select-gateway', 'payment-method', 'confirm', 'success', 'error'
  const [purchaseAmount, setPurchaseAmount] = useState(6); // Amount in dollars
  const [selectedGateway, setSelectedGateway] = useState("card"); // 'card', 'paypal'
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");
  const [paymentMessageType, setPaymentMessageType] = useState(""); // 'success', 'error', 'warning'
  const [paymentDetails, setPaymentDetails] = useState(null); // Para detalles adicionales como tokens agregados

  // PayPal states
  const [paypalLoaded, setPaypalLoaded] = useState(false);
  const [paypalInstance, setPaypalInstance] = useState(null);
  const [paypalContainerReady, setPaypalContainerReady] = useState(false);

  //WEBSOCKET
  const pusherClient = createPusherClient();

  // Calcular notificaciones no leídas
  const unreadCount = notificationsInfo.filter((n) => n.unread).length;

  // Cerrar los menús cuando se hace clic fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Búsqueda de proyectos con debounce
  useEffect(() => {
    if (searchTerm.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for search
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await searchProjects(searchTerm.trim());

        if (response.success && response.data && Array.isArray(response.data)) {
          setSearchResults(response.data);
          setShowSearchResults(response.data.length > 0);
        } else {
          setSearchResults([]);
          setShowSearchResults(false);
        }
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults([]);
        setShowSearchResults(false);
      } finally {
        setIsSearching(false);
      }
    }, 500); // 500ms delay

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  function handleLogOut() {
    Cookies.remove("token");
    navigate("/login", { replace: true });
  }

  const handleProjectSelect = (project) => {
    // Abrir el visualizador de proyectos con el ID seleccionado
    setSelectedProjectId(project.id);
    setSearchTerm("");
    setSearchResults([]);
    setShowSearchResults(false);
    setShowProjectModal(true);
  };

  const handleCloseProjectModal = () => {
    setShowProjectModal(false);
    setSelectedProjectId(null);
  };

  async function getNotifications() {
    const response = await getUserNotifications();
    setNotificationsInfo(response?.data || []);
  }

  // Socket para notificaciones

  useEffect(() => {
    if (!user_info?.id) return;

    let channel = pusherClient.subscribe(
      `private-get-notifications.${user_info.id}`
    );

    channel.bind("fill-notifications", ({ user_id }) => {
      getNotifications();
    });

    return () => {
      pusherClient.unsubscribe(`private-get-notifications.${user_info.id}`);
    };
  }, [user_info?.id]);

  useEffect(() => {
    getNotifications();
  }, []);

  // Socket para tokens
  useEffect(() => {
    if (!user_info?.id) return;

    let channel = pusherClient.subscribe(
      `private-get-user-tokens.${user_info.id}`
    );

    channel.bind("fill-user-tokens", ({ user_id }) => {
      fetchUserTokens();
    });

    return () => {
      pusherClient.unsubscribe(`private-get-user-tokens.${user_info.id}`);
    };
  }, [user_info?.id]);

  // Helper function to format date as "hace 1 min", "hace 2 hrs", etc.
  function timeAgo(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const diff = Math.floor((now - date) / 1000); // seconds

    if (isNaN(diff) || diff < 0) return "";

    if (diff < 60) return "hace unos segundos";
    if (diff < 3600) {
      const mins = Math.floor(diff / 60);
      return `hace ${mins} min${mins > 1 ? "s" : ""}`;
    }
    if (diff < 86400) {
      const hrs = Math.floor(diff / 3600);
      return `hace ${hrs} hr${hrs > 1 ? "s" : ""}`;
    }
    const days = Math.floor(diff / 86400);
    return `hace ${days} día${days > 1 ? "s" : ""}`;
  }

  // Función para manejar el click en notificaciones
  const handleNotificationClick = async (notification) => {
    try {
      // 1. Eliminar la notificación
      await deleteNotification(notification.id);

      // 3. Si es una notificación de post, obtener la info y abrir el modal
      if (notification.type == "post" && notification.referente_to_go) {
        const postResponse = await getPostById(notification.referente_to_go);
        if (postResponse.data) {
          setSelectedNotificationPost(postResponse.data);
          setShowNotificationModal(true);
        }
      }

      if (notification.type == "folder_shared") {
        // Redirigir al usuario a la carpeta compartida
        navigate(`/projects`);
      }

      // Cerrar el dropdown de notificaciones
      setShowNotifications(false);
    } catch (error) {
      console.error("Error handling notification click:", error);
    }
  };

  const handleCloseNotificationModal = () => {
    setShowNotificationModal(false);
    setSelectedNotificationPost(null);
  };

  // Token management functions
  const fetchUserTokens = async () => {
    setIsLoadingTokens(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_APP_BACKEND_URL}users/tokens`,
        {
          headers: {
            Authorization: "Bearer " + Cookies.get("token"),
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setTokens(data.data || 0);
    } catch (error) {
      console.error("Error fetching tokens:", error);
      // Set a default value if fetch fails
      setTokens(0);
    } finally {
      setIsLoadingTokens(false);
    }
  };

  const handleOpenTokenModal = () => {
    setShowTokenModal(true);
    setTokenPurchaseStep("select-amount");
    setPurchaseAmount(6);
  };

  const handleCloseTokenModal = () => {
    setShowTokenModal(false);
    setTokenPurchaseStep("select-amount");
    setPurchaseAmount(6);
    setSelectedGateway("card");
    setIsProcessingPayment(false);
    setPaymentMessage("");
    setPaymentMessageType("");
    setPaymentDetails(null);
  };

  // Calculate tokens from dollar amount (1 dollar = 100 tokens)
  const calculateTokens = (dollars) => dollars * 100;

  const handleAmountChange = (e) => {
    const value = Math.max(6, parseInt(e.target.value) || 6);
    setPurchaseAmount(value);
  };

  const handleContinueToPayment = () => {
    if (purchaseAmount >= 6) {
      setTokenPurchaseStep("select-gateway");
    }
  };

  // Load PayPal SDK and initialize payment buttons
  const loadPaypalPaymentForm = async () => {
    try {
      // Load PayPal SDK if not already loaded
      if (!window.paypal) {
        const script = document.createElement("script");
        // Use correct SDK URL based on environment
        script.src = `https://www.paypal.com/sdk/js?client-id=${paypalClientId}&currency=USD&intent=capture&components=buttons,card-fields`;
        script.async = true;
        document.head.appendChild(script);

        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
        });
      }

      if (!paypalClientId) {
        console.error(
          "PayPal Client ID not found. Please set VITE_PAYPAL_CLIENT_ID environment variable."
        );
        return;
      }
      setPaypalLoaded(true);
      setPaypalContainerReady(true);

      // Initialize PayPal Buttons based on selected gateway
      if (selectedGateway === "card") {
        // For credit card payments
        const cardContainer = document.querySelector("#paypal-card-container");

        if (!cardContainer) {
          throw new Error("PayPal card container not found");
        }

        // Clear any existing PayPal buttons
        cardContainer.innerHTML = "";

        const cardButtons = window.paypal.Buttons({
          style: {
            layout: "vertical",
            color: "black",
            shape: "rect",
            label: "pay",
          },
          fundingSource: window.paypal.FUNDING.CARD,
          createOrder: (data, actions) => {
            return actions.order.create({
              purchase_units: [
                {
                  amount: {
                    value: purchaseAmount.toString(),
                    currency_code: "USD",
                  },
                  description: `${purchaseAmount * 100} ReelMotion Tokens`,
                },
              ],
              application_context: {
                shipping_preference: "NO_SHIPPING",
                user_action: "PAY_NOW",
              },
            });
          },
          onApprove: async (data, actions) => {
            setIsProcessingPayment(true);
            try {
              const order = await actions.order.capture();
              await handlePaypalPayment(order);
            } catch (error) {
              console.error("Error capturing PayPal card order:", error);
              setTokenPurchaseStep("error");
              setPaymentMessage(
                "Card payment capture failed. Please try again."
              );
              setPaymentMessageType("error");
            } finally {
              setIsProcessingPayment(false);
            }
          },
          onError: (err) => {
            console.error("PayPal card error:", err);
            setTokenPurchaseStep("error");
            setPaymentMessage("Card payment failed. Please try again.");
            setPaymentMessageType("error");
          },
        });

        await cardButtons.render("#paypal-card-container");

        // Apply custom styles to make PayPal card container white
        setTimeout(() => {
          const paypalCardContainerElements = document.querySelectorAll(
            "#paypal-card-container .paypal-button-container, #paypal-card-container .paypal-autoresize-container, #paypal-card-container .paypal-button-layout-vertical, #paypal-card-container .paypal-button-shape-rect, #paypal-card-container .paypal-button-number-single, #paypal-card-container .paypal-button-env-sandbox"
          );

          paypalCardContainerElements.forEach((element) => {
            element.style.backgroundColor = "white";
            element.style.borderRadius = "8px";
            element.style.overflow = "hidden";
          });

          // Also apply to nested iframe content if accessible
          const paypalCardIframes = document.querySelectorAll(
            "#paypal-card-container iframe"
          );
          paypalCardIframes.forEach((iframe) => {
            try {
              if (iframe.contentDocument) {
                const iframeBody = iframe.contentDocument.body;
                if (iframeBody) {
                  iframeBody.style.backgroundColor = "white";
                }
              }
            } catch (e) {
              // Cross-origin restriction, expected for PayPal iframes
            }
          });
        }, 500);

        setPaypalInstance(cardButtons);
      } else if (selectedGateway === "paypal") {
        // For PayPal account payments
        const paypalContainer = document.querySelector(
          "#paypal-button-container"
        );

        if (!paypalContainer) {
          throw new Error("PayPal account container not found");
        }

        // Clear any existing PayPal buttons
        paypalContainer.innerHTML = "";

        const paypalButtons = window.paypal.Buttons({
          style: {
            layout: "vertical",
            color: "white",
            shape: "rect",
            label: "paypal",
          },
          fundingSource: window.paypal.FUNDING.PAYPAL,
          createOrder: (data, actions) => {
            return actions.order.create({
              purchase_units: [
                {
                  amount: {
                    value: purchaseAmount.toString(),
                    currency_code: "USD",
                  },
                  description: `${purchaseAmount * 100} ReelMotion Tokens`,
                },
              ],
              application_context: {
                shipping_preference: "NO_SHIPPING",
                user_action: "PAY_NOW",
                payment_method: {
                  payee_preferred: "IMMEDIATE_PAYMENT_REQUIRED",
                  payer_selected: "PAYPAL",
                },
              },
            });
          },
          onApprove: async (data, actions) => {
            setIsProcessingPayment(true);
            try {
              const order = await actions.order.capture();
              await handlePaypalPayment(order);
            } catch (error) {
              console.error("Error capturing PayPal order:", error);
              setTokenPurchaseStep("error");
              setPaymentMessage("Payment capture failed. Please try again.");
              setPaymentMessageType("error");
            } finally {
              setIsProcessingPayment(false);
            }
          },
          onError: (err) => {
            console.error("PayPal error:", err);
            setTokenPurchaseStep("error");
            setPaymentMessage("PayPal payment failed. Please try again.");
            setPaymentMessageType("error");
          },
        });

        await paypalButtons.render("#paypal-button-container");

        // Apply custom styles to make PayPal container white
        setTimeout(() => {
          const paypalContainerElements = document.querySelectorAll(
            ".paypal-button-container, .paypal-autoresize-container, .paypal-button-layout-vertical, .paypal-button-shape-rect, .paypal-button-number-single, .paypal-button-env-sandbox"
          );

          paypalContainerElements.forEach((element) => {
            element.style.backgroundColor = "white";
            element.style.borderRadius = "8px";
            element.style.overflow = "hidden";
          });

          // Also apply to nested iframe content if accessible
          const paypalIframes = document.querySelectorAll(
            "#paypal-button-container iframe"
          );
          paypalIframes.forEach((iframe) => {
            try {
              if (iframe.contentDocument) {
                const iframeBody = iframe.contentDocument.body;
                if (iframeBody) {
                  iframeBody.style.backgroundColor = "white";
                }
              }
            } catch (e) {}
          });
        }, 500);

        setPaypalInstance(paypalButtons);
      }
    } catch (error) {
      console.error("Error loading PayPal Payment Form:", error);
      setPaypalLoaded(false);
      setPaypalContainerReady(false);
    }
  };

  // Handle PayPal payment processing
  const handlePaypalPayment = async (order) => {
    setPaymentMessage("");
    setPaymentMessageType("");
    setPaymentDetails(null);

    try {
      if (order.status !== "COMPLETED") {
        console.error(
          "❌ [VALIDATION 1] Payment not completed. Status:",
          order.status
        );
        setTokenPurchaseStep("error");
        setPaymentMessage(`Payment not completed. Status: ${order.status}`);
        setPaymentMessageType("error");
        return;
      }

      // 🔥 VALIDACIÓN 2: Verificar que existan purchase units
      const purchaseUnits = order.purchase_units;

      if (!purchaseUnits || purchaseUnits.length === 0) {
        console.error("❌ [VALIDATION 2] No purchase units found");
        setTokenPurchaseStep("error");
        setPaymentMessage("Invalid payment structure - no purchase units");
        setPaymentMessageType("error");
        return;
      }

      // 🔥 VALIDACIÓN 3: Verificar que existan captures exitosos
      const captures = purchaseUnits[0]?.payments?.captures;

      if (!captures || captures.length === 0) {
        console.error("❌ [VALIDATION 3] No payment captures found");
        setTokenPurchaseStep("error");
        setPaymentMessage("Payment was not captured successfully");
        setPaymentMessageType("error");
        return;
      }

      // 🔥 VALIDACIÓN 4: Verificar el estado del capture
      const captureStatus = captures[0]?.status;
      const captureAmount = captures[0]?.amount?.value;
      const captureCurrency = captures[0]?.amount?.currency_code;
      const captureId = captures[0]?.id;

      if (captureStatus !== "COMPLETED") {
        console.error(
          "❌ [VALIDATION 4] Payment capture failed. Status:",
          captureStatus
        );
        setTokenPurchaseStep("error");
        setPaymentMessage(`Payment capture failed. Status: ${captureStatus}`);
        setPaymentMessageType("error");
        return;
      }

      if (parseFloat(captureAmount) !== parseFloat(purchaseAmount)) {
        console.error("❌ [VALIDATION 5] Amount mismatch:", {
          expected: purchaseAmount,
          captured: captureAmount,
        });
        setTokenPurchaseStep("error");
        setPaymentMessage(
          `Amount mismatch: Expected $${purchaseAmount}, captured $${captureAmount}`
        );
        setPaymentMessageType("error");
        return;
      }

      if (captureCurrency !== "USD") {
        console.error("❌ [VALIDATION 6] Currency mismatch:", captureCurrency);
        setTokenPurchaseStep("error");
        setPaymentMessage(
          `Invalid currency: ${captureCurrency}. Only USD is accepted.`
        );
        setPaymentMessageType("error");
        return;
      }

      // 🔥 VALIDACIÓN 8: Verificar detalles del pagador
      const payer = order.payer;

      // 🔥 VALIDACIÓN 9: Verificar seller_receivable_breakdown
      const breakdown = captures[0]?.seller_receivable_breakdown;

      // Call backend for PayPal payment processing
      const response = await fetch(
        `${import.meta.env.VITE_APP_BACKEND_URL}payments/process-paypal`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + Cookies.get("token"),
          },
          body: JSON.stringify({
            amount: purchaseAmount,
            currency: "USD", // Backend expects uppercase
            gateway: "paypal",
            order_id: order.id,
            payment_details: order,
            tokens_to_add: purchaseAmount * 100, // Convert to tokens
            // 🔥 AGREGAR: Detalles adicionales para verificación backend
            capture_details: {
              capture_id: captureId,
              capture_status: captureStatus,
              capture_amount: captureAmount,
              capture_currency: captureCurrency,
              paypal_fee: breakdown?.paypal_fee,
              net_amount: breakdown?.net_amount,
            },
            environment: paypalEnvironment,
            payer_details: payer
              ? {
                  payer_id: payer.payer_id,
                  email: payer.email_address,
                  country: payer.address?.country_code,
                }
              : null,
          }),
        }
      );
      const result = await response.json();

      if (result.success) {
        // Payment successful - backend returns data in result.data
        setTokenPurchaseStep("success");
        setPaymentMessage(result.message || "Payment successful");
        setPaymentMessageType("success");
        setPaymentDetails({
          tokens_added: result.data.tokens_added,
          total_paid: result.data.amount_paid,
          currency: result.data.currency,
          payment_id: result.data.transaction_id,
          new_token_balance: result.data.new_token_balance,
        });

        // Refresh user tokens from server
        await fetchUserTokens();
      } else {
        console.error("❌ Backend rejected payment:", result);
        // Payment error - show specific backend message
        setTokenPurchaseStep("error");
        setPaymentMessage(result.message || "Payment failed");
        setPaymentMessageType("error");
      }
    } catch (error) {
      console.error("❌ Error processing PayPal payment:", error);
      setTokenPurchaseStep("error");
      setPaymentMessage(`Payment failed: ${error.message}`);
      setPaymentMessageType("error");
    }
  };

  // Load tokens on component mount
  useEffect(() => {
    fetchUserTokens();
  }, []);

  // Inject custom CSS for white PayPal containers
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      .paypal-button-container,
      .paypal-autoresize-container,
      .paypal-button-layout-vertical,
      .paypal-button-shape-rect,
      .paypal-button-number-single,
      .paypal-button-env-sandbox {
        background-color: white !important;
        border-radius: 8px !important;
        overflow: hidden !important;
      }
      
      #paypal-button-container,
      #paypal-card-container {
        background-color: white !important;
        border-radius: 8px !important;
        overflow: hidden !important;
        padding: 10px;
      }
      
      /* Try to target PayPal button content */
      .paypal-button-container * {
        background-color: white !important;
      }
    `;
    document.head.appendChild(style);

    // Cleanup function to remove the style when component unmounts
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Load PayPal when gateway is selected
  useEffect(() => {
    if (
      (selectedGateway === "paypal" || selectedGateway === "card") &&
      tokenPurchaseStep === "payment-method" &&
      !paypalLoaded
    ) {
      // Add a small delay to ensure DOM elements are rendered
      setTimeout(() => {
        loadPaypalPaymentForm();
      }, 100);
    }
  }, [selectedGateway, tokenPurchaseStep, paypalLoaded]);

  // Reset PayPal loaded state when gateway changes
  useEffect(() => {
    if (tokenPurchaseStep === "select-gateway") {
      setPaypalLoaded(false);
      setPaypalContainerReady(false);
      if (paypalInstance) {
        // Clean up existing PayPal instance if it exists
        setPaypalInstance(null);
      }
    }
  }, [selectedGateway, tokenPurchaseStep]);

  return (
    <header className="bg-primarioDark h-15 pt-1 flex items-center justify-between px-6 fixed top-0 left-0 right-0 z-50  border-b pb-2 border-gray-800">
      {/* Project Modal */}
      <PostModal
        isOpen={showProjectModal}
        onClose={handleCloseProjectModal}
        postId={selectedProjectId}
      />

      {/* Notification Post Modal */}
      <PostModal
        isOpen={showNotificationModal}
        onClose={handleCloseNotificationModal}
        postId={selectedNotificationPost?.id}
      />

      {/* Logo y navegación principal */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <img
            src="/logos/logo_reelmotion.webp"
            alt="Reelmotion AI"
            className="h-7 w-auto"
          />
        </div>
      </div>

      {/* Barra de búsqueda central */}
      <div
        className="flex-1 max-w-lg mx-8 bg-darkBoxSub rounded-lg relative"
        ref={searchRef}
      >
        <div className="relative">
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg focus:ring-0 focus:outline-none text-white bg-transparent montserrat-medium wider placeholder-[#808191]"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#808191] h-4 w-4" />
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-gray-400 border-t-[#F2D543] rounded-full animate-spin"></div>
            </div>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showSearchResults && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-darkBoxSub rounded-lg shadow-xl border border-gray-600 max-h-96 overflow-y-auto z-50">
            {searchResults.length > 0 ? (
              <div className="p-2">
                {searchResults.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => handleProjectSelect(project)}
                    className="w-full flex items-center gap-3 px-3 py-3 text-white hover:bg-darkBox transition-colors text-left rounded-lg"
                  >
                    {/* Video thumbnail */}
                    <div className="w-16 h-12 rounded-lg overflow-hidden bg-gray-700 flex items-center justify-center flex-shrink-0">
                      {project.video_url ? (
                        <video
                          src={project.video_url}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                        />
                      ) : (
                        <Play size={20} className="text-gray-400" />
                      )}
                    </div>

                    {/* Project info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white montserrat-medium truncate">
                        {project.name}
                      </p>
                    </div>

                    {/* Arrow indicator */}
                    <ChevronDown className="rotate-[-90deg] text-gray-400 w-4 h-4 flex-shrink-0" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-4 py-3 text-gray-400 text-sm montserrat-light">
                {searchTerm.trim().length < 2
                  ? "Type at least 2 characters to search"
                  : "No projects found"}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controles del usuario */}
      <div className="flex items-center space-x-6">
        {/* Token indicator */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-darkBoxSub px-3 py-1.5 rounded-lg">
            <CreditCard className="h-4 w-4 text-primarioLogo" />
            <span className="text-white text-sm font-medium montserrat-medium">
              Tokens:{" "}
              {isLoadingTokens
                ? "..."
                : Math.floor(tokens).toLocaleString("en-US")}
            </span>
          </div>

          <button
            onClick={handleOpenTokenModal}
            className="px-3 py-1.5 bg-primarioLogo hover:bg-primarioLogo/80 text-white text-xs font-medium rounded-lg transition-colors montserrat-medium"
          >
            <DollarSign className="h-3 w-3 inline-block mr-1 mt-[-2px]" />
            Buy Tokens
          </button>
        </div>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-2 p-2 text-[#808191] rounded-lg transition-colors hover:bg-darkBoxSub"
          >
            {user_info?.image ? (
              <img
                src={user_info.image}
                alt="User Avatar"
                className="h-8 w-8 rounded-full"
              />
            ) : (
              <User className="h-8 w-8 rounded-full" />
            )}
            <span className="text-sm font-medium">{user_info?.name}</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                showUserMenu ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <div className="absolute top-12 right-0 bg-darkBoxSub rounded-lg shadow-lg z-10 min-w-[160px]">
              <Link
                to="/profile"
                className="w-full text-left flex items-center gap-2 px-4 py-3 text-sm text-white montserrat-light hover:bg-darkBox transition-colors rounded-lg"
              >
                <Cog size={16} />
                Settings
              </Link>
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  handleLogOut();
                }}
                className="w-full text-left flex items-center gap-2 px-4 py-3 text-sm text-white montserrat-light hover:bg-darkBox transition-colors rounded-lg"
              >
                <LogOut size={16} />
                Log Out
              </button>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-[#808191] rounded-lg transition-colors hover:bg-darkBoxSub relative"
          >
            <Bell className="h-5 w-5" />
            {notificationsInfo.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {notificationsInfo.length}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute top-12 right-0 bg-darkBoxSub rounded-lg shadow-lg z-10 w-80 max-h-96 overflow-y-auto">
              <div className="p-4 border-b border-gray-600">
                <div className="flex items-center justify-between">
                  <h3 className="text-white montserrat-medium text-sm">
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <span className="text-xs text-[#F2D543] montserrat-light">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notificationsInfo.length > 0 ? (
                  notificationsInfo.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-b border-gray-700 hover:bg-darkBox transition-colors cursor-pointer ${
                        notification.unread ? "bg-darkBox bg-opacity-30" : ""
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        {notification?.other_user?.image ? (
                          <img
                            src={notification?.other_user?.image}
                            alt=""
                            className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
                            <User className="text-gray-200" size={15} />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4
                            className={`text-sm montserrat-medium ${
                              notification.unread
                                ? "text-white"
                                : "text-gray-300"
                            }`}
                          >
                            {notification.type == "post"
                              ? "Discovery"
                              : "Notification"}
                          </h4>
                          <p className="text-xs text-gray-400 montserrat-light mt-1 line-clamp-2">
                            {notification.notification}
                          </p>
                          <span className="text-xs text-gray-500 montserrat-light mt-2 block">
                            {timeAgo(notification.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center">
                    <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm montserrat-light">
                      No notifications yet
                    </p>
                  </div>
                )}
              </div>

              {notificationsInfo.length > 0 && (
                <div className="p-3">
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="w-full text-center text-xs text-[#F2D543] montserrat-light hover:text-[#f2f243] transition-colors"
                  >
                    Mark all as read
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Token Purchase Modal */}
      {showTokenModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-darkBox rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-600">
              <h2 className="text-xl font-semibold text-white montserrat-medium">
                {tokenPurchaseStep === "select-amount" && "Buy Tokens"}
                {tokenPurchaseStep === "select-gateway" &&
                  "Select Payment Gateway"}
                {tokenPurchaseStep === "payment-method" && "Payment Method"}
                {tokenPurchaseStep === "confirm" && "Confirm Purchase"}
                {tokenPurchaseStep === "success" && "Purchase Successful"}
                {tokenPurchaseStep === "error" && "Payment Error"}
              </h2>
              <button
                onClick={handleCloseTokenModal}
                className="text-gray-400 hover:text-white transition-colors text-2xl"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Step 1: Select Amount */}
              {tokenPurchaseStep === "select-amount" && (
                <div className="space-y-6">
                  <p className="text-gray-300 text-sm montserrat-regular">
                    Enter the amount you want to spend. Each dollar gives you
                    100 tokens. Minimum purchase is $6.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        Amount (USD)
                      </label>
                      <input
                        type="number"
                        min="6"
                        step="1"
                        value={purchaseAmount}
                        onChange={handleAmountChange}
                        className="w-full px-4 py-3 bg-darkBoxSub border border-gray-600 rounded-lg text-white text-lg font-medium focus:outline-none focus:border-primarioLogo transition-colors"
                        placeholder="6"
                      />
                    </div>

                    <div className="bg-darkBoxSub p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Amount:</span>
                        <span className="text-white font-medium">
                          ${purchaseAmount}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-gray-400">
                          Tokens you'll receive:
                        </span>
                        <span className="text-primarioLogo font-semibold">
                          {calculateTokens(purchaseAmount)} tokens
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-2 text-sm">
                        <span className="text-gray-500">Rate:</span>
                        <span className="text-gray-500">$1 = 100 tokens</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleContinueToPayment}
                    disabled={purchaseAmount < 6}
                    className="w-full px-4 py-2 bg-primarioLogo text-white rounded-lg hover:bg-primarioLogo/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue to Payment
                  </button>
                </div>
              )}

              {/* Step 2: Select Payment Gateway */}
              {tokenPurchaseStep === "select-gateway" && (
                <div className="space-y-6">
                  <div className="bg-darkBoxSub p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Amount:</span>
                      <span className="text-white font-medium">
                        ${purchaseAmount}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-gray-400">Tokens:</span>
                      <span className="text-primarioLogo font-semibold">
                        {calculateTokens(purchaseAmount)} tokens
                      </span>
                    </div>
                  </div>

                  {/* Payment Gateway Options */}
                  <div className="space-y-3">
                    <h3 className="text-white font-medium montserrat-medium">
                      Choose Payment Method
                    </h3>

                    {/* Credit/Debit Card Option */}
                    <div
                      onClick={() => setSelectedGateway("card")}
                      className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
                        selectedGateway === "card"
                          ? "border-primarioLogo bg-primarioLogo bg-opacity-10"
                          : "border-gray-600 hover:border-gray-500"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                          <CreditCard className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <div className="text-white font-medium">
                            Credit/Debit Card
                          </div>
                          <div className="text-gray-400 text-sm">
                            Pay directly with your card - No account required
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* PayPal Account Option */}
                    <div
                      onClick={() => setSelectedGateway("paypal")}
                      className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
                        selectedGateway === "paypal"
                          ? "border-primarioLogo bg-primarioLogo bg-opacity-10"
                          : "border-gray-600 hover:border-gray-500"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                          <svg
                            className="w-5 h-5 text-white"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 4.814-4.622 6.969-8.956 6.969H8.563c-.34 0-.62.24-.669.566l-.284 1.793-.13.919c-.028.213-.174.339-.386.339z" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-white font-medium">
                            PayPal Account
                          </div>
                          <div className="text-gray-400 text-sm">
                            Login to your PayPal account or create one
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setTokenPurchaseStep("select-amount")}
                      className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setTokenPurchaseStep("payment-method")}
                      className="flex-1 px-4 py-2 bg-primarioLogo text-white rounded-lg hover:bg-primarioLogo/80 transition-colors"
                    >
                      Continue to Payment
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Payment Method */}
              {tokenPurchaseStep === "payment-method" && (
                <div className="space-y-6">
                  <div className="bg-darkBoxSub p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Amount:</span>
                      <span className="text-white font-medium">
                        ${purchaseAmount}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-gray-400">Tokens:</span>
                      <span className="text-primarioLogo font-semibold">
                        {calculateTokens(purchaseAmount)} tokens
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-gray-400">Payment Method:</span>
                      <span className="text-white font-medium capitalize">
                        {selectedGateway === "card"
                          ? "Credit/Debit Card"
                          : "PayPal Account"}
                      </span>
                    </div>
                  </div>

                  {/* Credit/Debit Card Payment Interface */}
                  {selectedGateway === "card" && (
                    <div className="space-y-4">
                      <h3 className="text-white font-medium montserrat-medium">
                        Credit/Debit Card Payment
                      </h3>

                      <div className="bg-darkBoxSub p-4 rounded-lg border border-green-500/30">
                        <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                          <svg
                            className="w-5 h-5 text-green-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                            />
                          </svg>
                          Pay with Credit/Debit Card
                        </h4>

                        {!paypalContainerReady && (
                          <div className="text-center py-4 mb-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primarioLogo mx-auto mb-2"></div>
                            <p className="text-gray-400 text-sm">
                              Loading secure payment form...
                            </p>
                          </div>
                        )}

                        {/* Credit/Debit card button */}
                        <div
                          id="paypal-card-container"
                          className={
                            !paypalContainerReady
                              ? "opacity-50 pointer-events-none"
                              : ""
                          }
                          style={{ minHeight: "50px" }}
                        ></div>

                        <div className="mt-3 text-center">
                          <p className="text-gray-400 text-xs">
                            No PayPal account required - Pay directly with your
                            card
                          </p>
                          <p className="text-gray-400 text-xs mt-1">
                            Secured by PayPal • SSL Encrypted
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => setTokenPurchaseStep("select-gateway")}
                          disabled={isProcessingPayment}
                          className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                        >
                          Back
                        </button>
                      </div>
                    </div>
                  )}

                  {/* PayPal Account Payment Interface */}
                  {selectedGateway === "paypal" && (
                    <div className="space-y-4">
                      <h3 className="text-white font-medium montserrat-medium">
                        PayPal Account Payment
                      </h3>

                      <div className="bg-darkBoxSub p-4 rounded-lg border border-blue-500/30">
                        <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                          <svg
                            className="w-5 h-5 text-blue-500"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 4.814-4.622 6.969-8.956 6.969H8.563c-.34 0-.62.24-.669.566l-.284 1.793-.13.919c-.028.213-.174.339-.386.339z" />
                          </svg>
                          Login to PayPal Account
                        </h4>

                        {!paypalContainerReady && (
                          <div className="text-center py-4 mb-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primarioLogo mx-auto mb-2"></div>
                            <p className="text-gray-400 text-sm">
                              Loading PayPal payment options...
                            </p>
                          </div>
                        )}

                        {/* PayPal account button */}
                        <div
                          id="paypal-button-container"
                          className={
                            !paypalContainerReady
                              ? "opacity-50 pointer-events-none"
                              : ""
                          }
                          style={{ minHeight: "50px" }}
                        ></div>

                        <div className="mt-3 text-center">
                          <p className="text-gray-400 text-xs">
                            Login to your existing PayPal account or create a
                            new one
                          </p>
                          <p className="text-gray-400 text-xs mt-1">
                            Use your PayPal balance or linked bank account
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => setTokenPurchaseStep("select-gateway")}
                          disabled={isProcessingPayment}
                          className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                        >
                          Back
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Success */}
              {tokenPurchaseStep === "success" && (
                <div className="text-center space-y-6">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>

                  <div>
                    <h3 className="text-white text-xl font-semibold montserrat-medium mb-2">
                      Purchase Successful!
                    </h3>
                    <p className="text-gray-300 montserrat-regular">
                      {calculateTokens(purchaseAmount)} tokens have been added
                      to your account.
                    </p>
                  </div>

                  <div className="bg-darkBoxSub p-4 rounded-lg space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Amount Paid:</span>
                      <span className="text-white font-medium">
                        ${paymentDetails?.total_paid || purchaseAmount}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Tokens Received:</span>
                      <span className="text-primarioLogo font-semibold">
                        {paymentDetails?.tokens_added ||
                          calculateTokens(purchaseAmount)}{" "}
                        tokens
                      </span>
                    </div>
                    <div className="border-t border-gray-600 pt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">
                          New Token Balance:
                        </span>
                        <span className="text-primarioLogo font-semibold text-lg">
                          {tokens} tokens
                        </span>
                      </div>
                    </div>
                    {paymentDetails?.payment_intent_id && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Transaction ID:</span>
                        <span className="text-gray-300 text-sm font-mono">
                          {paymentDetails.payment_intent_id.substring(0, 20)}
                          ...
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleCloseTokenModal}
                    className="w-full px-4 py-2 bg-primarioLogo text-white rounded-lg hover:bg-primarioLogo/80 transition-colors"
                  >
                    Continue
                  </button>
                </div>
              )}

              {/* Step 4: Error */}
              {tokenPurchaseStep === "error" && (
                <div className="text-center space-y-6">
                  <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto">
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </div>

                  <div>
                    <h3 className="text-white text-xl font-semibold montserrat-medium mb-2">
                      Payment Failed
                    </h3>
                    <p className="text-gray-300 montserrat-regular mb-4">
                      {paymentMessage}
                    </p>
                  </div>

                  <div className="bg-darkBoxSub p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Attempted Amount:</span>
                      <span className="text-white font-medium">
                        ${purchaseAmount}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Attempted Tokens:</span>
                      <span className="text-gray-300">
                        {calculateTokens(purchaseAmount)} tokens
                      </span>
                    </div>
                    <div className="border-t border-gray-600 pt-2 mt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Current Balance:</span>
                        <span className="text-primarioLogo font-semibold">
                          {tokens} tokens
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setTokenPurchaseStep("select-amount")}
                      className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={handleCloseTokenModal}
                      className="flex-1 px-4 py-2 bg-primarioLogo text-white rounded-lg hover:bg-primarioLogo/80 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default MainTopMenu;
