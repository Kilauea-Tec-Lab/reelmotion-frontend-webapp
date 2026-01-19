import {
  Plus,
  Send,
  Mic,
  Image,
  Video,
  X,
  Copy,
  RotateCw,
  CreditCard,
  DollarSign,
  Bell,
  User,
  Wallet,
  Images,
  Loader2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Pencil,
  Search,
  Square,
  Music,
  Download,
  Check,
} from "lucide-react";
import { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate, useRevalidator } from "react-router-dom";
import Cookies from "js-cookie";
import { getUserNotifications, deleteNotification } from "../../auth/functions";
import { createPusherClient } from "@/pusher";
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
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Channel } from "pusher-js";

// Stripe initialization
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// PayPal configuration
let paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;
let paypalEnvironment = import.meta.env.VITE_PAYPAL_ENVIRONMENT;

// Solana configuration
const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
const connection = new Connection(
  "https://serene-dark-arrow.solana-mainnet.quiknode.pro/b08eae88206de8395ae6c496eaef50f7eee94a4f/",
  {
    commitment: "confirmed",
    confirmTransactionInitialTimeout: 60000,
  },
);

let MERCHANT_WALLET;
try {
  const merchantWalletString = import.meta.env.VITE_MERCHANT_WALLET;
  if (
    !merchantWalletString ||
    merchantWalletString === "YOUR_MERCHANT_WALLET_ADDRESS_HERE"
  ) {
    console.warn("Merchant wallet not configured properly");
    MERCHANT_WALLET = null;
  } else {
    MERCHANT_WALLET = new PublicKey(merchantWalletString);
  }
} catch (error) {
  console.error("Invalid merchant wallet address:", error);
  MERCHANT_WALLET = null;
}

