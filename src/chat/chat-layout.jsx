import { Outlet } from "react-router-dom";
import { useLoaderData } from "react-router-dom";
import { useState } from "react";
import ChatSidebar from "./components/chat-sidebar";

function ChatLayout() {
  const chatData = useLoaderData();
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="flex h-screen bg-[#212121] text-white overflow-hidden">
      <ChatSidebar
        chats={chatData?.chats || []}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        user={chatData?.user || {}}
      />
      <Outlet />
    </div>
  );
}

export default ChatLayout;
