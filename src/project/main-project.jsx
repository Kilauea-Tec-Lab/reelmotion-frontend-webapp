import { div, span } from "framer-motion/client";
import { Edit, Plus, Trash2, MoreHorizontal } from "lucide-react";
import { useState, useEffect } from "react";
import { useLoaderData, useParams, useNavigate } from "react-router-dom";
import ModalEditProject from "../create_elements/modal-edit-project";
import ModalDeleteProject from "../create_elements/modal-delete-project";
import ModalCreateCharacter from "../create_elements/modal-create-character";
import ModalCreateSpot from "../create_elements/modal-create-spot";
import ModalCreateVoice from "../create_elements/modal-create-voice";
import ModalCreateScene from "../create_elements/modal-create-scene";
import ModalEditCharacter from "./components/modal-edit-character";
import ModalDeleteCharacter from "./components/modal-delete-character";
import ModalEditSpot from "./components/modal-edit-spot";
import ModalDeleteSpot from "../create_elements/modal-delete-spot";
import { createPusherClient } from "../pusher";
import { getProjects } from "./functions";

function MainProject() {
  const id = useParams();
  const data = useLoaderData();
  const navigate = useNavigate();
  const [project, setProject] = useState(data?.data);

  // Obtener user de alguna manera - puede venir en data o necesitamos obtenerlo
  const user = data?.user || data?.data?.user;

  async function fillProject() {
    const response = await getProjects(project?.id);
    setProject(response?.data);
  }

  // Estados para los modales
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCreateCharacterModalOpen, setIsCreateCharacterModalOpen] =
    useState(false);
  const [isCreateSpotModalOpen, setIsCreateSpotModalOpen] = useState(false);
  const [isCreateVoiceModalOpen, setIsCreateVoiceModalOpen] = useState(false);
  const [isCreateSceneModalOpen, setIsCreateSceneModalOpen] = useState(false);

  // Estados para el menú de opciones de personajes
  const [hoveredCharacter, setHoveredCharacter] = useState(null);
  const [showCharacterMenu, setShowCharacterMenu] = useState(null);
  const [isEditCharacterModalOpen, setIsEditCharacterModalOpen] =
    useState(false);
  const [isDeleteCharacterModalOpen, setIsDeleteCharacterModalOpen] =
    useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState(null);

  // Estados para el menú de opciones de spots
  const [hoveredSpot, setHoveredSpot] = useState(null);
  const [showSpotMenu, setShowSpotMenu] = useState(null);
  const [isEditSpotModalOpen, setIsEditSpotModalOpen] = useState(false);
  const [isDeleteSpotModalOpen, setIsDeleteSpotModalOpen] = useState(false);
  const [selectedSpot, setSelectedSpot] = useState(null);

  //WEBSOCKET
  const pusherClient = createPusherClient();

  // WebSocket Effects
  useEffect(() => {
    let channel = pusherClient.subscribe(
      `private-get-only-one-project.${project.id}`
    );

    channel.bind("fill-only-one-project", ({ project_id }) => {
      fillProject();
    });

    return () => {
      pusherClient.unsubscribe(`private-get-only-one-project.${project.id}`);
    };
  }, []);

  // Funciones para manejar los modales
  const handleEditProject = () => {
    setIsEditModalOpen(true);
  };

  const handleDeleteProject = () => {
    setIsDeleteModalOpen(true);
  };

  const handleProjectUpdated = () => {
    setIsEditModalOpen(false);
  };

  const handleProjectDeleted = (deletedProject) => {
    navigate("/");
  };

  const handleCreateCharacter = () => {
    setIsCreateCharacterModalOpen(true);
  };

  const handleCharacterCreated = (characterData) => {
    // Actualizar el estado del proyecto con el nuevo personaje
    console.log("Character created:", characterData);
    setProject((prevProject) => ({
      ...prevProject,
      characters: [...(prevProject.characters || []), characterData],
    }));
    setIsCreateCharacterModalOpen(false);
  };

  const handleCreateSpot = () => {
    setIsCreateSpotModalOpen(true);
  };

  const handleSpotCreated = (spotData) => {
    // Actualizar el estado del proyecto con el nuevo spot
    console.log("Spot created:", spotData);
    setProject((prevProject) => ({
      ...prevProject,
      spots: [...(prevProject.spots || []), spotData],
    }));
    setIsCreateSpotModalOpen(false);
  };

  const handleCreateVoice = () => {
    setIsCreateVoiceModalOpen(true);
  };

  const handleVoiceCreated = (voiceData) => {
    // Aquí puedes actualizar el estado del proyecto con la nueva voz
    console.log("Voice created:", voiceData);
    setIsCreateVoiceModalOpen(false);
  };

  const handleCreateScene = () => {
    setIsCreateSceneModalOpen(true);
  };

  const handleSceneCreated = (sceneData) => {
    // Aquí puedes actualizar el estado del proyecto con la nueva escena
    console.log("Scene created:", sceneData);
    setIsCreateSceneModalOpen(false);
  };

  const handleEditCharacter = (character) => {
    setSelectedCharacter(character);
    setIsEditCharacterModalOpen(true);
    setShowCharacterMenu(null);
  };

  const handleDeleteCharacter = (character) => {
    console.log("Delete character:", character);
    setSelectedCharacter(character);
    setIsDeleteCharacterModalOpen(true);
    setShowCharacterMenu(null);
  };

  const handleCharacterDeleted = (deletedCharacter) => {
    // Actualizar el estado del proyecto removiendo el personaje
    console.log("Character deleted:", deletedCharacter);
    setProject((prevProject) => ({
      ...prevProject,
      characters:
        prevProject.characters?.filter((c) => c.id !== deletedCharacter.id) ||
        [],
    }));
    setIsDeleteCharacterModalOpen(false);
    setSelectedCharacter(null);
  };

  // Funciones para manejar spots
  const handleEditSpot = (spot) => {
    setSelectedSpot(spot);
    setIsEditSpotModalOpen(true);
    setShowSpotMenu(null);
  };

  const handleDeleteSpot = (spot) => {
    console.log("Delete spot:", spot);
    setSelectedSpot(spot);
    setIsDeleteSpotModalOpen(true);
    setShowSpotMenu(null);
  };

  const handleSpotUpdated = (updatedSpot) => {
    // Actualizar el estado del proyecto con el spot modificado
    setIsEditSpotModalOpen(false);
    setSelectedSpot(null);
  };

  const handleSpotDeleted = (deletedSpot) => {
    // Actualizar el estado del proyecto removiendo el spot
    console.log("Spot deleted:", deletedSpot);
    setProject((prevProject) => ({
      ...prevProject,
      spots: prevProject.spots?.filter((s) => s.id !== deletedSpot.id) || [],
    }));
    setIsDeleteSpotModalOpen(false);
    setSelectedSpot(null);
  };

  return (
    <div className="p-6 min-h-screen bg-primarioDark">
      <div className="space-y-3">
        <div className="flex gap-4">
          <h1 className="text-white montserrat-medium text-2xl tracking-wider">
            {project?.name}
          </h1>
          <button
            type="button"
            className="mt-2 px-2 py-2 bg-yellow-900 text-yellow-200 rounded-lg hover:bg-yellow-600"
            onClick={handleEditProject}
          >
            <Edit size={15} />
          </button>
          <button
            type="button"
            className="mt-2 px-2 py-2 bg-red-900 text-red-200 rounded-lg hover:bg-red-600"
            onClick={handleDeleteProject}
          >
            <Trash2 size={15} />
          </button>
        </div>
        <h2 className="text-[#808191] montserrat-medium text-sm tracking-wider">
          {project?.description}
        </h2>
      </div>
      {/* Characters */}
      <div className="mt-16">
        <div className="flex gap-4 items-center align-middle">
          <h2 className="text-white montserrat-medium text-xl tracking-wider">
            Chatacters
          </h2>
          <button
            type="button"
            className="mt-2 px-2 py-2 bg-[#f2f243] text-primarioDark rounded-lg hover:bg-[#f2f243]"
            onClick={handleCreateCharacter}
          >
            <Plus size={15} />
          </button>
        </div>
        <div className="bg-darkBox px-8 py-6 rounded-lg mt-4">
          {project?.characters?.length > 0 ? (
            <div className="grid grid-cols-7 overflow-auto gap-4">
              {project.characters.map((character) => (
                <div
                  key={character.id}
                  className="pb-2 bg-darkBoxSub px-3 pt-3 rounded-xl space-y-4 relative"
                  onMouseEnter={() => setHoveredCharacter(character.id)}
                  onMouseLeave={() => {
                    setHoveredCharacter(null);
                    setShowCharacterMenu(null);
                  }}
                >
                  <div className="relative">
                    <img
                      src={character.image_url}
                      alt=""
                      className="w-32 h-32 object-cover rounded-2xl"
                    />

                    {/* Three Dots Menu */}
                    {hoveredCharacter === character.id && (
                      <div className="absolute top-2 right-2">
                        <button
                          onClick={() =>
                            setShowCharacterMenu(
                              showCharacterMenu === character.id
                                ? null
                                : character.id
                            )
                          }
                          className="bg-[#36354080] px-1 py-1 bg-opacity-75 text-white hover:bg-opacity-90 rounded-full transition-all"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {/* Dropdown Menu */}
                        {showCharacterMenu === character.id && (
                          <div className="absolute top-8 right-0 bg-darkBox rounded-lg shadow-lg z-10 min-w-[100px] border border-gray-600">
                            <button
                              onClick={() => handleEditCharacter(character)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-darkBoxSub transition-colors rounded-t-lg"
                            >
                              <Edit className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteCharacter(character)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-darkBoxSub transition-colors rounded-b-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <h1
                    className="text-[#a2a3b4] montserrat-medium text-sm tracking-wider line-clamp-1"
                    title={character.name}
                  >
                    {character.name}
                  </h1>
                </div>
              ))}
            </div>
          ) : (
            <span className="text-[#808191]">
              No characters found for this project.
            </span>
          )}
        </div>
      </div>
      {/* Spots */}
      <div className="mt-9">
        <div className="flex gap-4 items-center align-middle">
          <h2 className="text-white montserrat-medium text-xl tracking-wider">
            Spots
          </h2>
          <button
            type="button"
            className="mt-2 px-2 py-2 bg-[#f2f243] text-primarioDark rounded-lg hover:bg-[#f2f243]"
            onClick={handleCreateSpot}
          >
            <Plus size={15} />
          </button>
        </div>
        <div className="bg-darkBox px-8 py-6 rounded-lg mt-4">
          {project?.spots?.length > 0 ? (
            <div className="grid grid-cols-7 overflow-auto gap-4">
              {project.spots.map((spot) => (
                <div
                  key={spot.id}
                  className="pb-2 bg-darkBoxSub px-3 pt-3 rounded-xl space-y-4 relative"
                  onMouseEnter={() => setHoveredSpot(spot.id)}
                  onMouseLeave={() => {
                    setHoveredSpot(null);
                    setShowSpotMenu(null);
                  }}
                >
                  <div className="relative">
                    <img
                      src={spot.image_url}
                      alt=""
                      className="w-32 h-32 object-cover rounded-2xl"
                    />

                    {/* Three Dots Menu */}
                    {hoveredSpot === spot.id && (
                      <div className="absolute top-2 right-2">
                        <button
                          onClick={() =>
                            setShowSpotMenu(
                              showSpotMenu === spot.id ? null : spot.id
                            )
                          }
                          className="bg-[#36354080] px-1 py-1 bg-opacity-75 text-white hover:bg-opacity-90 rounded-full transition-all"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {/* Dropdown Menu */}
                        {showSpotMenu === spot.id && (
                          <div className="absolute top-8 right-0 bg-darkBox rounded-lg shadow-lg z-10 min-w-[100px] border border-gray-600">
                            <button
                              onClick={() => handleEditSpot(spot)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-darkBoxSub transition-colors rounded-t-lg"
                            >
                              <Edit className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteSpot(spot)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-darkBoxSub transition-colors rounded-b-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <h1
                    className="text-[#a2a3b4] montserrat-medium text-sm tracking-wider line-clamp-1"
                    title={spot.name}
                  >
                    {spot.name}
                  </h1>
                </div>
              ))}
            </div>
          ) : (
            <span className="text-[#808191]">
              No spots found for this project.
            </span>
          )}
        </div>
      </div>
      {/* Voices */}
      <div className="mt-9">
        <div className="flex gap-4 items-center align-middle">
          <h2 className="text-white montserrat-medium text-xl tracking-wider">
            Voices
          </h2>
          <button
            type="button"
            className="mt-2 px-2 py-2 bg-[#f2f243] text-primarioDark rounded-lg hover:bg-[#f2f243]"
            onClick={handleCreateVoice}
          >
            <Plus size={15} />
          </button>
        </div>
        <div className="bg-darkBox px-8 py-6 rounded-lg mt-4">
          {project?.voices?.length > 0 ? (
            <span>Hola</span>
          ) : (
            <span className="text-[#808191]">
              No voices found for this project.
            </span>
          )}
        </div>
      </div>
      {/* Scenes */}
      <div className="mt-9">
        <div className="flex gap-4 items-center align-middle">
          <h2 className="text-white montserrat-medium text-xl tracking-wider">
            Scenes
          </h2>
          <button
            type="button"
            className="mt-2 px-2 py-2 bg-[#f2f243] text-primarioDark rounded-lg hover:bg-[#f2f243]"
            onClick={handleCreateScene}
          >
            <Plus size={15} />
          </button>
        </div>
        <div className="bg-darkBox px-8 py-6 rounded-lg mt-4">
          {project?.scenes?.length > 0 ? (
            <span>Hola</span>
          ) : (
            <span className="text-[#808191]">
              No scenes found for this project.
            </span>
          )}
        </div>
      </div>

      {/* Modales */}
      <ModalEditProject
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        project={project}
        folders={[]} // Aquí necesitarías pasar las carpetas disponibles
        onProjectUpdated={handleProjectUpdated}
      />

      <ModalDeleteProject
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        project={project}
        onConfirm={handleProjectDeleted}
      />

      <ModalCreateCharacter
        isOpen={isCreateCharacterModalOpen}
        onClose={() => setIsCreateCharacterModalOpen(false)}
        onCharacterCreated={handleCharacterCreated}
        project_id={project?.id}
      />
      <ModalEditCharacter
        isOpen={isEditCharacterModalOpen}
        onClose={() => setIsEditCharacterModalOpen(false)}
        character={selectedCharacter}
      />

      <ModalDeleteCharacter
        isOpen={isDeleteCharacterModalOpen}
        onClose={() => setIsDeleteCharacterModalOpen(false)}
        character={selectedCharacter}
        onConfirm={handleCharacterDeleted}
      />
      <ModalCreateSpot
        isOpen={isCreateSpotModalOpen}
        onClose={() => setIsCreateSpotModalOpen(false)}
        project_id={project?.id}
        onSpotCreated={handleSpotCreated}
      />

      <ModalEditSpot
        isOpen={isEditSpotModalOpen}
        onClose={() => setIsEditSpotModalOpen(false)}
        spot={selectedSpot}
        onSpotUpdated={handleSpotUpdated}
      />

      <ModalDeleteSpot
        isOpen={isDeleteSpotModalOpen}
        onClose={() => setIsDeleteSpotModalOpen(false)}
        spot={selectedSpot}
        onConfirm={handleSpotDeleted}
      />

      <ModalCreateVoice
        isOpen={isCreateVoiceModalOpen}
        onClose={() => setIsCreateVoiceModalOpen(false)}
        projectId={project?.id}
        onVoiceCreated={handleVoiceCreated}
      />

      <ModalCreateScene
        isOpen={isCreateSceneModalOpen}
        onClose={() => setIsCreateSceneModalOpen(false)}
        projectId={project?.id}
        onSceneCreated={handleSceneCreated}
        characters={project?.characters || []}
        spots={project?.spots || []}
      />
    </div>
  );
}

export default MainProject;
