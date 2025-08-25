import { div, span } from "framer-motion/client";
import { Edit, Plus, Trash2, MoreHorizontal, Volume2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useLoaderData, useParams, useNavigate } from "react-router-dom";
import ModalEditProject from "../create_elements/modal-edit-project";
import ModalDeleteProject from "../create_elements/modal-delete-project";
import ModalCreateCharacter from "../create_elements/modal-create-character";
import ModalCreateSpot from "../create_elements/modal-create-spot";
import ModalCreateVoice from "../create_elements/modal-create-voice";
import ModalCreateScene from "../create_elements/modal-create-scene";
import ModalCreateFrame from "../create_elements/modal-create-frame";
import ModalEditCharacter from "./components/modal-edit-character";
import ModalDeleteCharacter from "./components/modal-delete-character";
import ModalEditSpot from "./components/modal-edit-spot";
import ModalDeleteSpot from "../create_elements/modal-delete-spot";
import ModalEditScene from "./components/modal-edit-scene";
import ModalDeleteScene from "./components/modal-delete-scene";
import ModalEditFrame from "./components/modal-edit-frame";
import ModalDeleteFrame from "./components/modal-delete-frame";
import ModalEditVoice from "./components/modal-edit-voice";
import ModalDeleteVoice from "./components/modal-delete-voice";
import ModalPreview from "../components/modal-preview";
import { createPusherClient } from "../pusher";
import { getProjects } from "./functions";

