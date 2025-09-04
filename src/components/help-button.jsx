import { useState, useEffect, useRef } from "react";
import {
  HelpCircle,
  MessageCircle,
  Lightbulb,
  X,
  PlayCircle,
} from "lucide-react";
import ReelBot from "./reel-bot";
import SuggestionsForm from "./suggestions-form";
import TutorialModal from "./tutorial-modal";

function HelpButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeComponent, setActiveComponent] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleOptionSelect = (option) => {
    setActiveComponent(option);
    setIsOpen(false);
  };

  const handleClose = () => {
    setActiveComponent(null);
  };

  return (
    <>
      {/* Help Button */}
      <div ref={menuRef} className="fixed bottom-6 left-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-[#F2D543] hover:bg-[#f2f243] text-primarioDark p-4 rounded-full shadow-2xl transition-all transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-[#F2D543] focus:ring-opacity-50 animate-pulse hover:animate-none"
        >
          <HelpCircle size={24} />
        </button>

        {/* Options Menu */}
        {isOpen && (
          <div className="absolute bottom-16 left-0 bg-darkBox rounded-lg shadow-xl p-2 min-w-[200px] border border-darkBoxSub animate-in slide-in-from-bottom-2 duration-200">
            <button
              onClick={() => handleOptionSelect("reelbot")}
              className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-darkBoxSub rounded-lg transition-all duration-200 text-left group"
            >
              <MessageCircle
                size={20}
                className="text-[#F2D543] group-hover:scale-110 transition-transform flex-shrink-0"
              />
              <div>
                <span className="montserrat-medium text-sm block">Reelbot</span>
                <span className="montserrat-light text-xs text-gray-400">
                  Support Chat
                </span>
              </div>
            </button>

            <button
              onClick={() => handleOptionSelect("suggestions")}
              className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-darkBoxSub rounded-lg transition-all duration-200 text-left group"
            >
              <Lightbulb
                size={20}
                className="text-[#F2D543] group-hover:scale-110 transition-transform flex-shrink-0"
              />
              <div>
                <span className="montserrat-medium text-sm block">
                  Suggestions
                </span>
                <span className="montserrat-light text-xs text-gray-400">
                  Help us improve
                </span>
              </div>
            </button>

            <button
              onClick={() => handleOptionSelect("tutorials")}
              className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-darkBoxSub rounded-lg transition-all duration-200 text-left group"
            >
              <PlayCircle
                size={20}
                className="text-[#F2D543] group-hover:scale-110 transition-transform flex-shrink-0"
              />
              <div>
                <span className="montserrat-medium text-sm block">
                  Learn to use Reelmotion AI
                </span>
                <span className="montserrat-light text-xs text-gray-400">
                  Video tutorials
                </span>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* ReelBot Component */}
      {activeComponent === "reelbot" && <ReelBot onClose={handleClose} />}

      {/* Suggestions Form Component */}
      {activeComponent === "suggestions" && (
        <SuggestionsForm onClose={handleClose} />
      )}

      {/* Tutorial Modal Component */}
      {activeComponent === "tutorials" && (
        <TutorialModal onClose={handleClose} />
      )}
    </>
  );
}

export default HelpButton;
