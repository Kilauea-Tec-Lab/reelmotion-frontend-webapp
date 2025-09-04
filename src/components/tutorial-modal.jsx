import { useState } from "react";
import { X, Play } from "lucide-react";

function TutorialModal({ onClose }) {
  const [selectedVideo, setSelectedVideo] = useState(null);

  const tutorials = [
    {
      id: 1,
      title: "Introduction",
      url: "https://www.youtube.com/watch?v=HRjeKw9l86g",
      embedUrl: "https://www.youtube.com/embed/HRjeKw9l86g",
    },
    {
      id: 2,
      title: "How to do payments",
      url: "https://www.youtube.com/watch?v=Cyyoed2h9-0",
      embedUrl: "https://www.youtube.com/embed/Cyyoed2h9-0",
    },
    {
      id: 3,
      title: "What is Reelbot",
      url: "https://www.youtube.com/watch?v=Df4UCmmHg4A",
      embedUrl: "https://www.youtube.com/embed/Df4UCmmHg4A",
    },
    {
      id: 4,
      title: "What is Discovery",
      url: "https://www.youtube.com/watch?v=SdWcST_OeXk",
      embedUrl: "https://www.youtube.com/embed/SdWcST_OeXk",
    },
    {
      id: 5,
      title: "How do I create a Folder",
      url: "https://www.youtube.com/watch?v=dcx6COmu_Ls",
      embedUrl: "https://www.youtube.com/embed/dcx6COmu_Ls",
    },
    {
      id: 6,
      title: "How do I create a project",
      url: "https://www.youtube.com/watch?v=Q10OO9_QGSQ",
      embedUrl: "https://www.youtube.com/embed/Q10OO9_QGSQ",
    },
    {
      id: 7,
      title: "How do I create characters",
      url: "https://www.youtube.com/watch?v=BvIg4HabNzI",
      embedUrl: "https://www.youtube.com/embed/BvIg4HabNzI",
    },
    {
      id: 8,
      title: "How do I create spots",
      url: "https://www.youtube.com/watch?v=QNz_MN_7Rl4",
      embedUrl: "https://www.youtube.com/embed/QNz_MN_7Rl4",
    },
    {
      id: 9,
      title: "How do I create voices",
      url: "https://www.youtube.com/watch?v=Y_PpzKXWWvA",
      embedUrl: "https://www.youtube.com/embed/Y_PpzKXWWvA",
    },
    {
      id: 10,
      title: "How do I create storyboards",
      url: "https://www.youtube.com/watch?v=5Ez3A5g-SH8",
      embedUrl: "https://www.youtube.com/embed/5Ez3A5g-SH8",
    },
    {
      id: 11,
      title: "How do I create a scene",
      url: "https://www.youtube.com/watch?v=SrqG9YPXEy4",
      embedUrl: "https://www.youtube.com/embed/SrqG9YPXEy4",
    },
    {
      id: 12,
      title: "How to edit",
      url: "https://www.youtube.com/watch?v=XItJ6jf2aLg",
      embedUrl: "https://www.youtube.com/embed/XItJ6jf2aLg",
    },
  ];

  const handleVideoSelect = (tutorial) => {
    setSelectedVideo(tutorial);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-darkBox rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden border border-darkBoxSub">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-darkBoxSub">
          <div>
            <h3 className="text-white montserrat-medium text-2xl">
              Learn to use Reelmotion AI
            </h3>
            <p className="text-gray-400 montserrat-light text-sm mt-1">
              Video tutorials to help you master Reelmotion
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-darkBoxSub rounded-lg"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex h-[calc(90vh-120px)]">
          {/* Video List */}
          <div className="w-1/3 border-r border-darkBoxSub overflow-y-auto">
            <div className="p-4">
              <h4 className="text-white montserrat-medium text-lg mb-4">
                Tutorial List
              </h4>
              <div className="space-y-2">
                {tutorials.map((tutorial) => (
                  <button
                    key={tutorial.id}
                    onClick={() => handleVideoSelect(tutorial)}
                    className={`w-full text-left p-3 rounded-lg transition-all duration-200 group ${
                      selectedVideo?.id === tutorial.id
                        ? "bg-[#F2D543] text-primarioDark"
                        : "bg-darkBoxSub text-white hover:bg-gray-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          selectedVideo?.id === tutorial.id
                            ? "bg-primarioDark text-[#F2D543]"
                            : "bg-[#F2D543] text-primarioDark"
                        }`}
                      >
                        {tutorial.id}
                      </div>
                      <div className="flex-1">
                        <span className="montserrat-medium text-sm block">
                          {tutorial.title}
                        </span>
                      </div>
                      <Play
                        size={16}
                        className={`${
                          selectedVideo?.id === tutorial.id
                            ? "text-primarioDark"
                            : "text-[#F2D543]"
                        } group-hover:scale-110 transition-transform`}
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Video Player */}
          <div className="flex-1 p-6">
            {selectedVideo ? (
              <div className="h-full flex flex-col">
                <h5 className="text-white montserrat-medium text-xl mb-4">
                  {selectedVideo.title}
                </h5>
                <div className="flex-1 bg-black rounded-lg overflow-hidden">
                  <iframe
                    src={selectedVideo.embedUrl}
                    title={selectedVideo.title}
                    className="w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Play size={64} className="text-[#F2D543] mx-auto mb-4" />
                  <h5 className="text-white montserrat-medium text-xl mb-2">
                    Select a tutorial
                  </h5>
                  <p className="text-gray-400 montserrat-light">
                    Choose a video from the list to start learning
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TutorialModal;
