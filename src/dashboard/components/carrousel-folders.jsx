import { useState, useRef } from "react";
import {
  MoreHorizontal,
  Edit,
  Eye,
  Trash2,
  Film,
  FolderOpen,
  MoreVertical,
} from "lucide-react";
import ModalEditFolder from "../../create_elements/modal-edit-folder";
import ModalDeleteFolder from "../../create_elements/modal-delete-folder";
import ModalEditProject from "../../create_elements/modal-edit-project";
import ModalDeleteProject from "../../create_elements/modal-delete-project";
import PostModal from "../../discover/components/post-modal";
import { destroyFolder, destroyProject } from "../../create_elements/functions";
import { Link } from "react-router-dom";

function CarrouselFolders({ folder, folders }) {
  const [hoveredProject, setHoveredProject] = useState(null);
  const [showMenu, setShowMenu] = useState(null);
  const [hoveredFolder, setHoveredFolder] = useState(false);
  const [showFolderMenu, setShowFolderMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [showDeleteProjectModal, setShowDeleteProjectModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  const handleEditFolder = () => {
    setShowEditModal(true);
    setShowFolderMenu(false);
  };

  const handleDeleteFolder = () => {
    setShowDeleteModal(true);
    setShowFolderMenu(false);
  };

  const handleEditProject = (project) => {
    setSelectedProject(project);
    setShowEditProjectModal(true);
    setShowMenu(null);
  };

  const handleDeleteProject = (project) => {
    setSelectedProject(project);
    setShowDeleteProjectModal(true);
    setShowMenu(null);
  };

  const handleProjectClick = (project) => {
    // Si el proyecto tiene video, abrir el post-card modal
    if (project.video_url) {
      setSelectedPostId(project.id);
      setIsPostModalOpen(true);
    }
  };

  const handleClosePostModal = () => {
    setIsPostModalOpen(false);
    setSelectedPostId(null);
  };

  const handleVideoHover = (videoElement, shouldPlay) => {
    if (videoElement) {
      if (shouldPlay) {
        videoElement.currentTime = 0;
        videoElement.play().catch(() => {
          // Si no se puede reproducir automáticamente, seguir con muted
        });
      } else {
        videoElement.pause();
        videoElement.currentTime = 0;
      }
    }
  };

  async function handleConfirmDelete(folderToDelete) {
    const response = await destroyFolder({ id: folderToDelete.id });
  }

  async function handleConfirmDeleteProject(projectToDelete) {
    const response = await destroyProject({ id: projectToDelete.id });
  }

  return (
    <div className="pt-8">
      <div
        className="flex gap-4 items-center"
        onMouseEnter={() => setHoveredFolder(true)}
        onMouseLeave={() => {
          setHoveredFolder(false);
          setShowFolderMenu(false);
        }}
      >
        <div
          className="w-8 h-8 rounded-lg border-2 border-gray-600 flex items-center justify-center"
          style={{ backgroundColor: folder.color }}
        >
          <FolderOpen className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-white montserrat-medium text-2xl tracking-wider">
          {folder?.name}
        </h1>

        {/* Three Dots Menu for Folder */}
        {hoveredFolder && (
          <div className="relative ml-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowFolderMenu(!showFolderMenu);
              }}
              className="bg-[#36354080] px-0.5 py-0.5 bg-opacity-75 text-white hover:bg-opacity-90 rounded-full transition-all"
            >
              <MoreVertical className="w-3 h-3" />
            </button>

            {/* Dropdown Menu for Folder */}
            {showFolderMenu && (
              <div 
                className="absolute top-6 right-0 bg-darkBoxSub rounded-lg shadow-lg z-10 min-w-[120px]"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditFolder();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-darkBox transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteFolder();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-primarioLogo hover:bg-darkBox transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Destroy
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="grid grid-cols-6 gap-6 mt-6 bg-darkBox px-8 py-4 rounded-2xl">
        {folder?.projects.length === 0 && (
          <div className="col-span-6 flex items-center justify-center py-4">
            <span className="text-gray-400 montserrat-light text-lg">
              No Projects Found
            </span>
          </div>
        )}
        {folder?.projects.map((project) => (
          <div
            key={project.id}
            className="w-full"
            onMouseEnter={() => setHoveredProject(project.id)}
            onMouseLeave={() => {
              setHoveredProject(null);
              setShowMenu(null);
            }}
          >
            {/* Video Preview Card - 3/5 del tamaño original */}
            <div
              className="relative rounded-lg overflow-hidden group pt-4 cursor-pointer"
              onClick={() => handleProjectClick(project)}
            >
              {/* Video Preview */}
              <div
                className="relative h-24 flex items-center justify-center"
                onMouseEnter={(e) => {
                  const video = e.currentTarget.querySelector("video");
                  if (video && project.video_url) {
                    handleVideoHover(video, true);
                  }
                }}
                onMouseLeave={(e) => {
                  const video = e.currentTarget.querySelector("video");
                  if (video && project.video_url) {
                    handleVideoHover(video, false);
                  }
                }}
              >
                {project.video_url ? (
                  <video
                    src={project.video_url}
                    className="w-full h-full object-cover rounded-3xl"
                    muted
                    loop
                    preload="metadata"
                  />
                ) : (
                  <div className="w-full h-full bg-darkBoxSub flex items-center justify-center rounded-3xl">
                    <Film className="w-7 h-7 text-gray-500" />
                  </div>
                )}

                {/* Duration Badge */}
                <div className="absolute bottom-1 left-1 bg-[#36354090] montserrat-medium text-white text-xs px-1.5 py-0.5 rounded">
                  {project.duration}s
                </div>

                {/* Three Dots Menu */}
                {hoveredProject === project.id && (
                  <div className="absolute top-1 right-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(showMenu === project.id ? null : project.id);
                      }}
                      className="bg-[#36354080] px-0.5 py-0.5 bg-opacity-75 text-white hover:bg-opacity-90 rounded-full transition-all"
                    >
                      <MoreHorizontal className="w-3 h-3" />
                    </button>

                    {/* Dropdown Menu */}
                    {showMenu === project.id && (
                      <div 
                        className="absolute top-6 right-0 bg-darkBoxSub rounded-lg shadow-lg z-10 min-w-[70px]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Link
                          to={`/project/${project.id}`}
                          className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-white hover:bg-darkBox transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Eye className="w-3 h-3" />
                          Show
                        </Link>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditProject(project);
                          }}
                          className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-white hover:bg-darkBox transition-colors"
                        >
                          <Edit className="w-3 h-3" />
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProject(project);
                          }}
                          className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-primarioLogo hover:bg-darkBox transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          Destroy
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Project Info */}
              <div className="p-2 pt-4">
                <h3
                  className="text-white font-medium text-xs mb-0.5 montserrat-regular line-clamp-1"
                  title={project.name}
                >
                  {project.name}
                </h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modales */}
      <ModalEditFolder
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        folder={folder}
      />
      <ModalDeleteFolder
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        folder={folder}
        onConfirm={handleConfirmDelete}
      />

      <ModalEditProject
        isOpen={showEditProjectModal}
        onClose={() => setShowEditProjectModal(false)}
        project={selectedProject}
        folders={folders}
      />

      <ModalDeleteProject
        isOpen={showDeleteProjectModal}
        onClose={() => setShowDeleteProjectModal(false)}
        project={selectedProject}
        onConfirm={handleConfirmDeleteProject}
      />

      {/* Post Modal */}
      <PostModal
        isOpen={isPostModalOpen}
        onClose={handleClosePostModal}
        postId={selectedPostId}
      />
    </div>
  );
}

export default CarrouselFolders;
