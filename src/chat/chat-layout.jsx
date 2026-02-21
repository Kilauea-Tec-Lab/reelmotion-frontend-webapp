import { Outlet, useLoaderData, useRevalidator } from "react-router-dom";
import { useState } from "react";
import ChatSidebar from "./components/chat-sidebar";
import HelpButton from "../components/help-button";
import AiLabModal from "./components/ai-lab-modal";

function ChatLayout() {
  const chatData = useLoaderData();
  const revalidator = useRevalidator();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAiLabOpen, setIsAiLabOpen] = useState(false);

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
    </div>
  );
}

export default ChatLayout;
