import {
  Outlet,
  useLoaderData,
  useRevalidator,
} from "react-router-dom";
import { useEffect, useState, lazy, Suspense } from "react";
import ChatSidebar from "./components/chat-sidebar";
import OnboardingModal from "./components/onboarding-modal";

// 3.5k lineas que antes viajaban en el bundle principal y ejecutaban todos
// sus hooks en cada render del layout, aunque el modal estuviera cerrado.
const AiLabModal = lazy(() => import("./components/ai-lab-modal"));
import { Menu } from "lucide-react";

function ChatLayout() {
  const chatData = useLoaderData();
  const revalidator = useRevalidator();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAiLabOpen, setIsAiLabOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // AI Lab es una accion primaria: se precarga cuando el navegador esta ocioso,
  // asi sale del arranque critico pero abre instantaneo.
  useEffect(() => {
    if (typeof requestIdleCallback !== "function") return;
    const id = requestIdleCallback(() => import("./components/ai-lab-modal"));
    return () => cancelIdleCallback(id);
  }, []);

  // ponytail: gate solo en /app (no /v2 ni /editor, ni la API directa): es friccion, no seguridad.
  const needsOnboarding = chatData?.user?.onboarding_completed === false;

  return (
    <div className="flex h-screen bg-primarioDark text-white overflow-hidden">
      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <ChatSidebar
        chats={chatData?.chats || []}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        user={chatData?.user || {}}
        onOpenAiLab={() => setIsAiLabOpen(true)}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-3 px-4 h-12 border-b border-gray-800 bg-[#171717] flex-shrink-0">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <Menu size={22} />
          </button>
          <img
            src="/logos/logo_reelmotion.webp"
            alt="Reelmotion AI"
            className="h-6"
          />
        </div>
        <Outlet
          context={{
            revalidate: revalidator.revalidate,
          }}
        />
      </div>

      {isAiLabOpen && (
        <Suspense fallback={null}>
          <AiLabModal isOpen onClose={() => setIsAiLabOpen(false)} />
        </Suspense>
      )}

      {needsOnboarding && (
        <OnboardingModal onCompleted={revalidator.revalidate} />
      )}
    </div>
  );
}

export default ChatLayout;
