import { useEffect, useState } from "react";
import { ChevronDown, FolderClosed, VideoIcon } from "lucide-react";
import RecentProjects from "./components/recent-projects";
import CarrouselFolders from "./components/carrousel-folders";
import ModalCreateProject from "../create_elements/modal-create-project";
import ModalCreateFolder from "../create_elements/modal-create-folder";
import ModalEditProject from "../create_elements/modal-edit-project";
import ModalDeleteProject from "../create_elements/modal-delete-project";
import ModalPreview from "../components/modal-preview";
import { useLoaderData } from "react-router-dom";
import { createPusherClient } from "@/pusher";
import { getFolders, getProjects } from "../create_elements/functions";

function Home() {
  const { folders, projects, user } = useLoaderData();
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
      prev.filter((project) => project.id !== deletedProject.id)
    );
  };

  const handleProjectUpdated = () => {
    // Refrescar la lista de proyectos después de editar
    fillProjects();
  };

  useEffect(() => {
    let channel = pusherClient.subscribe(
      `private-get-projects.${user?.data?.id}`
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
      `private-get-folders.${user?.data?.id}`
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
      {projectsData.length === 0 ? (
        <div
          className="flex items-center justify-center rounded
        "
        >
          <span className="text-gray-400 montserrat-light text-lg">
            No Projects Found
          </span>
        </div>
      ) : (
        <RecentProjects
          recentsProjects={projectsData}
          onEditProject={handleEditProject}
          onDeleteProject={handleDeleteProject}
          onPreviewVideo={handlePreviewVideo}
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
    </div>
  );
}

export default Home;