function MainProject() {
  const id = useParams();
  const data = useLoaderData();
  const navigate = useNavigate();
  const [project, setProject] = useState(data?.data);

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
  const [isCreateFrameModalOpen, setIsCreateFrameModalOpen] = useState(false);

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

  // Estados para el menú de opciones de voices
  const [hoveredVoice, setHoveredVoice] = useState(null);
  const [showVoiceMenu, setShowVoiceMenu] = useState(null);
  const [isEditVoiceModalOpen, setIsEditVoiceModalOpen] = useState(false);
  const [isDeleteVoiceModalOpen, setIsDeleteVoiceModalOpen] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(null);

  // Estados para el menú de opciones de frames
  const [hoveredFrame, setHoveredFrame] = useState(null);
  const [showFrameMenu, setShowFrameMenu] = useState(null);
  const [isEditFrameModalOpen, setIsEditFrameModalOpen] = useState(false);
  const [isDeleteFrameModalOpen, setIsDeleteFrameModalOpen] = useState(false);
  const [selectedFrame, setSelectedFrame] = useState(null);

  // Estados para el menú de opciones de scenes
  const [hoveredScene, setHoveredScene] = useState(null);
  const [showSceneMenu, setShowSceneMenu] = useState(null);
  const [isEditSceneModalOpen, setIsEditSceneModalOpen] = useState(false);
  const [isDeleteSceneModalOpen, setIsDeleteSceneModalOpen] = useState(false);
  const [selectedScene, setSelectedScene] = useState(null);

  // Estados para el modal de preview
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewType, setPreviewType] = useState(null);

  // Verificar si el proyecto está completo
  const isProjectComplete =
    project?.status === "complete" || project?.status === "completed";

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
    navigate("/projects");
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
    // Actualizar el estado del proyecto con la nueva escena
    console.log("Scene created:", sceneData);
    setProject((prevProject) => ({
      ...prevProject,
      scenes: [...(prevProject.scenes || []), sceneData],
    }));
    setIsCreateSceneModalOpen(false);
  };

  const handleFrameCreated = (frameData) => {
    // Validar que el frame tenga los datos necesarios
    if (!frameData || !frameData.id) {
      console.error("Invalid frame data received:", frameData);
      return;
    }

    // Actualizar el estado del proyecto con el nuevo frame
    console.log("Frame created:", frameData);
    setProject((prevProject) => ({
      ...prevProject,
      frames: [...(prevProject.frames || []), frameData],
    }));
    setIsCreateFrameModalOpen(false);
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

  // Funciones para manejar voices
  const handleEditVoice = (voice) => {
    setSelectedVoice(voice);
    setIsEditVoiceModalOpen(true);
    setShowVoiceMenu(null);
  };

  const handleDeleteVoice = (voice) => {
    console.log("Delete voice:", voice);
    setSelectedVoice(voice);
    setIsDeleteVoiceModalOpen(true);
    setShowVoiceMenu(null);
  };

  const handleVoiceUpdated = (updatedVoice) => {
    // Actualizar el estado del proyecto con la voice modificada
    setProject((prevProject) => ({
      ...prevProject,
      voices:
        prevProject.voices?.map((v) =>
          v.id === updatedVoice.id ? updatedVoice : v
        ) || [],
    }));
    setIsEditVoiceModalOpen(false);
    setSelectedVoice(null);
  };

  const handleVoiceDeleted = (deletedVoice) => {
    // Actualizar el estado del proyecto removiendo la voice
    console.log("Voice deleted:", deletedVoice);
    setProject((prevProject) => ({
      ...prevProject,
      voices: prevProject.voices?.filter((v) => v.id !== deletedVoice.id) || [],
    }));
    setIsDeleteVoiceModalOpen(false);
    setSelectedVoice(null);
  };

  // Funciones para manejar scenes
  const handleEditScene = (scene) => {
    setSelectedScene(scene);
    setIsEditSceneModalOpen(true);
    setShowSceneMenu(null);
  };

  const handleDeleteScene = (scene) => {
    console.log("Delete scene:", scene);
    setSelectedScene(scene);
    setIsDeleteSceneModalOpen(true);
    setShowSceneMenu(null);
  };

  const handleSceneUpdated = (updatedScene) => {
    // Actualizar el estado del proyecto con la escena modificada
    setProject((prevProject) => ({
      ...prevProject,
      scenes:
        prevProject.scenes?.map((s) =>
          s.id === updatedScene.id ? updatedScene : s
        ) || [],
    }));
    setIsEditSceneModalOpen(false);
    setSelectedScene(null);
  };

  const handleSceneDeleted = (deletedScene) => {
    // Actualizar el estado del proyecto removiendo la escena
    console.log("Scene deleted:", deletedScene);
    setProject((prevProject) => ({
      ...prevProject,
      scenes: prevProject.scenes?.filter((s) => s.id !== deletedScene.id) || [],
    }));
    setIsDeleteSceneModalOpen(false);
    setSelectedScene(null);
  };

  // Funciones para manejar frames
  const handleEditFrame = (frame) => {
    setSelectedFrame(frame);
    setIsEditFrameModalOpen(true);
    setShowFrameMenu(null);
  };

  const handleDeleteFrame = (frame) => {
    console.log("Delete frame:", frame);
    setSelectedFrame(frame);
    setIsDeleteFrameModalOpen(true);
    setShowFrameMenu(null);
  };

  const handleFrameUpdated = (updatedFrame) => {
    // Actualizar el estado del proyecto con el frame modificado
    setProject((prevProject) => ({
      ...prevProject,
      frames:
        prevProject.frames?.map((f) =>
          f.id === updatedFrame.id ? updatedFrame : f
        ) || [],
    }));
    setIsEditFrameModalOpen(false);
    setSelectedFrame(null);
  };

  const handleFrameDeleted = (deletedFrame) => {
    // Actualizar el estado del proyecto removiendo el frame
    console.log("Frame deleted:", deletedFrame);
    setProject((prevProject) => ({
      ...prevProject,
      frames: prevProject.frames?.filter((f) => f.id !== deletedFrame.id) || [],
    }));
    setIsDeleteFrameModalOpen(false);
    setSelectedFrame(null);
  };

  // Función para abrir el modal de preview
  const handlePreview = (item, type) => {
    setPreviewData(item);
    setPreviewType(type);
    setIsPreviewModalOpen(true);
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
            className="mt-2 px-2 py-2 bg-[#DC569D30] text-primarioLogo rounded-lg hover:bg-primarioLogo"
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
            Characters
          </h2>
          <button
            type="button"
            className={`mt-2 px-2 py-2 rounded-lg transition-colors bg-[#f2f243] text-primarioDark hover:bg-[#f2f243]`}
            onClick={handleCreateCharacter}
            title={
              isProjectComplete
                ? "Cannot create characters in completed projects"
                : "Create Character"
            }
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
                  onDoubleClick={() => handlePreview(character, "image")}
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
                              className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors rounded-b-lg text-primarioLogo hover:bg-darkBoxSub`}
                              title={"Delete Character"}
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
            className={`mt-2 px-2 py-2 rounded-lg transition-colors bg-[#f2f243] text-primarioDark hover:bg-[#f2f243]`}
            onClick={handleCreateSpot}
            title={
              isProjectComplete
                ? "Cannot create spots in completed projects"
                : "Create Spot"
            }
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
                  onDoubleClick={() => handlePreview(spot, "image")}
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
                              className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors rounded-b-lg text-primarioLogo hover:bg-darkBoxSub`}
                              title={"Delete Spot"}
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
            className={`mt-2 px-2 py-2 rounded-lg transition-colors bg-[#f2f243] text-primarioDark hover:bg-[#f2f243]`}
            onClick={handleCreateVoice}
            title={
              isProjectComplete
                ? "Cannot create voices in completed projects"
                : "Create Voice"
            }
          >
            <Plus size={15} />
          </button>
        </div>
        <div className="bg-darkBox px-8 py-6 rounded-lg mt-4">
          {project?.voices?.length > 0 ? (
            <div className="grid grid-cols-7 overflow-auto gap-4">
              {project.voices.map((voice) => (
                <div
                  key={voice.id}
                  className="pb-2 bg-darkBoxSub px-3 pt-3 rounded-xl space-y-4 relative"
                  onMouseEnter={() => setHoveredVoice(voice.id)}
                  onMouseLeave={() => {
                    setHoveredVoice(null);
                    setShowVoiceMenu(null);
                  }}
                  onDoubleClick={() => handlePreview(voice, "audio")}
                >
                  <div className="relative">
                    <div className="w-32 h-32 rounded-2xl flex items-center justify-center">
                      <div className="w-20 h-20 bg-darkBox rounded-full flex items-center justify-center">
                        <Volume2 className="w-10 h-10 text-primarioLogo" />
                      </div>
                    </div>

                    {/* Three Dots Menu */}
                    {hoveredVoice === voice.id && (
                      <div className="absolute top-2 right-2">
                        <button
                          onClick={() =>
                            setShowVoiceMenu(
                              showVoiceMenu === voice.id ? null : voice.id
                            )
                          }
                          className="bg-[#36354080] px-1 py-1 bg-opacity-75 text-white hover:bg-opacity-90 rounded-full transition-all"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {/* Dropdown Menu */}
                        {showVoiceMenu === voice.id && (
                          <div className="absolute top-8 right-0 bg-darkBox rounded-lg shadow-lg z-10 min-w-[100px] border border-gray-600">
                            <button
                              onClick={() => handleEditVoice(voice)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-darkBoxSub transition-colors rounded-t-lg"
                            >
                              <Edit className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteVoice(voice)}
                              className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors rounded-b-lg text-red-400 hover:bg-darkBoxSub`}
                              title={"Delete Voice"}
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
                    title={voice.name}
                  >
                    {voice.name}
                  </h1>
                </div>
              ))}
            </div>
          ) : (
            <span className="text-[#808191]">
              No voices found for this project.
            </span>
          )}
        </div>
      </div>
      {/* Storyboard */}
      <div className="mt-9">
        <div className="flex gap-4 items-center align-middle">
          <h2 className="text-white montserrat-medium text-xl tracking-wider">
            Storyboard
          </h2>
          <button
            type="button"
            className={`mt-2 px-2 py-2 rounded-lg transition-colors bg-[#f2f243] text-primarioDark hover:bg-[#f2f243]`}
            onClick={() => setIsCreateFrameModalOpen(true)}
            title={
              isProjectComplete
                ? "Cannot create frames in completed projects"
                : "Create Frame"
            }
          >
            <Plus size={15} />
          </button>
        </div>
        <div className="bg-darkBox px-8 py-6 rounded-lg mt-4">
          {project?.frames?.length > 0 ? (
            <div className="grid grid-cols-7 overflow-auto gap-4">
              {project.frames
                .filter((frame) => frame && frame.id)
                .map((frame) => (
                  <div
                    key={frame.id}
                    className="pb-2 bg-darkBoxSub px-3 pt-3 rounded-xl space-y-4 relative"
                    onMouseEnter={() => setHoveredFrame(frame.id)}
                    onMouseLeave={() => {
                      setHoveredFrame(null);
                      setShowFrameMenu(null);
                    }}
                    onDoubleClick={() =>
                      handlePreview(
                        frame,
                        frame?.media_type || frame?.type || "image"
                      )
                    }
                  >
                    <div className="relative">
                      {frame?.media_type === "video" ||
                      frame?.type === "video" ? (
                        <video
                          src={frame?.media_url}
                          className="w-32 h-32 object-cover rounded-2xl"
                          muted
                          loop
                          preload="metadata"
                        />
                      ) : (
                        <img
                          src={frame?.media_url}
                          alt=""
                          className="w-32 h-32 object-cover rounded-2xl"
                        />
                      )}

                      {/* Three Dots Menu */}
                      {hoveredFrame === frame.id && (
                        <div className="absolute top-2 right-2">
                          <button
                            onClick={() =>
                              setShowFrameMenu(
                                showFrameMenu === frame.id ? null : frame.id
                              )
                            }
                            className="bg-[#36354080] px-1 py-1 bg-opacity-75 text-white hover:bg-opacity-90 rounded-full transition-all"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>

                          {/* Dropdown Menu */}
                          {showFrameMenu === frame.id && (
                            <div className="absolute top-8 right-0 bg-darkBox rounded-lg shadow-lg z-10 min-w-[100px] border border-gray-600">
                              <button
                                onClick={() => handleEditFrame(frame)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-darkBoxSub transition-colors rounded-t-lg"
                              >
                                <Edit className="w-4 h-4" />
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteFrame(frame)}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors rounded-b-lg text-primarioLogo hover:bg-darkBoxSub`}
                                title={"Delete Frame"}
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
                      title={frame.name}
                    >
                      {frame.name}
                    </h1>
                  </div>
                ))}
            </div>
          ) : (
            <span className="text-[#808191]">
              No frames found for this project.
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
            className={`mt-2 px-2 py-2 rounded-lg transition-colors bg-[#f2f243] text-primarioDark hover:bg-[#f2f243]`}
            onClick={handleCreateScene}
            title={
              isProjectComplete
                ? "Cannot create scenes in completed projects"
                : "Create Scene"
            }
          >
            <Plus size={15} />
          </button>
        </div>
        <div className="bg-darkBox px-8 py-6 rounded-lg mt-4">
          {project?.scenes?.length > 0 ? (
            <div className="grid grid-cols-7 overflow-auto gap-4">
              {project.scenes.map((scene) => (
                <div
                  key={scene.id}
                  className="pb-2 bg-darkBoxSub px-3 pt-3 rounded-xl space-y-4 relative"
                  onMouseEnter={() => setHoveredScene(scene.id)}
                  onMouseLeave={() => {
                    setHoveredScene(null);
                    setShowSceneMenu(null);
                  }}
                  onDoubleClick={() => handlePreview(scene, "video")}
                >
                  <div className="relative">
                    {scene.video_url ? (
                      <video
                        src={scene.video_url}
                        className="w-32 h-32 object-cover rounded-2xl"
                        muted
                        loop
                        playsInline
                        onMouseEnter={(e) => e.target.play()}
                        onMouseLeave={(e) => e.target.pause()}
                        poster={scene.image_url || scene.prompt_image_url}
                      />
                    ) : (
                      <img
                        src={scene.image_url || scene.prompt_image_url}
                        alt=""
                        className="w-32 h-32 object-cover rounded-2xl"
                      />
                    )}

                    {/* Three Dots Menu */}
                    {hoveredScene === scene.id && (
                      <div className="absolute top-2 right-2">
                        <button
                          onClick={() =>
                            setShowSceneMenu(
                              showSceneMenu === scene.id ? null : scene.id
                            )
                          }
                          className="bg-[#36354080] px-1 py-1 bg-opacity-75 text-white hover:bg-opacity-90 rounded-full transition-all"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {/* Dropdown Menu */}
                        {showSceneMenu === scene.id && (
                          <div className="absolute top-8 right-0 bg-darkBox rounded-lg shadow-lg z-10 min-w-[100px] border border-gray-600">
                            <button
                              onClick={() => handleEditScene(scene)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-darkBoxSub transition-colors rounded-t-lg"
                            >
                              <Edit className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteScene(scene)}
                              className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors rounded-b-lg text-primarioLogo hover:bg-darkBoxSub`}
                              title={"Delete Scene"}
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
                    title={scene.name}
                  >
                    {scene.name}
                  </h1>
                </div>
              ))}
            </div>
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
        availableFrames={project?.frames || []}
        availableScenes={project?.scenes || []}
        onSceneCreated={handleSceneCreated}
      />

      <ModalCreateFrame
        isOpen={isCreateFrameModalOpen}
        onClose={() => setIsCreateFrameModalOpen(false)}
        projectId={project?.id}
        spots={project?.spots || []}
        characters={project?.characters || []}
        existingFrames={project?.frames || []}
        onFrameCreated={handleFrameCreated}
      />

      <ModalEditScene
        isOpen={isEditSceneModalOpen}
        onClose={() => setIsEditSceneModalOpen(false)}
        scene={selectedScene}
        onSceneUpdated={handleSceneUpdated}
      />

      <ModalDeleteScene
        isOpen={isDeleteSceneModalOpen}
        onClose={() => setIsDeleteSceneModalOpen(false)}
        scene={selectedScene}
        onConfirm={handleSceneDeleted}
      />

      <ModalPreview
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        type={previewType}
        data={previewData}
      />

      <ModalEditFrame
        isOpen={isEditFrameModalOpen}
        onClose={() => setIsEditFrameModalOpen(false)}
        frame={selectedFrame}
        onFrameUpdated={handleFrameUpdated}
      />

      <ModalDeleteFrame
        isOpen={isDeleteFrameModalOpen}
        onClose={() => setIsDeleteFrameModalOpen(false)}
        frame={selectedFrame}
        onConfirm={handleFrameDeleted}
      />

      <ModalEditVoice
        isOpen={isEditVoiceModalOpen}
        onClose={() => setIsEditVoiceModalOpen(false)}
        voice={selectedVoice}
        onVoiceUpdated={handleVoiceUpdated}
      />

      <ModalDeleteVoice
        isOpen={isDeleteVoiceModalOpen}
        onClose={() => setIsDeleteVoiceModalOpen(false)}
        voice={selectedVoice}
        onConfirm={handleVoiceDeleted}
      />
    </div>
  );
}

export default MainProject;
