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
  const [hasBeenClicked, setHasBeenClicked] = useState(false);
  const menuRef = useRef(null);

  // Verificar en el montaje si ya se ha hecho click antes
  useEffect(() => {
    const helpButtonClicked = localStorage.getItem("helpButtonClicked");
    if (helpButtonClicked === "true") {
      setHasBeenClicked(true);
    }
  }, []);

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

  // Manejar click del botón principal
  const handleButtonClick = () => {
    // Si es el primer click, guardarlo en caché
    if (!hasBeenClicked) {
      localStorage.setItem("helpButtonClicked", "true");
      setHasBeenClicked(true);
    }
    setIsOpen(!isOpen);
  };

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
      <div ref={menuRef} className="fixed bottom-6 right-6 z-50">
        <button
          onClick={handleButtonClick}
          className="bg-[#2f2f2f] hover:bg-[#3a3a3a] text-white border border-gray-600 p-4 rounded-full shadow-2xl transition-all transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-gray-600 focus:ring-opacity-50 animate-pulse hover:animate-none"
        >
          <HelpCircle size={24} />
        </button>

        {/* Options Menu */}
        {isOpen && (
          <div className="absolute bottom-16 right-0 bg-darkBox rounded-lg shadow-xl p-2 min-w-[200px] animate-in slide-in-from-bottom-2 duration-200">
            <button
              onClick={() => handleOptionSelect("reelbot")}
              className={`w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-darkBoxSub rounded-lg transition-all duration-200 text-left group`}
            >
              <MessageCircle
                size={20}
                className="text-white group-hover:scale-110 transition-transform flex-shrink-0"
              />
              <div>
                <span className="montserrat-medium text-sm block text-white">
                  Reelbot
                </span>
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
                className="text-white group-hover:scale-110 transition-transform flex-shrink-0"
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

            {/* <button
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
            </button> */}
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
