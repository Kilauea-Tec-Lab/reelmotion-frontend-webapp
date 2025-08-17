import { useState } from "react";
import { MoreHorizontal, Edit, Eye, Trash2, Film } from "lucide-react";
import { Link } from "react-router-dom";
import PostModal from "../../discover/components/post-modal";

function RecentProjects({
  recentsProjects,
  onEditProject,
  onDeleteProject,
  onPreviewVideo,
}) {
  const [hoveredProject, setHoveredProject] = useState(null);
  const [showMenu, setShowMenu] = useState(null);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  const handleEditClick = (project) => {
    setShowMenu(null);
    if (onEditProject) {
      onEditProject(project);
    }
  };

  const handleDeleteClick = (project) => {
    setShowMenu(null);
    if (onDeleteProject) {
      onDeleteProject(project);
    }
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

  return (
    <div>
      <div className="flex overflow-x-auto gap-4 mt-6 pb-2">
        {recentsProjects.map((project) => (
          <div
            key={project.id}
            className="min-w-[280px] max-w-[280px] flex-shrink-0"
            onMouseEnter={() => setHoveredProject(project.id)}
            onMouseLeave={() => {
              setHoveredProject(null);
              setShowMenu(null);
            }}
          >
            {/* Video Preview Card */}
            <div
              className="relative rounded-lg overflow-hidden group cursor-pointer"
              onClick={() => handleProjectClick(project)}
            >
              {/* Video Preview */}
              <div className="relative h-40 flex items-center justify-center">
                {project.video_url ? (
                  <video
                    src={project.video_url}
                    className="w-full h-full object-cover rounded-3xl"
                    muted
                    preload="metadata"
                  />
                ) : (
                  <div className="w-full h-full bg-darkBox flex items-center justify-center rounded-3xl">
                    <Film className="w-12 h-12 text-gray-500" />
                  </div>
                )}
                {/* Duration Badge */}
                <div className="absolute bottom-2 left-2 bg-[#36354090] montserrat-medium text-white text-xs px-2 py-1 rounded">
                  {project.duration}s
                </div>
                {/* Three Dots Menu */}
                {hoveredProject === project.id && (
                  <div className="absolute top-2 right-2">
                    <button
                      onClick={() =>
                        setShowMenu(showMenu === project.id ? null : project.id)
                      }
                      className="bg-[#36354080] px-1 py-1 bg-opacity-75 text-white hover:bg-opacity-90 rounded-full transition-all"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {/* Dropdown Menu */}
                    {showMenu === project.id && (
                      <div className="absolute top-8 right-0 bg-darkBoxSub rounded-lg shadow-lg z-10 min-w-[120px]">
                        <Link
                          to={`/project/${project.id}`}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-darkBox transition-colors rounded-t-lg"
                        >
                          <Eye className="w-4 h-4" /> Show
                        </Link>
                        <button
                          onClick={() => handleEditClick(project)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-darkBox transition-colors"
                        >
                          <Edit className="w-4 h-4" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteClick(project)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-primarioLogo hover:bg-darkBox transition-colors rounded-b-lg"
                        >
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {/* Project Info */}
              <div className="p-4">
                <h3
                  className="text-white font-medium text-sm mb-1 montserrat-regular line-clamp-1"
                  title={project.name}
                >
                  {project.name}
                </h3>
                <p className="text-[#808191] text-xs montserrat-regular">
                  {project.created}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Post Modal */}
      <PostModal
        isOpen={isPostModalOpen}
        onClose={handleClosePostModal}
        postId={selectedPostId}
      />
    </div>
  );
}

export default RecentProjects;
