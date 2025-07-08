import { img } from "framer-motion/client";
import { useState } from "react";
import { ChevronDown, FolderClosed, VideoIcon } from "lucide-react";
import RecentProjects from "./components/recent-projects";
import CarrouselFolders from "./components/carrousel-folders";
import ModalCreateProject from "../create_elements/modal-create-project";
import ModalCreateFolder from "../create_elements/modal-create-folder";

function Home() {
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const recentsProjects = [];

  const foldersArray = [];
  return (
    <div className="p-6 min-h-screen bg-primarioDark">
      <div className="flex items-center justify-between mb-8">
        <span className="text-white montserrat-medium text-2xl tracking-wider">
          Projects
        </span>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowCreateMenu(!showCreateMenu)}
            className="bg-[#F2D543] text-primarioDark px-8 py-2 rounded-3xl font-medium hover:bg-[#f2f243] flex items-center gap-2 transition-colors"
          >
            Create
          </button>

          {/* Dropdown Menu */}
          {showCreateMenu && (
            <div className="absolute top-12 right-0 bg-darkBoxSub rounded-lg shadow-lg z-10 min-w-[140px]">
              <button
                onClick={() => {
                  setShowCreateMenu(false);
                  setShowProjectModal(true);
                }}
                className="w-full flex gap-2 text-left px-4 py-3 text-sm montserrat-light text-white hover:bg-darkBox transition-colors rounded-t-lg"
              >
                <VideoIcon size={17} />
                Project
              </button>
              <button
                onClick={() => {
                  setShowCreateMenu(false);
                  setShowFolderModal(true);
                }}
                className="w-full text-left flex gap-2 px-4 py-3 text-sm text-white montserrat-light hover:bg-darkBox transition-colors rounded-b-lg"
              >
                <FolderClosed size={17} />
                Folder
              </button>
            </div>
          )}
        </div>
      </div>
      {/* Recents */}
      {recentsProjects.length === 0 ? (
        <div
          className="flex items-center justify-center rounded
        "
        >
          <span className="text-gray-400 montserrat-light text-lg">
            No Projects Found
          </span>
        </div>
      ) : (
        <RecentProjects recentsProjects={recentsProjects} />
      )}
      {/*Carrousel Folders */}

      <div>
        {foldersArray.map((folder) => (
          <CarrouselFolders
            key={folder.id}
            title={folder.name}
            projects={recentsProjects}
          />
        ))}
      </div>

      {/* Modales */}
      <ModalCreateProject
        isOpen={showProjectModal}
        onClose={() => setShowProjectModal(false)}
      />
      <ModalCreateFolder
        isOpen={showFolderModal}
        onClose={() => setShowFolderModal(false)}
      />
    </div>
  );
}

export default Home;
