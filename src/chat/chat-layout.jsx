import {
  Outlet,
  useLoaderData,
  useNavigate,
  useRevalidator,
} from "react-router-dom";
import { useEffect, useState } from "react";
import ChatSidebar from "./components/chat-sidebar";
import HelpButton from "../components/help-button";
import AiLabModal from "./components/ai-lab-modal";
import { X, Sparkles, Zap, Crown } from "lucide-react";

function ChatLayout() {
  const chatData = useLoaderData();
  const revalidator = useRevalidator();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAiLabOpen, setIsAiLabOpen] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem("reelmotion_welcome_shown");
    if (!hasSeenWelcome) {
      setShowWelcomeModal(true);
    }
  }, []);

  const handleCloseWelcome = () => {
    localStorage.setItem("reelmotion_welcome_shown", "true");
    setShowWelcomeModal(false);
  };

  return (
    <div className="flex h-screen bg-primarioDark text-white overflow-hidden">
      <ChatSidebar
        chats={chatData?.chats || []}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        user={chatData?.user || {}}
        subscription={chatData?.suscription || null}
        onOpenAiLab={() => setIsAiLabOpen(true)}
      />
      <Outlet context={{ revalidate: revalidator.revalidate }} />
      <HelpButton />
      <AiLabModal isOpen={isAiLabOpen} onClose={() => setIsAiLabOpen(false)} />

      {/* Welcome Modal - shown only once for new users */}
      {showWelcomeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#161619] border border-gray-700 rounded-3xl w-full max-w-lg p-8 relative shadow-2xl animate-in zoom-in-95 duration-200">
            <button
              onClick={handleCloseWelcome}
              className="absolute top-5 right-5 text-gray-400 hover:text-white transition-colors"
            >
              <X size={22} />
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-[#DC569D] to-[#F2D543] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles size={32} className="text-white" />
              </div>
              <h2 className="text-white text-2xl font-bold">
                Welcome to Reelmotion AI! 🎉
              </h2>
              <p className="text-gray-400 text-sm mt-2">
                We're glad to have you here
              </p>
            </div>

            {/* Token info */}
            <div className="bg-black/40 border border-gray-700 rounded-2xl p-5 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[#DC569D]/20 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Zap size={20} className="text-[#DC569D]" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-base mb-1">
                    About Your Free Tokens
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    Your current tokens are enough to{" "}
                    <span className="text-white font-medium">
                      create images
                    </span>
                    . If you need more tokens to generate videos and access
                    premium features, you'll need to subscribe to a plan or
                    purchase additional tokens.
                  </p>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-3">
              <button
                onClick={() => {
                  handleCloseWelcome();
                  navigate("/pro");
                }}
                className="w-full bg-gradient-to-r from-[#DC569D] to-[#c9458b] text-white py-3.5 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-[#DC569D]/20 flex items-center justify-center gap-2"
              >
                <Crown size={18} />
                Subscribe for More Tokens
              </button>
              <button
                onClick={() => {
                  handleCloseWelcome();
                  navigate("/my-subscription");
                }}
                className="w-full bg-[#F2D543] text-[#161619] py-3.5 rounded-xl font-bold hover:bg-[#f2f243] transition-all flex items-center justify-center gap-2"
              >
                <Zap size={18} />
                Buy Tokens
              </button>
              <button
                onClick={handleCloseWelcome}
                className="w-full text-gray-400 hover:text-white py-2.5 rounded-xl font-medium transition-colors text-sm"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatLayout;