// Card input component with Stripe Elements
function CardInput({ onPaymentProcess, isProcessing, totalAmount }) {
  const stripe = useStripe();
  const elements = useElements();
  const [cardNumberComplete, setCardNumberComplete] = useState(false);
  const [cardExpiryComplete, setCardExpiryComplete] = useState(false);
  const [cardCvcComplete, setCardCvcComplete] = useState(false);
  const [cardErrors, setCardErrors] = useState({});

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
    await onPaymentProcess(stripe, elements);
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="block text-white text-sm font-medium">
          Card Number
        </label>
        <div className="p-4 border border-gray-600 rounded-lg bg-[#2f2f2f]">
          <CardNumberElement
            onChange={handleCardNumberChange}
            options={elementStyle}
          />
        </div>
        {cardErrors.cardNumber && (
          <div className="text-red-400 text-sm">{cardErrors.cardNumber}</div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-white text-sm font-medium">MM/YY</label>
          <div className="p-4 border border-gray-600 rounded-lg bg-[#2f2f2f]">
            <CardExpiryElement
              onChange={handleCardExpiryChange}
              options={elementStyle}
            />
          </div>
          {cardErrors.cardExpiry && (
            <div className="text-red-400 text-sm">{cardErrors.cardExpiry}</div>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-white text-sm font-medium">CVC</label>
          <div className="p-4 border border-gray-600 rounded-lg bg-[#2f2f2f]">
            <CardCvcElement
              onChange={handleCardCvcChange}
              options={elementStyle}
            />
          </div>
          {cardErrors.cardCvc && (
            <div className="text-red-400 text-sm">{cardErrors.cardCvc}</div>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={!stripe || isProcessing || !allFieldsComplete}
        className="w-full px-4 py-2 bg-[#DC569D] text-white rounded-lg hover:bg-[#c9458b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isProcessing && (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        )}
        {isProcessing
          ? "Processing..."
          : !allFieldsComplete
            ? "Enter card details"
            : `Pay $${Number(totalAmount).toFixed(2)}`}
      </button>
    </form>
  );
}

// Crypto payment component with Phantom Wallet
function CryptoInput({ onPaymentProcess, isProcessing, totalAmount }) {
  const [walletAddress, setWalletAddress] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [phantomProvider, setPhantomProvider] = useState(null);

  useEffect(() => {
    const checkPhantom = () => {
      if (window.solana?.isPhantom) {
        setPhantomProvider(window.solana);
      }
    };

    checkPhantom();
    setTimeout(checkPhantom, 1000);
  }, []);

  if (!MERCHANT_WALLET) {
    return (
      <div className="text-center py-6">
        <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h4 className="text-white font-medium mb-2">
          Crypto Payments Unavailable
        </h4>
        <p className="text-gray-400 text-sm">
          Crypto payments are temporarily unavailable.
        </p>
      </div>
    );
  }

  const connectWallet = async () => {
    if (!phantomProvider) return;

    setIsConnecting(true);
    try {
      const resp = await phantomProvider.connect();
      setWalletAddress(resp.publicKey.toString());
    } catch (error) {
      console.error("Wallet connection failed:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    if (phantomProvider) {
      phantomProvider.disconnect();
    }
    setWalletAddress(null);
  };

  const handleCryptoPayment = async () => {
    if (!walletAddress || !phantomProvider) return;

    try {
      await onPaymentProcess(phantomProvider, totalAmount);
    } catch (error) {
      console.error("Payment failed:", error);
    }
  };

  return (
    <div className="space-y-4">
      {!phantomProvider ? (
        <div className="text-center py-6">
          <Wallet className="w-12 h-12 text-purple-500 mx-auto mb-4" />
          <h4 className="text-white font-medium mb-2">
            Phantom Wallet Required
          </h4>
          <p className="text-gray-400 text-sm mb-4">
            You need Phantom wallet to pay with USDC on Solana
          </p>
        </div>
      ) : !walletAddress ? (
        <div className="text-center py-6">
          <Wallet className="w-12 h-12 text-purple-500 mx-auto mb-4" />
          <h4 className="text-white font-medium mb-2">Connect Your Wallet</h4>
          <button
            onClick={connectWallet}
            disabled={isConnecting}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {isConnecting ? "Connecting..." : "Connect Phantom Wallet"}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-gray-700 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-white font-medium">Wallet Connected</h4>
                <p className="text-gray-400 text-sm">
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </p>
              </div>
              <button
                onClick={disconnectWallet}
                className="text-red-400 hover:text-red-300 text-sm"
              >
                Disconnect
              </button>
            </div>
          </div>

          <button
            onClick={handleCryptoPayment}
            disabled={isProcessing}
            className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {isProcessing
              ? "Processing Payment..."
              : `Pay $${Number(totalAmount).toFixed(2)} with USDC`}
          </button>
        </div>
      )}
    </div>
  );
}

function ChatMain({
  selectedChat,
  message,
  onMessageChange,
  onSendMessage,
  onCancel,
  isSending,
  isTyping = false,
  isCreating = false,
  messages = [],
  attachments = [],
}) {
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const selectedChatId =
    typeof selectedChat === "object" ? selectedChat?.id : selectedChat;
  const messagesEndRef = useRef(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const notificationsRef = useRef(null);
  const messageInputRef = useRef(null);
  const shouldAutoSendRef = useRef(false);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewMedia, setPreviewMedia] = useState(null);
  const [hoveredMessageId, setHoveredMessageId] = useState(null);
  const [tokens, setTokens] = useState(0);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsInfo, setNotificationsInfo] = useState([]);

  // Token purchase states
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [tokenPurchaseStep, setTokenPurchaseStep] = useState("select-amount");
  const [purchaseAmount, setPurchaseAmount] = useState(6);
  const [selectedGateway, setSelectedGateway] = useState("card");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");
  const [paymentMessageType, setPaymentMessageType] = useState("");
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [paypalLoaded, setPaypalLoaded] = useState(false);
  const [paypalContainerReady, setPaypalContainerReady] = useState(false);

  // Gallery states
  const [showGallery, setShowGallery] = useState(false);
  const [loadedMedia, setLoadedMedia] = useState(new Set());
  const [galleryFilter, setGalleryFilter] = useState("all"); // "all", "ai", "uploads"
  const [currentGalleryIndex, setCurrentGalleryIndex] = useState(null);
  const [deleteConfirmGallery, setDeleteConfirmGallery] = useState(null);
  const [isDeletingGallery, setIsDeletingGallery] = useState(false);
  const [deletedAttachmentIds, setDeletedAttachmentIds] = useState(new Set());
  const [editingGalleryName, setEditingGalleryName] = useState("");
  const [isEditingGalleryName, setIsEditingGalleryName] = useState(false);
  const [isSavingGalleryName, setIsSavingGalleryName] = useState(false);

  // Delete chat
  const [deleteConfirmChat, setDeleteConfirmChat] = useState(false);
  const [isDeletingChat, setIsDeletingChat] = useState(false);

  // Edit chat title
  const [chatTitle, setChatTitle] = useState(selectedChat?.title || "");
  const [showEditChatModal, setShowEditChatModal] = useState(false);
  const [editChatTitle, setEditChatTitle] = useState("");
  const [isSavingChatTitle, setIsSavingChatTitle] = useState(false);

  // Quick Actions Menu State
  const [quickActionMenu, setQuickActionMenu] = useState("main");
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    // Reset optimistic deletions when switching chats
    setDeletedAttachmentIds(new Set());
    setChatTitle(selectedChat?.title || "");
    setShowEditChatModal(false);
    setEditChatTitle("");
  }, [selectedChatId]);

  const handleSaveChatTitle = async () => {
    if (!selectedChatId) return;
    const nextTitle = editChatTitle.trim();
    if (!nextTitle) return;

    setIsSavingChatTitle(true);
    try {
      const formData = new FormData();
      formData.append("chat_id", selectedChatId);
      formData.append("title", nextTitle);

      const response = await fetch(
        `${import.meta.env.VITE_APP_BACKEND_URL}chat/edit-chat`,
        {
          method: "POST",
          headers: {
            Authorization: "Bearer " + Cookies.get("token"),
          },
          body: formData,
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get("content-type") || "";
      const data = contentType.includes("application/json")
        ? await response.json()
        : {};

      if (data?.success === false) {
        throw new Error(data?.message || "Failed to edit chat");
      }

      setChatTitle(nextTitle);
      setShowEditChatModal(false);
      setEditChatTitle("");
      revalidator.revalidate();
    } catch (error) {
      console.error("Error editing chat:", error);
    } finally {
      setIsSavingChatTitle(false);
    }
  };

  const handleDeleteChat = async () => {
    if (!selectedChat) return;
    setIsDeletingChat(true);
    try {
      const formData = new FormData();
      formData.append("chat_id", selectedChatId);

      const response = await fetch(
        `${import.meta.env.VITE_APP_BACKEND_URL}chat/destroy-chat`,
        {
          method: "POST",
          headers: {
            Authorization: "Bearer " + Cookies.get("token"),
          },
          body: formData,
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get("content-type") || "";
      const data = contentType.includes("application/json")
        ? await response.json()
        : {};

      if (data?.success === false) {
        throw new Error(data?.message || "Failed to delete chat");
      }

      setDeleteConfirmChat(false);
      setShowGallery(false);
      setCurrentGalleryIndex(null);
      setDeleteConfirmGallery(null);

      revalidator.revalidate();
      navigate("/");
    } catch (error) {
      console.error("Error deleting chat:", error);
    } finally {
      setIsDeletingChat(false);
    }
  };

  // Filtrar y ordenar attachments para el gallery
  const filteredAttachments = useMemo(() => {
    // if (!showGallery) return []; // Removed to allow finding index before showing gallery
    return (attachments || []).filter((attachment) => {
      if (deletedAttachmentIds.has(attachment.id)) return false;
      if (galleryFilter === "all") return true;
      if (galleryFilter === "ai") {
        return (
          attachment.path?.includes("generated-images") ||
          attachment.path?.includes("ia") ||
          attachment.path?.includes("veo31-videos") ||
          attachment.path?.includes("sora2-videos") ||
          attachment.url?.includes("generated-images")
        );
      }
      if (galleryFilter === "uploads") {
        return (
          attachment.path?.includes("user") ||
          attachment.path?.includes("chat_attachments")
        );
      }
      return true;
    });
  }, [showGallery, attachments, deletedAttachmentIds, galleryFilter]);

  const sortedAttachments = useMemo(() => {
    return filteredAttachments
      .slice()
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [filteredAttachments]);

  // Funciones de navegación del gallery
  const goToPrevious = () => {
    if (currentGalleryIndex > 0) {
      setCurrentGalleryIndex(currentGalleryIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentGalleryIndex < sortedAttachments.length - 1) {
      setCurrentGalleryIndex(currentGalleryIndex + 1);
    }
  };

  // Keyboard navigation para gallery
  useEffect(() => {
    if (currentGalleryIndex === null) return;

    const handleKeyPress = (e) => {
      if (e.key === "ArrowLeft") {
        goToPrevious();
      } else if (e.key === "ArrowRight") {
        goToNext();
      } else if (e.key === "Escape") {
        setCurrentGalleryIndex(null);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentGalleryIndex, sortedAttachments.length]);

  const currentAttachment =
    currentGalleryIndex !== null
      ? sortedAttachments[currentGalleryIndex]
      : null;

  const handleDownload = async (e, url) => {
    e.stopPropagation();
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Network response was not ok");
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      const mimeType = blob.type;
      const extension = mimeType.split("/")[1] || "bin";
      link.download = `media-${Date.now()}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed:", error);
      window.open(url, "_blank");
    }
  };

  const handleSaveGalleryAttachmentName = async () => {
    if (!currentAttachment || !editingGalleryName.trim()) return;
    setIsSavingGalleryName(true);
    try {
      const formData = new FormData();
      formData.append("attachment_id", currentAttachment.id);
      formData.append("name", editingGalleryName.trim());

      const response = await fetch(
        `${import.meta.env.VITE_APP_BACKEND_URL}chat/update-attachment-name`,
        {
          method: "POST",
          headers: {
            Authorization: "Bearer " + Cookies.get("token"),
          },
          body: formData,
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // Actualizar optimísticamente
        setDeletedAttachmentIds((prev) => {
          const updated = new Set(prev);
          return updated;
        });
        setIsEditingGalleryName(false);
        // Revalidar para obtener datos actualizados
        revalidator.revalidate();
      }
    } catch (error) {
      console.error("Error saving attachment name:", error);
    } finally {
      setIsSavingGalleryName(false);
    }
  };

  const handleStartEditingGalleryName = () => {
    setEditingGalleryName(currentAttachment?.name || "");
    setIsEditingGalleryName(true);
  };

  const handleCancelEditingGalleryName = () => {
    setIsEditingGalleryName(false);
    setEditingGalleryName("");
  };

  // Reset editing state when changing attachment
  useEffect(() => {
    setIsEditingGalleryName(false);
    setEditingGalleryName("");
  }, [currentGalleryIndex]);

  // Función para eliminar attachment del gallery
  const handleDeleteGalleryAttachment = async (attachmentId) => {
    setIsDeletingGallery(true);
    try {
      const formData = new FormData();
      formData.append("attachment_id", attachmentId);

      const response = await fetch(
        `${import.meta.env.VITE_APP_BACKEND_URL}chat/destroy-attachment`,
        {
          method: "POST",
          headers: {
            Authorization: "Bearer " + Cookies.get("token"),
          },
          body: formData,
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setDeleteConfirmGallery(null);

        // Eliminar el attachment del estado local del gallery (optimistic)
        setDeletedAttachmentIds((prev) => {
          const next = new Set(prev);
          next.add(attachmentId);
          return next;
        });

        // Si estamos en preview y eliminamos el actual, cerrar el preview
        if (currentAttachment?.id === attachmentId) {
          setCurrentGalleryIndex(null);
        }
      }
    } catch (error) {
      console.error("Error deleting attachment:", error);
    } finally {
      setIsDeletingGallery(false);
    }
  };

  // Crear instancia de Pusher
  const pusherClient = useMemo(() => {
    return createPusherClient();
  }, []);

  // Total de notificaciones
  const unreadCount = notificationsInfo.length;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Obtener notificaciones
  const getNotifications = async () => {
    const response = await getUserNotifications();
    const notifications = response?.data || [];
    setNotificationsInfo(Array.isArray(notifications) ? notifications : []);
  };

  // Helper function to format date
  function timeAgo(dateString) {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHrs / 24);

    if (diffMins < 1) return "hace menos de 1 min";
    if (diffMins < 60) return `hace ${diffMins} min`;
    if (diffHrs < 24) return `hace ${diffHrs} ${diffHrs === 1 ? "hr" : "hrs"}`;
    return `hace ${diffDays} ${diffDays === 1 ? "día" : "días"}`;
  }

  // Manejar click en notificación
  const handleNotificationClick = async (notification) => {
    await deleteNotification(notification.id);
    setNotificationsInfo((prev) =>
      prev.filter((n) => n.id !== notification.id),
    );
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Cerrar notificaciones cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch user tokens
  const fetchUserTokens = async () => {
    setIsLoadingTokens(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_APP_BACKEND_URL}users/tokens`,
        {
          headers: {
            Authorization: "Bearer " + Cookies.get("token"),
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setTokens(data.data || 0);
      }
    } catch (error) {
      console.error("Error fetching tokens:", error);
    } finally {
      setIsLoadingTokens(false);
    }
  };

  useEffect(() => {
    fetchUserTokens();
  }, []);

  // Socket para notificaciones
  useEffect(() => {
    if (!pusherClient || !selectedChat?.user_owner_id) return;

    const channel = pusherClient.subscribe(
      `private-get-notifications.${selectedChat.user_owner_id}`,
    );

    channel.bind("fill-notifications", () => {
      getNotifications();
    });

    return () => {
      channel.unbind("fill-notifications");
      pusherClient.unsubscribe(
        `private-get-notifications.${selectedChat.user_owner_id}`,
      );
    };
  }, [pusherClient, selectedChat?.user_owner_id]);

  // Socket para tokens
  useEffect(() => {
    if (!pusherClient || !selectedChat?.user_owner_id) return;

    const userId = selectedChat.user_owner_id;
    const channel = pusherClient.subscribe(`private-get-user-tokens.${userId}`);

    const handleTokenUpdate = () => {
      fetchUserTokens();
    };

    channel.bind("fill-user-tokens", handleTokenUpdate);

    return () => {
      channel.unbind("fill-user-tokens", handleTokenUpdate);
      pusherClient.unsubscribe(`private-get-user-tokens.${userId}`);
    };
  }, [pusherClient, selectedChat?.user_owner_id]);

  // Obtener notificaciones al montar el componente
  useEffect(() => {
    getNotifications();
  }, []);

  // Hacer focus en el input después de enviar mensaje
  useEffect(() => {
    if (!isSending && messageInputRef.current) {
      messageInputRef.current.focus();
    }
  }, [isSending]);

  // Hacer focus en el input después de enviar mensaje
  useEffect(() => {
    if (!isSending && messageInputRef.current) {
      messageInputRef.current.focus();
    }
  }, [isSending]);

  // Hacer focus en el input después de enviar mensaje
  useEffect(() => {
    if (!isSending && messageInputRef.current) {
      messageInputRef.current.focus();
    }
  }, [isSending]);

  // Auto-enviar mensaje cuando se usa un quick action
  useEffect(() => {
    if (shouldAutoSendRef.current && message && !isSending) {
      shouldAutoSendRef.current = false;
      onSendMessage([]);
    }
  }, [message, isSending, onSendMessage]);

  const handleQuickAction = (messageText) => {
    onMessageChange(messageText);
    shouldAutoSendRef.current = true;
  };

  const handleResendMessage = (msg) => {
    // Solo copiar el contenido del mensaje si es del usuario
    if (msg.role === "user") {
      onMessageChange(msg.content);
    }

    // Copiar los attachments como URLs
    if (msg.attachments && msg.attachments.length > 0) {
      const fileAttachments = msg.attachments.map((attachment) => ({
        url: attachment.url,
        type: attachment.file_type,
        isUrl: true, // Marcar que es URL, no archivo
      }));
      setSelectedFiles(fileAttachments);
    }
  };

  const handleCopyToClipboard = async (msg) => {
    try {
      await navigator.clipboard.writeText(msg.content);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  const handleFileSelect = (type) => {
    setShowFileMenu(false);
    if (type === "image") {
      imageInputRef.current?.click();
    } else if (type === "video") {
      // Check if video already exists
      const hasVideo = selectedFiles.some((f) => f.type === "video");
      if (hasVideo) {
        // Optional: Alert user or just replace. Let's replace for better UX or just ignore.
        // For now, let's allow clicking, and handle replacement in change handler
        // or prevent if strict. User said "solo un video".
        // Let's allow opening dialog, and if they select one, we replace the existing one?
        // Or maybe just block.
        // Let's block with a simple alert for now or just don't open.
        // Actually, replacing is usually better UX.
      }
      videoInputRef.current?.click();
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const newFiles = files.map((file) => ({
      file,
      type: "image",
      preview: URL.createObjectURL(file),
    }));

    setSelectedFiles((prev) => [...prev, ...newFiles]);
    e.target.value = "";
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const newVideo = {
      file,
      type: "video",
      preview: URL.createObjectURL(file),
    };

    setSelectedFiles((prev) => {
      // Remove existing video if any
      const filtered = prev.filter((f) => f.type !== "video");
      return [...filtered, newVideo];
    });
    e.target.value = "";
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if the related target is still within the container
    if (e.currentTarget.contains(e.relatedTarget)) return;

    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const newFiles = [];
    let newVideo = null;

    files.forEach((file) => {
      if (file.type.startsWith("image/")) {
        newFiles.push({
          file,
          type: "image",
          preview: URL.createObjectURL(file),
        });
      } else if (file.type.startsWith("video/")) {
        // Just take the last video found if multiple
        newVideo = {
          file,
          type: "video",
          preview: URL.createObjectURL(file),
        };
      }
    });

    if (newFiles.length === 0 && !newVideo) return;

    setSelectedFiles((prev) => {
      let updated = [...prev];

      // If we have a new video, replace existing one
      if (newVideo) {
        updated = updated.filter((f) => f.type !== "video");
        updated.push(newVideo);
      }

      // Add new images
      if (newFiles.length > 0) {
        updated = [...updated, ...newFiles];
      }

      return updated;
    });
  };

  const handleSendWithFiles = () => {
    // Separar archivos y URLs
    const fileUploads = selectedFiles.filter((f) => !f.isUrl);
    const urlAttachments = selectedFiles.filter((f) => f.isUrl);

    // Preparar los datos para enviar
    const attachmentData = {
      files: fileUploads,
      attachments_image_url: urlAttachments
        .filter((a) => a.type === "image")
        .map((a) => a.url),
      attachment_video_url: urlAttachments
        .filter((a) => a.type === "video")
        .map((a) => a.url),
    };

    onSendMessage(attachmentData);
    setSelectedFiles([]);
  };

  // Token management functions
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

  const calculateTokens = (dollars) => dollars * 100;

  const calculateVAT = (amount) => {
    const vatRate = 0.2;
    return Number((amount * vatRate).toFixed(2));
  };

  const calculateTotalWithVAT = (baseAmount) => {
    const vat = calculateVAT(baseAmount);
    return Number((baseAmount + vat).toFixed(2));
  };

  const getPaymentBreakdown = (baseAmount) => {
    const subtotal = Number(baseAmount) || 0;
    const vat = calculateVAT(subtotal);
    const total = calculateTotalWithVAT(subtotal);
    const tokens = calculateTokens(subtotal);

    return {
      subtotal,
      vat,
      total,
      tokens,
    };
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    if (value === "" || (!isNaN(value) && Number(value) >= 0)) {
      setPurchaseAmount(value);
    }
  };

  const handleAmountBlur = () => {
    if (purchaseAmount === "" || Number(purchaseAmount) < 6) {
      setPurchaseAmount(6);
    }
  };

  const handleContinueToPayment = () => {
    const amount = Number(purchaseAmount);
    if (amount >= 6) {
      setTokenPurchaseStep("select-gateway");
    }
  };

  const handleStripePayment = async (stripe, elements) => {
    setIsProcessingPayment(true);
    setPaymentMessage("");

    try {
      const breakdown = getPaymentBreakdown(Number(purchaseAmount) || 0);

      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: elements.getElement(CardNumberElement),
      });

      if (error) {
        setPaymentMessage(error.message);
        setTokenPurchaseStep("error");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_APP_BACKEND_URL}payments/stripe/process`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + Cookies.get("token"),
          },
          body: JSON.stringify({
            payment_method_id: paymentMethod.id,
            amount: breakdown.total,
            tokens: breakdown.tokens,
          }),
        },
      );

      const result = await response.json();

      if (result.success) {
        setPaymentDetails(result.data);
        setTokens((prev) => prev + breakdown.tokens);
        setTokenPurchaseStep("success");
      } else {
        setPaymentMessage(result.message || "Payment failed");
        setTokenPurchaseStep("error");
      }
    } catch (error) {
      setPaymentMessage("An error occurred during payment");
      setTokenPurchaseStep("error");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleCryptoPayment = async (phantomProvider, totalAmount) => {
    setIsProcessingPayment(true);
    try {
      // Implementation would go here
      setPaymentMessage("Crypto payment not fully implemented");
      setTokenPurchaseStep("error");
    } catch (error) {
      setPaymentMessage("Crypto payment failed");
      setTokenPurchaseStep("error");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <div
      className="flex-1 flex flex-col relative"
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="absolute inset-0 z-[100] bg-black/60 backdrop-blur-sm border-4 border-dashed border-[#DC569D] m-4 rounded-2xl flex flex-col items-center justify-center pointer-events-none">
          <div className="bg-[#2f2f2f] p-8 rounded-2xl flex flex-col items-center gap-4 border border-gray-700 shadow-2xl">
            <div className="bg-[#DC569D]/20 p-4 rounded-full">
              <Images className="w-12 h-12 text-[#DC569D]" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold text-white mb-1">
                Drop files here
              </h3>
              <p className="text-gray-400">Upload images or videos</p>
            </div>
          </div>
        </div>
      )}
      {/* Edit Chat Modal */}
      {showEditChatModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[80] flex items-center justify-center p-4"
          onClick={() => !isSavingChatTitle && setShowEditChatModal(false)}
        >
          <div
            className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-[#DC569D]/20 rounded-full p-3">
                <Pencil className="h-6 w-6 text-[#DC569D]" />
              </div>
              <h3 className="text-xl font-semibold text-white">Edit Chat</h3>
            </div>

            <label className="block text-sm text-gray-400 mb-2">
              Chat name
            </label>
            <input
              type="text"
              value={editChatTitle}
              onChange={(e) => setEditChatTitle(e.target.value)}
              className="w-full px-4 py-2 bg-[#2f2f2f] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#DC569D] focus:ring-1 focus:ring-[#DC569D] transition-all"
              placeholder="Enter chat name"
              autoFocus
            />

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setShowEditChatModal(false)}
                disabled={isSavingChatTitle}
                className="px-4 py-2 bg-[#2f2f2f] text-gray-300 rounded-lg hover:bg-[#3a3a3a] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveChatTitle}
                disabled={isSavingChatTitle || editChatTitle.trim() === ""}
                className="px-4 py-2 bg-[#DC569D] text-white rounded-lg hover:bg-[#c44a87] transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSavingChatTitle ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Pencil className="h-4 w-4" />
                    Save
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal for Chat */}
      {deleteConfirmChat && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[80] flex items-center justify-center p-4"
          onClick={() => !isDeletingChat && setDeleteConfirmChat(false)}
        >
          <div
            className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-[#DC569D]/20 rounded-full p-3">
                <Trash2 className="h-6 w-6 text-[#DC569D]" />
              </div>
              <h3 className="text-xl font-semibold text-white">Delete Chat</h3>
            </div>
            <p className="text-gray-400 mb-6">
              Are you sure you want to delete this chat? This action cannot be
              undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirmChat(false)}
                disabled={isDeletingChat}
                className="px-4 py-2 bg-[#2f2f2f] text-gray-300 rounded-lg hover:bg-[#3a3a3a] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteChat}
                disabled={isDeletingChat}
                className="px-4 py-2 bg-[#DC569D] text-white rounded-lg hover:bg-[#c44a87] transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isDeletingChat ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal for Gallery */}
      {deleteConfirmGallery && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
          onClick={() => !isDeletingGallery && setDeleteConfirmGallery(null)}
        >
          <div
            className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-[#DC569D]/20 rounded-full p-3">
                <Trash2 className="h-6 w-6 text-[#DC569D]" />
              </div>
              <h3 className="text-xl font-semibold text-white">
                Delete Attachment
              </h3>
            </div>
            <p className="text-gray-400 mb-6">
              Are you sure you want to delete this attachment? This action
              cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirmGallery(null)}
                disabled={isDeletingGallery}
                className="px-4 py-2 bg-[#2f2f2f] text-gray-300 rounded-lg hover:bg-[#3a3a3a] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  handleDeleteGalleryAttachment(deleteConfirmGallery)
                }
                disabled={isDeletingGallery}
                className="px-4 py-2 bg-[#DC569D] text-white rounded-lg hover:bg-[#c44a87] transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isDeletingGallery ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Media Preview Modal */}
      {previewMedia && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onClick={() => setPreviewMedia(null)}
        >
          <button
            onClick={() => setPreviewMedia(null)}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 z-10 transition-colors"
          >
            <X size={24} />
          </button>

          {previewMedia.type === "image" ? (
            <div
              className="relative w-full h-full flex items-center justify-center pointer-events-none select-none"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={previewMedia.url}
                alt="Preview"
                className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg shadow-2xl pointer-events-auto"
              />
            </div>
          ) : previewMedia.type === "audio" ? (
            <div
              className="max-w-3xl w-full bg-[#1a1a1a] p-8 rounded-2xl border border-gray-800 flex flex-col items-center gap-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-24 h-24 bg-[#2f2f2f] rounded-full flex items-center justify-center">
                <Music className="w-12 h-12 text-[#DC569D]" />
              </div>
              <audio
                src={previewMedia.url}
                className="w-full"
                controls
                autoPlay
              />
            </div>
          ) : (
            <div
              className="max-w-7xl w-full max-h-[90vh] overflow-hidden flex items-center justify-center bg-black/50 rounded-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <video
                src={previewMedia.url}
                className="max-w-full max-h-[85vh] rounded-lg"
                controls
                autoPlay
              />
            </div>
          )}
        </div>
      )}

      {/* Gallery Preview Modal - Works independently */}
      {currentAttachment && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-2xl z-[100] flex items-center justify-center p-4"
          onClick={() => setCurrentGalleryIndex(null)}
        >
          {/* Download Button */}
          <button
            onClick={(e) => handleDownload(e, currentAttachment.url)}
            className="absolute top-4 right-16 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 z-20 transition-colors"
            title="Download"
          >
            <Download size={24} />
          </button>

          {/* Close Button */}
          <button
            onClick={() => setCurrentGalleryIndex(null)}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 z-20 transition-colors"
          >
            <X size={24} />
          </button>

          {/* Previous Button */}
          {currentGalleryIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full p-3 z-20 transition-all shadow-lg text-white"
            >
              <ChevronLeft size={32} />
            </button>
          )}

          {/* Next Button */}
          {currentGalleryIndex < sortedAttachments.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full p-3 z-20 transition-all shadow-lg text-white"
            >
              <ChevronRight size={32} />
            </button>
          )}

          {/* Media Content */}
          {currentAttachment.file_type === "image" ? (
            <div
              className="relative w-full h-full flex items-center justify-center pointer-events-none select-none"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={currentAttachment.url}
                alt="Preview"
                className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg shadow-2xl pointer-events-auto"
              />
            </div>
          ) : currentAttachment.file_type === "audio" ? (
            <div
              className="max-w-3xl w-full bg-[#1a1a1a] p-8 rounded-2xl border border-gray-800 flex flex-col items-center gap-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-24 h-24 bg-[#2f2f2f] rounded-full flex items-center justify-center">
                <Music className="w-12 h-12 text-[#DC569D]" />
              </div>
              <audio
                src={currentAttachment.url}
                className="w-full"
                controls
                autoPlay
              />
            </div>
          ) : (
            <div
              className="max-w-7xl w-full max-h-[90vh] overflow-hidden flex items-center justify-center bg-black/50 rounded-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <video
                src={currentAttachment.url}
                className="max-w-full max-h-[85vh] rounded-lg"
                controls
                autoPlay
              />
            </div>
          )}

          {/* Counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm rounded-full px-4 py-2 z-20 transition-opacity hover:opacity-100">
            <p className="text-white text-sm font-medium">
              {currentGalleryIndex + 1} / {sortedAttachments.length}
            </p>
          </div>

          {/* Name Editor */}
          <div
            className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 w-full max-w-md px-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-black/60 backdrop-blur-sm rounded-lg p-3">
              {isEditingGalleryName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editingGalleryName}
                    onChange={(e) => setEditingGalleryName(e.target.value)}
                    className="flex-1 px-3 py-2 bg-[#2f2f2f] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#DC569D] focus:ring-1 focus:ring-[#DC569D] transition-all text-sm"
                    placeholder="Enter file name..."
                    maxLength={255}
                    autoFocus
                  />
                  <button
                    onClick={handleSaveGalleryAttachmentName}
                    disabled={isSavingGalleryName || !editingGalleryName.trim()}
                    className="px-3 py-2 bg-[#DC569D] text-white rounded-lg hover:bg-[#c44a87] transition-colors disabled:opacity-50 flex items-center gap-1"
                  >
                    {isSavingGalleryName ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={handleCancelEditingGalleryName}
                    disabled={isSavingGalleryName}
                    className="px-3 py-2 bg-[#2f2f2f] text-gray-300 rounded-lg hover:bg-[#3a3a3a] transition-colors disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <p className="text-white text-sm font-medium truncate">
                    {currentAttachment.name || "Unnamed file"}
                  </p>
                  <button
                    onClick={handleStartEditingGalleryName}
                    className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                    title="Edit name"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Gallery Grid Modal */}
      {showGallery && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => setShowGallery(false)}
        >
          <div
            className="bg-[#1a1a1a] rounded-xl border border-gray-800 w-full max-w-5xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Gallery Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <Images className="h-6 w-6 text-[#DC569D]" />
                <h3 className="text-xl font-semibold text-white">
                  Media Gallery
                </h3>
                <span className="text-sm text-gray-400">
                  ({filteredAttachments.length} items)
                </span>
              </div>
              <button
                onClick={() => setShowGallery(false)}
                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-[#2f2f2f] rounded-lg"
              >
                <X size={24} />
              </button>
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2 p-4 border-b border-gray-800">
              <button
                onClick={() => setGalleryFilter("all")}
                className={`px-4 py-2 rounded-lg transition-all font-medium ${
                  galleryFilter === "all"
                    ? "bg-[#DC569D] text-white"
                    : "bg-[#2f2f2f] text-gray-400 hover:bg-[#3a3a3a] hover:text-white"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setGalleryFilter("ai")}
                className={`px-4 py-2 rounded-lg transition-all font-medium flex items-center gap-2 ${
                  galleryFilter === "ai"
                    ? "bg-[#DC569D] text-white"
                    : "bg-[#2f2f2f] text-gray-400 hover:bg-[#3a3a3a] hover:text-white"
                }`}
              >
                <Sparkles className="h-4 w-4" />
                Generated by AI
              </button>
              <button
                onClick={() => setGalleryFilter("uploads")}
                className={`px-4 py-2 rounded-lg transition-all font-medium ${
                  galleryFilter === "uploads"
                    ? "bg-[#DC569D] text-white"
                    : "bg-[#2f2f2f] text-gray-400 hover:bg-[#3a3a3a] hover:text-white"
                }`}
              >
                Uploads
              </button>
            </div>

            {/* Gallery Grid */}
            <div className="flex-1 overflow-y-auto p-4">
              {sortedAttachments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <Images className="h-16 w-16 mb-4 opacity-50" />
                  <p>No media files in this category</p>
                </div>
              ) : (
                <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
                  {sortedAttachments.map((attachment, idx) => {
                    const isAIGenerated =
                      attachment.path?.includes("generated-images") ||
                      attachment.path?.includes("ia") ||
                      attachment.path?.includes("veo31-videos") ||
                      attachment.path?.includes("sora2-videos") ||
                      attachment.url?.includes("generated-images");

                    return (
                      <div
                        key={attachment.id || idx}
                        onClick={() => setCurrentGalleryIndex(idx)}
                        className={`relative bg-[#2f2f2f] rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-[#DC569D] transition-all group break-inside-avoid mb-4 ${
                          !loadedMedia.has(attachment.id) ? "min-h-[160px]" : ""
                        }`}
                      >
                        {/* Delete Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmGallery(attachment.id);
                          }}
                          className="absolute top-2 left-2 z-10 bg-[#DC569D]/90 hover:bg-[#c44a87] backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-4 w-4 text-white" />
                        </button>

                        {/* AI Badge */}
                        {isAIGenerated && (
                          <div className="absolute top-2 right-2 z-10 bg-[#DC569D] rounded-full p-1.5">
                            <Sparkles className="h-3 w-3 text-white" />
                          </div>
                        )}

                        {/* Loading State */}
                        {!loadedMedia.has(attachment.id) &&
                          attachment.file_type !== "audio" && (
                            <div className="absolute inset-0 flex items-center justify-center bg-[#2f2f2f]">
                              <Loader2 className="h-8 w-8 text-[#DC569D] animate-spin" />
                            </div>
                          )}

                        {/* Media Content */}
                        <div>
                          {attachment.file_type === "image" ? (
                            <img
                              src={attachment.url}
                              alt="Gallery item"
                              loading="lazy"
                              className={`w-full h-auto block transition-opacity duration-300 ${
                                loadedMedia.has(attachment.id)
                                  ? "opacity-100"
                                  : "opacity-0"
                              }`}
                              onLoad={() => {
                                setLoadedMedia((prev) =>
                                  new Set(prev).add(attachment.id),
                                );
                              }}
                            />
                          ) : attachment.file_type === "video" ? (
                            <video
                              src={attachment.url}
                              loading="lazy"
                              className={`w-full h-auto block transition-opacity duration-300 ${
                                loadedMedia.has(attachment.id)
                                  ? "opacity-100"
                                  : "opacity-0"
                              }`}
                              muted
                              playsInline
                              onLoadedData={() => {
                                setLoadedMedia((prev) =>
                                  new Set(prev).add(attachment.id),
                                );
                              }}
                            />
                          ) : attachment.file_type === "audio" ? (
                            <div className="w-full aspect-square flex flex-col items-center justify-center bg-[#1a1a1a] p-4 text-center group-hover:bg-[#252525] transition-colors">
                              <div className="w-12 h-12 bg-[#2f2f2f] rounded-full flex items-center justify-center mb-3">
                                <Music className="h-6 w-6 text-[#DC569D]" />
                              </div>
                              <span className="text-sm text-gray-400 font-medium truncate w-full px-2">
                                Audio File
                              </span>
                            </div>
                          ) : null}
                        </div>

                        {/* Overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            {attachment.file_type === "video" && (
                              <Video className="h-8 w-8 text-white" />
                            )}
                            {attachment.file_type === "audio" && (
                              <Music className="h-8 w-8 text-white" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedChat ? (
        <>
          {/* Chat Header */}
          <div className="h-16 border-b border-gray-800 flex items-center justify-between px-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDeleteConfirmChat(true)}
                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-[#2f2f2f] rounded-lg"
                title="Delete chat"
              >
                <Trash2 size={20} />
              </button>

              <button
                onClick={() => {
                  setEditChatTitle(chatTitle || selectedChat?.title || "");
                  setShowEditChatModal(true);
                }}
                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-[#2f2f2f] rounded-lg"
                title="Edit chat"
              >
                <Pencil size={20} />
              </button>

              <button
                onClick={() => setShowGallery(true)}
                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-[#2f2f2f] rounded-lg"
                title="View Gallery"
              >
                <Images size={20} />
              </button>
              <h2 className="text-lg font-semibold">{chatTitle}</h2>
            </div>

            {/* Tokens y Notificaciones */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-[#2f2f2f] px-3 py-1.5 rounded-lg">
                <CreditCard className="h-4 w-4 text-[#DC569D]" />
                <span className="text-white text-sm font-medium">
                  Tokens:{" "}
                  {isLoadingTokens
                    ? "..."
                    : Math.floor(tokens).toLocaleString("en-US")}
                </span>
              </div>

              <button
                onClick={handleOpenTokenModal}
                className="px-3 py-1.5 bg-[#DC569D] hover:bg-[#c9458b] text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
              >
                <DollarSign className="h-3 w-3" />
                Buy Tokens
              </button>

              {/* Notificaciones */}
              <div className="relative" ref={notificationsRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-gray-400 hover:text-white transition-colors hover:bg-[#2f2f2f] rounded-lg"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[#DC569D] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Dropdown de Notificaciones */}
                {showNotifications && (
                  <div className="absolute top-12 right-0 bg-[#2f2f2f] rounded-lg shadow-xl border border-gray-700 w-80 max-h-96 overflow-y-auto z-50">
                    <div className="p-3 border-b border-gray-700">
                      <h3 className="text-white font-medium">Notifications</h3>
                    </div>
                    {notificationsInfo.length > 0 ? (
                      <div className="py-2">
                        {notificationsInfo.map((notif) => (
                          <button
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            className="w-full px-4 py-3 hover:bg-[#3a3a3a] transition-colors text-left border-b border-gray-800"
                          >
                            <div className="flex items-start gap-3">
                              {notif.other_user?.image ? (
                                <img
                                  src={notif.other_user.image}
                                  alt="User"
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                                  <User className="h-4 w-4 text-gray-400" />
                                </div>
                              )}
                              <div className="flex-1">
                                <p className="text-white text-sm">
                                  {notif.notification}
                                </p>
                                <p className="text-gray-400 text-xs mt-1">
                                  {timeAgo(notif.created_at)}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="px-4 py-8 text-center text-gray-400 text-sm">
                        No notifications
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto space-y-4">
              {messages.length > 0 ? (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                    onMouseEnter={() => setHoveredMessageId(msg.id)}
                    onMouseLeave={() => setHoveredMessageId(null)}
                  >
                    <div
                      className={`flex flex-col gap-2 max-w-[80%] relative ${
                        msg.role === "user" ? "items-end" : "items-start"
                      }`}
                    >
                      {/* Botones de acción */}
                      {hoveredMessageId === msg.id && (
                        <div className="absolute -top-2 -right-2 flex gap-1 z-10">
                          <button
                            onClick={() => handleCopyToClipboard(msg)}
                            className="bg-gray-700 hover:bg-gray-600 rounded-full p-1.5 transition-colors"
                            title="Copy to clipboard"
                          >
                            <Copy size={14} className="text-white" />
                          </button>
                          <button
                            onClick={() => handleResendMessage(msg)}
                            className="bg-gray-700 hover:bg-gray-600 rounded-full p-1.5 transition-colors"
                            title="Resend message"
                          >
                            <RotateCw size={14} className="text-white" />
                          </button>
                        </div>
                      )}
                      {/* Attachments */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {msg.attachments.map((attachment, idx) => (
                            <div
                              key={idx}
                              className="relative cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => {
                                // Switch filter to all to ensure we find it
                                if (galleryFilter !== "all")
                                  setGalleryFilter("all");

                                // Find in the FULL sorted list (simulating 'all' view)
                                const allFiltered = (attachments || []).filter(
                                  (a) => !deletedAttachmentIds.has(a.id),
                                );
                                const allSorted = allFiltered.sort(
                                  (a, b) =>
                                    new Date(b.created_at) -
                                    new Date(a.created_at),
                                );

                                const index = allSorted.findIndex(
                                  (a) => a.id === attachment.id,
                                );

                                if (index !== -1) {
                                  setCurrentGalleryIndex(index);
                                  // Don't open gallery grid, just the preview
                                } else {
                                  setPreviewMedia({
                                    url: attachment.url,
                                    type: attachment.file_type,
                                  });
                                }
                              }}
                            >
                              {attachment.file_type === "image" ? (
                                <img
                                  src={attachment.url}
                                  alt="Attachment"
                                  className="h-32 w-auto rounded-lg border border-gray-600 object-cover"
                                />
                              ) : attachment.file_type === "video" ? (
                                <video
                                  src={attachment.url}
                                  className="h-32 w-auto rounded-lg border border-gray-600 object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                  autoPlay
                                  loop
                                  muted
                                  playsInline
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Switch filter to all to ensure we find it
                                    if (galleryFilter !== "all")
                                      setGalleryFilter("all");

                                    // Find in the FULL sorted list (simulating 'all' view)
                                    const allFiltered = (
                                      attachments || []
                                    ).filter(
                                      (a) => !deletedAttachmentIds.has(a.id),
                                    );
                                    const allSorted = allFiltered.sort(
                                      (a, b) =>
                                        new Date(b.created_at) -
                                        new Date(a.created_at),
                                    );

                                    const index = allSorted.findIndex(
                                      (a) => a.id === attachment.id,
                                    );

                                    if (index !== -1) {
                                      setCurrentGalleryIndex(index);
                                      // Don't open gallery grid, just the preview
                                    } else {
                                      setPreviewMedia({
                                        url: attachment.url,
                                        type: attachment.file_type,
                                      });
                                    }
                                  }}
                                />
                              ) : attachment.file_type === "audio" ? (
                                <div
                                  className="flex items-center justify-center bg-[#2f2f2f] rounded-lg border border-gray-600 p-2 min-w-[260px] cursor-default"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <audio
                                    src={attachment.url}
                                    controls
                                    className="w-full h-10"
                                  />
                                </div>
                              ) : attachment.file_type === "audio" ? (
                                <div
                                  className="flex items-center justify-center bg-[#2f2f2f] rounded-lg border border-gray-600 p-2 min-w-[260px] cursor-default"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <audio
                                    src={attachment.url}
                                    controls
                                    className="w-full h-10"
                                  />
                                </div>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      )}
                      <div
                        className={`rounded-2xl px-4 py-3 ${
                          msg.role === "user"
                            ? "bg-[#DC569D] text-white"
                            : "bg-[#2f2f2f] text-white"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center">
                  Start the conversation
                </p>
              )}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-[#2f2f2f] rounded-2xl px-4 py-3">
                    <div className="flex gap-1">
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-800 p-4">
            <div className="max-w-4xl mx-auto">
              {/* File Previews */}
              {selectedFiles.length > 0 && (
                <div className="mb-3 flex gap-3 overflow-x-auto pb-2">
                  {selectedFiles.map((fileObj, index) => (
                    <div key={index} className="relative flex-shrink-0">
                      <button
                        onClick={() => handleRemoveFile(index)}
                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 rounded-full p-1 z-10"
                      >
                        <X size={14} />
                      </button>
                      {fileObj.type === "image" ? (
                        <img
                          src={fileObj.isUrl ? fileObj.url : fileObj.preview}
                          alt="Preview"
                          className="h-24 w-24 object-cover rounded-lg border border-gray-700"
                        />
                      ) : (
                        <video
                          src={fileObj.isUrl ? fileObj.url : fileObj.preview}
                          className="h-24 w-24 object-cover rounded-lg border border-gray-700"
                          muted
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-3 bg-[#2f2f2f] rounded-2xl px-4 py-3 border border-gray-700 relative">
                <div className="relative">
                  <button
                    onClick={() => setShowFileMenu(!showFileMenu)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <Plus size={20} />
                  </button>
                  {showFileMenu && (
                    <div className="absolute bottom-full left-0 mb-2 bg-[#2f2f2f] border border-gray-700 rounded-lg shadow-lg overflow-hidden z-20 w-40">
                      <button
                        onClick={() => handleFileSelect("image")}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-[#3a3a3a] transition-colors w-full text-left"
                      >
                        <Image size={18} />
                        <span className="text-sm">Add images</span>
                      </button>
                      <button
                        onClick={() => handleFileSelect("video")}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-[#3a3a3a] transition-colors w-full text-left border-t border-gray-700"
                      >
                        <Video size={18} />
                        <span className="text-sm">Add video</span>
                      </button>
                    </div>
                  )}
                </div>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                />
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleVideoChange}
                  className="hidden"
                />
                <textarea
                  ref={messageInputRef}
                  placeholder="Ask anything..."
                  value={message}
                  onChange={(e) => {
                    onMessageChange(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (selectedFiles.length > 0) {
                        handleSendWithFiles();
                      } else {
                        onSendMessage([]);
                      }
                      e.target.style.height = "auto";
                    }
                  }}
                  disabled={isSending}
                  rows={1}
                  className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none disabled:opacity-50 resize-none max-h-[200px]"
                />
                <button
                  onClick={() => {
                    if (selectedFiles.length > 0) {
                      handleSendWithFiles();
                    } else {
                      onSendMessage([]);
                    }
                    if (messageInputRef.current) {
                      messageInputRef.current.style.height = "auto";
                    }
                  }}
                  disabled={
                    (!message.trim() && selectedFiles.length === 0) || isSending
                  }
                  className="bg-[#DC569D] hover:bg-[#c9458b] p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={18} />
                </button>
                {isSending && (
                  <button
                    onClick={onCancel}
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-500 p-2 rounded-lg transition-colors ml-2 border border-red-500/50"
                    title="Stop generation"
                  >
                    <Square size={18} fill="currentColor" className="p-0.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Empty State */
        <div className="flex-1 flex flex-col relative">
          {isCreating && messages.length === 0 && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10 backdrop-blur-sm">
              <div className="bg-[#2f2f2f] rounded-2xl p-6 flex flex-col items-center gap-4">
                <div className="flex gap-2">
                  <div
                    className="w-3 h-3 bg-[#DC569D] rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  ></div>
                  <div
                    className="w-3 h-3 bg-[#DC569D] rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  ></div>
                  <div
                    className="w-3 h-3 bg-[#DC569D] rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  ></div>
                </div>
                <p className="text-white text-sm">Creating chat...</p>
              </div>
            </div>
          )}

          {messages.length > 0 ? (
            /* Show messages when preview exists */
            <>
              <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-4xl mx-auto space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.role === "user" ? "justify-end" : "justify-start"
                      }`}
                      onMouseEnter={() => setHoveredMessageId(msg.id)}
                      onMouseLeave={() => setHoveredMessageId(null)}
                    >
                      <div
                        className={`flex flex-col gap-2 max-w-[80%] relative ${
                          msg.role === "user" ? "items-end" : "items-start"
                        }`}
                      >
                        {/* Botones de acción */}
                        {hoveredMessageId === msg.id && (
                          <div className="absolute -top-2 -right-2 flex gap-1 z-10">
                            <button
                              onClick={() => handleCopyToClipboard(msg)}
                              className="bg-gray-700 hover:bg-gray-600 rounded-full p-1.5 transition-colors"
                              title="Copy to clipboard"
                            >
                              <Copy size={14} className="text-white" />
                            </button>
                            <button
                              onClick={() => handleResendMessage(msg)}
                              className="bg-gray-700 hover:bg-gray-600 rounded-full p-1.5 transition-colors"
                              title="Resend message"
                            >
                              <RotateCw size={14} className="text-white" />
                            </button>
                          </div>
                        )}
                        {/* Attachments */}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {msg.attachments.map((attachment, idx) => (
                              <div
                                key={idx}
                                className="relative cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => {
                                  // Switch filter to all to ensure we find it
                                  if (galleryFilter !== "all")
                                    setGalleryFilter("all");

                                  // Find in the FULL sorted list (simulating 'all' view)
                                  const allFiltered = (
                                    attachments || []
                                  ).filter(
                                    (a) => !deletedAttachmentIds.has(a.id),
                                  );
                                  const allSorted = allFiltered.sort(
                                    (a, b) =>
                                      new Date(b.created_at) -
                                      new Date(a.created_at),
                                  );

                                  const index = allSorted.findIndex(
                                    (a) => a.id === attachment.id,
                                  );

                                  if (index !== -1) {
                                    setCurrentGalleryIndex(index);
                                    // Don't open gallery grid, just the preview
                                  } else {
                                    setPreviewMedia({
                                      url: attachment.url,
                                      type: attachment.file_type,
                                    });
                                  }
                                }}
                              >
                                {attachment.file_type === "image" ? (
                                  <img
                                    src={attachment.url}
                                    alt="Attachment"
                                    className="h-32 w-auto rounded-lg border border-gray-600 object-cover"
                                  />
                                ) : attachment.file_type === "video" ? (
                                  <video
                                    src={attachment.url}
                                    className="h-32 w-auto rounded-lg border border-gray-600 object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Switch filter to all to ensure we find it
                                      if (galleryFilter !== "all")
                                        setGalleryFilter("all");

                                      // Find in the FULL sorted list (simulating 'all' view)
                                      const allFiltered = (
                                        attachments || []
                                      ).filter(
                                        (a) => !deletedAttachmentIds.has(a.id),
                                      );
                                      const allSorted = allFiltered.sort(
                                        (a, b) =>
                                          new Date(b.created_at) -
                                          new Date(a.created_at),
                                      );

                                      const index = allSorted.findIndex(
                                        (a) => a.id === attachment.id,
                                      );

                                      if (index !== -1) {
                                        setCurrentGalleryIndex(index);
                                        // Don't open gallery grid, just the preview
                                      } else {
                                        setPreviewMedia({
                                          url: attachment.url,
                                          type: attachment.file_type,
                                        });
                                      }
                                    }}
                                  />
                                ) : null}
                              </div>
                            ))}
                          </div>
                        )}
                        <div
                          className={`rounded-2xl px-4 py-3 ${
                            msg.role === "user"
                              ? "bg-[#DC569D] text-white"
                              : "bg-[#2f2f2f] text-white"
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-[#2f2f2f] rounded-2xl px-4 py-3">
                        <div className="flex gap-1">
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0ms" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "150ms" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "300ms" }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>
              <div className="border-t border-gray-800 p-4">
                <div className="max-w-4xl mx-auto">
                  {/* File Previews */}
                  {selectedFiles.length > 0 && (
                    <div className="mb-3 flex gap-3 overflow-x-auto pb-2">
                      {selectedFiles.map((fileObj, index) => (
                        <div key={index} className="relative flex-shrink-0">
                          <button
                            onClick={() => handleRemoveFile(index)}
                            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 rounded-full p-1 z-10"
                          >
                            <X size={14} />
                          </button>
                          {fileObj.type === "image" ? (
                            <img
                              src={
                                fileObj.isUrl ? fileObj.url : fileObj.preview
                              }
                              alt="Preview"
                              className="h-24 w-24 object-cover rounded-lg border border-gray-700"
                            />
                          ) : (
                            <video
                              src={
                                fileObj.isUrl ? fileObj.url : fileObj.preview
                              }
                              className="h-24 w-24 object-cover rounded-lg border border-gray-700"
                              muted
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-3 bg-[#2f2f2f] rounded-2xl px-5 py-4 border border-gray-700 hover:border-gray-600 transition-colors relative">
                    <div className="relative">
                      <button
                        onClick={() => setShowFileMenu(!showFileMenu)}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        <Plus size={20} />
                      </button>
                      {showFileMenu && (
                        <div className="absolute bottom-full left-0 mb-2 bg-[#2f2f2f] border border-gray-700 rounded-lg shadow-lg overflow-hidden z-20 w-40">
                          <button
                            onClick={() => handleFileSelect("image")}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-[#3a3a3a] transition-colors w-full text-left"
                          >
                            <Image size={18} />
                            <span className="text-sm">Add images</span>
                          </button>
                          <button
                            onClick={() => handleFileSelect("video")}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-[#3a3a3a] transition-colors w-full text-left border-t border-gray-700"
                          >
                            <Video size={18} />
                            <span className="text-sm">Add video</span>
                          </button>
                        </div>
                      )}
                    </div>
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/*"
                      onChange={handleVideoChange}
                      className="hidden"
                    />
                    <textarea
                      ref={messageInputRef}
                      placeholder="Ask anything..."
                      value={message}
                      onChange={(e) => {
                        onMessageChange(e.target.value);
                        e.target.style.height = "auto";
                        e.target.style.height = `${e.target.scrollHeight}px`;
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          if (selectedFiles.length > 0) {
                            handleSendWithFiles();
                          } else {
                            onSendMessage([]);
                          }
                          e.target.style.height = "auto";
                        }
                      }}
                      disabled={isSending}
                      rows={1}
                      className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-lg disabled:opacity-50 resize-none max-h-[200px]"
                    />
                    <button
                      onClick={() => {
                        if (selectedFiles.length > 0) {
                          handleSendWithFiles();
                        } else {
                          onSendMessage([]);
                        }
                        if (messageInputRef.current) {
                          messageInputRef.current.style.height = "auto";
                        }
                      }}
                      disabled={
                        (!message.trim() && selectedFiles.length === 0) ||
                        isSending
                      }
                      className="bg-[#DC569D] hover:bg-[#c9458b] p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send size={22} />
                    </button>
                    {isSending && (
                      <button
                        onClick={onCancel}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-500 p-2 rounded-lg transition-colors ml-2 border border-red-500/50"
                        title="Stop generation"
                      >
                        <Square size={22} fill="currentColor" className="p-1" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Initial empty state */
            <div className="flex-1 flex flex-col relative">
              {/* Tokens y Notificaciones - Top Right */}
              <div className="absolute top-4 right-6 flex items-center space-x-3 z-10">
                <div className="flex items-center space-x-2 bg-[#2f2f2f] px-3 py-1.5 rounded-lg">
                  <CreditCard className="h-4 w-4 text-[#DC569D]" />
                  <span className="text-white text-sm font-medium">
                    Tokens:{" "}
                    {isLoadingTokens
                      ? "..."
                      : Math.floor(tokens).toLocaleString("en-US")}
                  </span>
                </div>

                <button
                  onClick={handleOpenTokenModal}
                  className="px-3 py-1.5 bg-[#DC569D] hover:bg-[#c9458b] text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
                >
                  <DollarSign className="h-3 w-3" />
                  Buy Tokens
                </button>

                {/* Notificaciones */}
                <div className="relative" ref={notificationsRef}>
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 text-gray-400 hover:text-white transition-colors hover:bg-[#2f2f2f] rounded-lg"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-[#DC569D] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Dropdown de Notificaciones */}
                  {showNotifications && (
                    <div className="absolute top-12 right-0 bg-[#2f2f2f] rounded-lg shadow-xl border border-gray-700 w-80 max-h-96 overflow-y-auto z-50">
                      <div className="p-3 border-b border-gray-700">
                        <h3 className="text-white font-medium">
                          Notifications
                        </h3>
                      </div>
                      {notificationsInfo.length > 0 ? (
                        <div className="py-2">
                          {notificationsInfo.map((notif) => (
                            <button
                              key={notif.id}
                              onClick={() => handleNotificationClick(notif)}
                              className="w-full px-4 py-3 hover:bg-[#3a3a3a] transition-colors text-left border-b border-gray-800"
                            >
                              <div className="flex items-start gap-3">
                                {notif.other_user?.image ? (
                                  <img
                                    src={notif.other_user.image}
                                    alt="User"
                                    className="w-8 h-8 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                                    <User className="h-4 w-4 text-gray-400" />
                                  </div>
                                )}
                                <div className="flex-1">
                                  <p className="text-white text-sm">
                                    {notif.notification}
                                  </p>
                                  <p className="text-gray-400 text-xs mt-1">
                                    {timeAgo(notif.created_at)}
                                  </p>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="px-4 py-8 text-center text-gray-400 text-sm">
                          No notifications
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 flex items-center justify-center">
                <div className="text-center max-w-3xl w-3xl px-6">
                  <h1 className="text-4xl font-semibold mb-4">
                    How can I help you?
                  </h1>

                  {/* Quick Actions */}
                  <div className="flex flex-col items-center gap-4 mb-8 w-full">
                    {quickActionMenu !== "main" && (
                      <button
                        onClick={() => setQuickActionMenu("main")}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-2 self-center"
                      >
                        <ChevronLeft size={20} />
                        <span>Back</span>
                      </button>
                    )}

                    <div className="flex flex-wrap gap-3 justify-center">
                      {quickActionMenu === "main" && (
                        <>
                          <button
                            onClick={() => setQuickActionMenu("create")}
                            disabled={isSending}
                            className="flex items-center gap-2 px-4 py-3 bg-[#2f2f2f] hover:bg-[#3a3a3a] border border-gray-700 hover:border-[#DC569D] rounded-lg transition-all text-white disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Plus className="h-5 w-5 text-[#DC569D]" />
                            <span>Create</span>
                          </button>

                          <button
                            onClick={() => setQuickActionMenu("edit")}
                            disabled={isSending}
                            className="flex items-center gap-2 px-4 py-3 bg-[#2f2f2f] hover:bg-[#3a3a3a] border border-gray-700 hover:border-[#DC569D] rounded-lg transition-all text-white disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Pencil className="h-5 w-5 text-[#DC569D]" />
                            <span>Edit</span>
                          </button>

                          <button
                            onClick={() => setQuickActionMenu("analyze")}
                            disabled={isSending}
                            className="flex items-center gap-2 px-4 py-3 bg-[#2f2f2f] hover:bg-[#3a3a3a] border border-gray-700 hover:border-[#DC569D] rounded-lg transition-all text-white disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Search className="h-5 w-5 text-[#DC569D]" />
                            <span>Analyze</span>
                          </button>
                        </>
                      )}

                      {quickActionMenu === "create" && (
                        <>
                          <button
                            onClick={() =>
                              handleQuickAction("I want to create an image")
                            }
                            disabled={isSending}
                            className="flex items-center gap-2 px-4 py-3 bg-[#2f2f2f] hover:bg-[#3a3a3a] border border-gray-700 hover:border-[#DC569D] rounded-lg transition-all text-white disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Image className="h-5 w-5 text-[#DC569D]" />
                            <span>Create IA Image</span>
                          </button>

                          <button
                            onClick={() =>
                              handleQuickAction("I want to create a video")
                            }
                            disabled={isSending}
                            className="flex items-center gap-2 px-4 py-3 bg-[#2f2f2f] hover:bg-[#3a3a3a] border border-gray-700 hover:border-[#DC569D] rounded-lg transition-all text-white disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Video className="h-5 w-5 text-[#DC569D]" />
                            <span>Create IA Video</span>
                          </button>

                          <button
                            onClick={() =>
                              handleQuickAction("I want to create a project")
                            }
                            disabled={isSending}
                            className="flex items-center gap-2 px-4 py-3 bg-[#2f2f2f] hover:bg-[#3a3a3a] border border-gray-700 hover:border-[#DC569D] rounded-lg transition-all text-white disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Plus className="h-5 w-5 text-[#DC569D]" />
                            <span>Create Project</span>
                          </button>

                          <button
                            onClick={() =>
                              handleQuickAction("I want to create a voice")
                            }
                            disabled={isSending}
                            className="flex items-center gap-2 px-4 py-3 bg-[#2f2f2f] hover:bg-[#3a3a3a] border border-gray-700 hover:border-[#DC569D] rounded-lg transition-all text-white disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Mic className="h-5 w-5 text-[#DC569D]" />
                            <span>Create Voice</span>
                          </button>
                        </>
                      )}

                      {quickActionMenu === "edit" && (
                        <>
                          <button
                            onClick={() =>
                              handleQuickAction("I want to edit an image")
                            }
                            disabled={isSending}
                            className="flex items-center gap-2 px-4 py-3 bg-[#2f2f2f] hover:bg-[#3a3a3a] border border-gray-700 hover:border-[#DC569D] rounded-lg transition-all text-white disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Image className="h-5 w-5 text-[#DC569D]" />
                            <span>Edit Image</span>
                          </button>

                          <button
                            onClick={() =>
                              handleQuickAction("I want to edit a video")
                            }
                            disabled={isSending}
                            className="flex items-center gap-2 px-4 py-3 bg-[#2f2f2f] hover:bg-[#3a3a3a] border border-gray-700 hover:border-[#DC569D] rounded-lg transition-all text-white disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Video className="h-5 w-5 text-[#DC569D]" />
                            <span>Edit Video</span>
                          </button>
                        </>
                      )}

                      {quickActionMenu === "analyze" && (
                        <>
                          <button
                            onClick={() =>
                              handleQuickAction("I want to analyze an image")
                            }
                            disabled={isSending}
                            className="flex items-center gap-2 px-4 py-3 bg-[#2f2f2f] hover:bg-[#3a3a3a] border border-gray-700 hover:border-[#DC569D] rounded-lg transition-all text-white disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Image className="h-5 w-5 text-[#DC569D]" />
                            <span>Analyze Image</span>
                          </button>

                          <button
                            onClick={() =>
                              handleQuickAction("I want to analyze a video")
                            }
                            disabled={isSending}
                            className="flex items-center gap-2 px-4 py-3 bg-[#2f2f2f] hover:bg-[#3a3a3a] border border-gray-700 hover:border-[#DC569D] rounded-lg transition-all text-white disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Video className="h-5 w-5 text-[#DC569D]" />
                            <span>Analyze Video</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="relative mt-8">
                    {/* File Previews */}
                    {selectedFiles.length > 0 && (
                      <div className="mb-3 flex gap-3 overflow-x-auto pb-2">
                        {selectedFiles.map((fileObj, index) => (
                          <div key={index} className="relative flex-shrink-0">
                            <button
                              onClick={() => handleRemoveFile(index)}
                              className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 rounded-full p-1 z-10"
                            >
                              <X size={14} />
                            </button>
                            {fileObj.type === "image" ? (
                              <img
                                src={
                                  fileObj.isUrl ? fileObj.url : fileObj.preview
                                }
                                alt="Preview"
                                className="h-24 w-24 object-cover rounded-lg border border-gray-700"
                              />
                            ) : (
                              <video
                                src={
                                  fileObj.isUrl ? fileObj.url : fileObj.preview
                                }
                                className="h-24 w-24 object-cover rounded-lg border border-gray-700"
                                muted
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-3 bg-[#2f2f2f] rounded-2xl px-5 py-4 border border-gray-700 hover:border-gray-600 transition-colors relative">
                      <div className="relative">
                        <button
                          onClick={() => setShowFileMenu(!showFileMenu)}
                          className="text-gray-400 hover:text-white transition-colors"
                        >
                          <Plus size={20} />
                        </button>
                        {showFileMenu && (
                          <div className="absolute bottom-full left-0 mb-2 bg-[#2f2f2f] border border-gray-700 rounded-lg shadow-lg overflow-hidden z-20 w-40">
                            <button
                              onClick={() => handleFileSelect("image")}
                              className="flex items-center gap-3 px-4 py-3 hover:bg-[#3a3a3a] transition-colors w-full text-left"
                            >
                              <Image size={18} />
                              <span className="text-sm">Add images</span>
                            </button>
                            <button
                              onClick={() => handleFileSelect("video")}
                              className="flex items-center gap-3 px-4 py-3 hover:bg-[#3a3a3a] transition-colors w-full text-left border-t border-gray-700"
                            >
                              <Video size={18} />
                              <span className="text-sm">Add video</span>
                            </button>
                          </div>
                        )}
                      </div>
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      <input
                        ref={videoInputRef}
                        type="file"
                        accept="video/*"
                        onChange={handleVideoChange}
                        className="hidden"
                      />
                      <textarea
                        ref={messageInputRef}
                        placeholder="Ask anything..."
                        value={message}
                        onChange={(e) => {
                          onMessageChange(e.target.value);
                          e.target.style.height = "auto";
                          e.target.style.height = `${e.target.scrollHeight}px`;
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            if (selectedFiles.length > 0) {
                              handleSendWithFiles();
                            } else {
                              onSendMessage([]);
                            }
                            e.target.style.height = "auto";
                          }
                        }}
                        disabled={isSending}
                        rows={1}
                        className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-lg disabled:opacity-50 resize-none max-h-[200px]"
                      />
                      <button
                        onClick={() => {
                          if (selectedFiles.length > 0) {
                            handleSendWithFiles();
                          } else {
                            onSendMessage([]);
                          }
                          if (messageInputRef.current) {
                            messageInputRef.current.style.height = "auto";
                          }
                        }}
                        disabled={
                          (!message.trim() && selectedFiles.length === 0) ||
                          isSending
                        }
                        className="bg-[#DC569D] hover:bg-[#c9458b] p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send size={22} />
                      </button>
                      {isSending && (
                        <button
                          onClick={onCancel}
                          className="bg-red-500/10 hover:bg-red-500/20 text-red-500 p-2 rounded-lg transition-colors ml-2 border border-red-500/50"
                          title="Stop generation"
                        >
                          <Square
                            size={22}
                            fill="currentColor"
                            className="p-1"
                          />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Token Purchase Modal */}
      {showTokenModal && (
        <Elements stripe={stripePromise}>
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#2f2f2f] rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <h2 className="text-xl font-semibold text-white">
                  {tokenPurchaseStep === "select-amount" && "Buy Tokens"}
                  {tokenPurchaseStep === "select-gateway" &&
                    "Select Payment Gateway"}
                  {tokenPurchaseStep === "payment-method" && "Payment Method"}
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
                    <p className="text-gray-300 text-sm">
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
                          onBlur={handleAmountBlur}
                          className="w-full px-4 py-3 bg-[#3a3a3a] border border-gray-600 rounded-lg text-white text-lg font-medium focus:outline-none focus:border-[#DC569D] transition-colors"
                          placeholder="6"
                        />
                      </div>

                      <div className="bg-[#3a3a3a] p-4 rounded-lg">
                        {(() => {
                          const breakdown = getPaymentBreakdown(
                            Number(purchaseAmount) || 0,
                          );
                          return (
                            <>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-400">Subtotal:</span>
                                <span className="text-white font-medium">
                                  ${breakdown.subtotal.toFixed(2)}
                                </span>
                              </div>
                              <div className="flex justify-between items-center mt-1">
                                <span className="text-gray-400">
                                  VAT (20%):
                                </span>
                                <span className="text-white font-medium">
                                  ${breakdown.vat.toFixed(2)}
                                </span>
                              </div>
                              <div className="border-t border-gray-600 mt-2 pt-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-white font-semibold">
                                    Total Amount:
                                  </span>
                                  <span className="text-[#DC569D] font-bold text-lg">
                                    ${breakdown.total.toFixed(2)}
                                  </span>
                                </div>
                              </div>
                              <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-600">
                                <span className="text-gray-400">
                                  Tokens you'll receive:
                                </span>
                                <span className="text-[#DC569D] font-semibold">
                                  {breakdown.tokens} tokens
                                </span>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    <button
                      onClick={handleContinueToPayment}
                      disabled={!purchaseAmount || Number(purchaseAmount) < 6}
                      className="w-full px-4 py-2 bg-[#DC569D] text-white rounded-lg hover:bg-[#c9458b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Continue to Payment
                    </button>
                  </div>
                )}

                {/* Step 2: Select Gateway */}
                {tokenPurchaseStep === "select-gateway" && (
                  <div className="space-y-6">
                    <div className="bg-[#3a3a3a] p-4 rounded-lg">
                      {(() => {
                        const breakdown = getPaymentBreakdown(
                          Number(purchaseAmount) || 0,
                        );
                        return (
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Total:</span>
                              <span className="text-[#DC569D] font-bold">
                                ${breakdown.total.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Tokens:</span>
                              <span className="text-white">
                                {breakdown.tokens} tokens
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-white font-medium">
                        Choose Payment Method
                      </h3>

                      <div
                        onClick={() => setSelectedGateway("card")}
                        className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
                          selectedGateway === "card"
                            ? "border-[#DC569D] bg-[#DC569D] bg-opacity-10"
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
                              Pay directly with your card
                            </div>
                          </div>
                        </div>
                      </div>

                      {MERCHANT_WALLET && (
                        <div
                          onClick={() => setSelectedGateway("crypto")}
                          className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
                            selectedGateway === "crypto"
                              ? "border-[#DC569D] bg-[#DC569D] bg-opacity-10"
                              : "border-gray-600 hover:border-gray-500"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                              <Wallet className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <div className="text-white font-medium">
                                Pay with Crypto
                              </div>
                              <div className="text-gray-400 text-sm">
                                USDC on Solana via Phantom
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
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
                        className="flex-1 px-4 py-2 bg-[#DC569D] text-white rounded-lg hover:bg-[#c9458b] transition-colors"
                      >
                        Continue
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Payment Method */}
                {tokenPurchaseStep === "payment-method" && (
                  <div className="space-y-6">
                    {selectedGateway === "card" && (
                      <div className="space-y-4">
                        <h3 className="text-white font-medium">
                          Credit/Debit Card Payment
                        </h3>

                        <CardInput
                          onPaymentProcess={handleStripePayment}
                          isProcessing={isProcessingPayment}
                          totalAmount={
                            getPaymentBreakdown(Number(purchaseAmount) || 0)
                              .total
                          }
                        />

                        <button
                          onClick={() => setTokenPurchaseStep("select-gateway")}
                          disabled={isProcessingPayment}
                          className="w-full px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                        >
                          Back
                        </button>
                      </div>
                    )}

                    {selectedGateway === "crypto" && (
                      <div className="space-y-4">
                        <h3 className="text-white font-medium">
                          Crypto Payment
                        </h3>

                        <CryptoInput
                          onPaymentProcess={handleCryptoPayment}
                          isProcessing={isProcessingPayment}
                          totalAmount={
                            getPaymentBreakdown(Number(purchaseAmount) || 0)
                              .total
                          }
                        />

                        <button
                          onClick={() => setTokenPurchaseStep("select-gateway")}
                          disabled={isProcessingPayment}
                          className="w-full px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                        >
                          Back
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Success State */}
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
                      <h3 className="text-white text-xl font-semibold mb-2">
                        Purchase Successful!
                      </h3>
                      <p className="text-gray-300">
                        {calculateTokens(purchaseAmount)} tokens have been added
                        to your account.
                      </p>
                    </div>

                    <div className="bg-[#3a3a3a] p-4 rounded-lg space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">New Balance:</span>
                        <span className="text-[#DC569D] font-semibold text-lg">
                          {tokens} tokens
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={handleCloseTokenModal}
                      className="w-full px-4 py-2 bg-[#DC569D] text-white rounded-lg hover:bg-[#c9458b] transition-colors"
                    >
                      Continue
                    </button>
                  </div>
                )}

                {/* Error State */}
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
                      <h3 className="text-white text-xl font-semibold mb-2">
                        Payment Failed
                      </h3>
                      <p className="text-gray-300 mb-4">{paymentMessage}</p>
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
                        className="flex-1 px-4 py-2 bg-[#DC569D] text-white rounded-lg hover:bg-[#c9458b] transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Elements>
      )}
    </div>
  );
}

export default ChatMain;
