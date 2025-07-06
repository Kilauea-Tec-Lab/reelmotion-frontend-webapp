import { useState } from "react";
import { MoreHorizontal, Edit, Eye, Trash2, Film } from "lucide-react";

function CarrouselFolders({ projects, title }) {
  const [hoveredProject, setHoveredProject] = useState(null);
  const [showMenu, setShowMenu] = useState(null);

  return (
    <div className="pt-8">
      <span className="text-white montserrat-medium text-2xl tracking-wider">
        {title}
      </span>
      <div className="grid grid-cols-6 gap-6 mt-6 bg-darkBox px-8 py-4 rounded-2xl">
        {projects.map((project) => (
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
            <div className="relative rounded-lg overflow-hidden group">
              {/* Video Preview */}
              <div className="relative h-24 flex items-center justify-center">
                {project.video ? (
                  <video
                    src={project.video}
                    className="w-full h-full object-cover rounded-3xl"
                    muted
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
                      onClick={() =>
                        setShowMenu(showMenu === project.id ? null : project.id)
                      }
                      className="bg-[#36354080] px-0.5 py-0.5 bg-opacity-75 text-white hover:bg-opacity-90 rounded-full transition-all"
                    >
                      <MoreHorizontal className="w-3 h-3" />
                    </button>

                    {/* Dropdown Menu */}
                    {showMenu === project.id && (
                      <div className="absolute top-6 right-0 bg-darkBoxSub rounded-lg shadow-lg z-10 min-w-[120px]">
                        <button className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-white hover:bg-darkBox transition-colors">
                          <Eye className="w-3 h-3" />
                          Ver
                        </button>
                        <button className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-white hover:bg-darkBox transition-colors">
                          <Edit className="w-3 h-3" />
                          Editar
                        </button>
                        <button className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-red-400 hover:bg-darkBox transition-colors">
                          <Trash2 className="w-3 h-3" />
                          Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Project Info */}
              <div className="p-2">
                <h3
                  className="text-white font-medium text-xs mb-0.5 montserrat-regular line-clamp-1"
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
    </div>
  );
}

export default CarrouselFolders;
