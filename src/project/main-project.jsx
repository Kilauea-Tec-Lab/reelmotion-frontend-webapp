import { span } from "framer-motion/client";
import { Edit, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useLoaderData, useParams, useNavigate } from "react-router-dom";
import ModalEditProject from "../create_elements/modal-edit-project";
import ModalDeleteProject from "../create_elements/modal-delete-project";
import ModalCreateCharacter from "../create_elements/modal-create-character";
import ModalCreateSpot from "../create_elements/modal-create-spot";
import ModalCreateVoice from "../create_elements/modal-create-voice";
import ModalCreateScene from "../create_elements/modal-create-scene";

function MainProject() {
  const id = useParams();
  const data = useLoaderData();
  const navigate = useNavigate();
  const [project, setProject] = useState(data?.data);

  // Estados para los modales
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCreateCharacterModalOpen, setIsCreateCharacterModalOpen] =
    useState(false);
  const [isCreateSpotModalOpen, setIsCreateSpotModalOpen] = useState(false);
  const [isCreateVoiceModalOpen, setIsCreateVoiceModalOpen] = useState(false);
  const [isCreateSceneModalOpen, setIsCreateSceneModalOpen] = useState(false);

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
    // Aquí puedes actualizar el estado del proyecto con el nuevo personaje
    console.log("Character created:", characterData);
    setIsCreateCharacterModalOpen(false);
  };

  const handleCreateSpot = () => {
    setIsCreateSpotModalOpen(true);
  };

  const handleSpotCreated = (spotData) => {
    // Aquí puedes actualizar el estado del proyecto con el nuevo spot
    console.log("Spot created:", spotData);
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
            <span>Hola</span>
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
            <span>Hola</span>
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
        projectId={project?.id}
        onCharacterCreated={handleCharacterCreated}
      />

      <ModalCreateSpot
        isOpen={isCreateSpotModalOpen}
        onClose={() => setIsCreateSpotModalOpen(false)}
        projectId={project?.id}
        onSpotCreated={handleSpotCreated}
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
      />
    </div>
  );
}

export default MainProject;
