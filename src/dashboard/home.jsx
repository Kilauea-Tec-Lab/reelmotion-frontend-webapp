import { useEffect, useState } from "react";
import {
  ChevronDown,
  FolderClosed,
  VideoIcon,
  X,
  Sparkles,
  Zap,
  Crown,
} from "lucide-react";
import RecentProjects from "./components/recent-projects";
import CarrouselFolders from "./components/carrousel-folders";
import ModalCreateProject from "../create_elements/modal-create-project";
import ModalCreateFolder from "../create_elements/modal-create-folder";
import ModalEditProject from "../create_elements/modal-edit-project";
import ModalDeleteProject from "../create_elements/modal-delete-project";
import ModalPreview from "../components/modal-preview";
import { useLoaderData, useNavigate } from "react-router-dom";
import { createPusherClient } from "@/pusher";
import { getFolders, getProjects } from "../create_elements/functions";

function Home() {
  const { folders, projects, user } = useLoaderData();
  const navigate = useNavigate();
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [showDeleteProjectModal, setShowDeleteProjectModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [previewProject, setPreviewProject] = useState(null);
  const [foldersData, setFoldersData] = useState(folders?.data);
  const [projectsData, setProjectsData] = useState(projects?.data);

  // Welcome modal state (show only once for new users)
  const [showWelcomeModal, setShowWelcomeModal] = useState(true);

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

  //WEBSOCKET
  const pusherClient = createPusherClient();

  async function fillProjects() {
    const response = await getProjects();
    setProjectsData(response?.data);
  }

  async function fillFolders() {
    const response = await getFolders();
    setFoldersData(response?.data);
  }

  // Funciones para manejar la edición y eliminación de proyectos
  const handleEditProject = (project) => {
    setSelectedProject(project);
    setShowEditProjectModal(true);
  };

  const handleDeleteProject = (project) => {
    setSelectedProject(project);
    setShowDeleteProjectModal(true);
  };

  const handlePreviewVideo = (project) => {
    setPreviewProject(project);
    setShowPreviewModal(true);
  };

  const handleProjectDeleted = (deletedProject) => {
    // Actualizar la lista de proyectos removiendo el proyecto eliminado
    setProjectsData((prev) =>
      prev.filter((project) => project.id !== deletedProject.id),
    );
  };

  const handleProjectUpdated = () => {
    // Refrescar la lista de proyectos después de editar
    fillProjects();
  };

  useEffect(() => {
    let channel = pusherClient.subscribe(
      `private-get-projects.${user?.data?.id}`,
    );

    channel.bind("fill-projects", ({ user_id }) => {
      fillProjects();
    });

    return () => {
      pusherClient.unsubscribe(`private-get-projects.${user?.data?.id}`);
    };
  });

  useEffect(() => {
    let channel = pusherClient.subscribe(
      `private-get-folders.${user?.data?.id}`,
    );

    channel.bind("fill-folders", ({ user_id }) => {
      fillFolders();
    });

    return () => {
      pusherClient.unsubscribe(`private-get-folders.${user?.data?.id}`);
    };
  });

  return (
    <div className="p-6 min-h-screen bg-primarioDark pt-5">
      <div className="flex items-center justify-between mb-8">
        <span className="text-white montserrat-medium text-2xl tracking-wider pt-1">
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
              {foldersData.length > 0 && (
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
              )}
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
      {projectsData.length === 0 && foldersData.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded p-8 text-center
        "
        >
          <h2 className="text-white montserrat-medium text-xl mb-4">
            Welcome to your project section!
          </h2>
          <div className="text-gray-400 montserrat-light text-sm leading-relaxed max-w-md">
            <p className="mb-3">
              You don't have any projects or folders yet. To get started, you'll
              need to create a folder where your projects will be stored.
            </p>
            <p>
              Click the Create button to set up your first folder. Once it's
              created, you'll be able to start building your projects.
            </p>
          </div>
        </div>
      ) : (
        <RecentProjects
          recentsProjects={projectsData}
          onEditProject={handleEditProject}
          onDeleteProject={handleDeleteProject}
        />
      )}
      {/*Carrousel Folders */}

      <div>
        {foldersData.map((folder) => (
          <CarrouselFolders
            key={folder.id}
            folder={folder}
            folders={foldersData}
          />
        ))}
      </div>

      {/* Modales */}
      <ModalCreateProject
        folders={foldersData}
        isOpen={showProjectModal}
        onClose={() => setShowProjectModal(false)}
      />
      <ModalCreateFolder
        isOpen={showFolderModal}
        onClose={() => setShowFolderModal(false)}
      />
      <ModalEditProject
        isOpen={showEditProjectModal}
        onClose={() => {
          setShowEditProjectModal(false);
          setSelectedProject(null);
        }}
        project={selectedProject}
        folders={foldersData}
        onProjectUpdated={handleProjectUpdated}
      />
      <ModalDeleteProject
        isOpen={showDeleteProjectModal}
        onClose={() => {
          setShowDeleteProjectModal(false);
          setSelectedProject(null);
        }}
        project={selectedProject}
        onConfirm={handleProjectDeleted}
      />
      <ModalPreview
        isOpen={showPreviewModal}
        onClose={() => {
          setShowPreviewModal(false);
          setPreviewProject(null);
        }}
        type="video"
        data={previewProject}
      />

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

export default Home;
