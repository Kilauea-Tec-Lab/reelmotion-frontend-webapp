import { Outlet, useLoaderData, useRevalidator } from "react-router-dom";
import { useState } from "react";
import ChatSidebar from "./components/chat-sidebar";
import HelpButton from "../components/help-button";

function ChatLayout() {
  const chatData = useLoaderData();
  const revalidator = useRevalidator();
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="flex h-screen bg-[#212121] text-white overflow-hidden">
      <ChatSidebar
        chats={chatData?.chats || []}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        user={chatData?.user || {}}
        subscription={chatData?.suscription || null}
      />
      <Outlet context={{ revalidate: revalidator.revalidate }} />
      <HelpButton />
    </div>
  );
}

export default ChatLayout;
