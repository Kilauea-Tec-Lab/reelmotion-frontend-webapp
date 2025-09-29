import { useState, useEffect } from "react";
import { Bot } from "lucide-react";
import ProjectAgent from "./project-agent";

function ProjectAgentManager() {
  const [openAgents, setOpenAgents] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Escucha eventos globales para abrir agentes
  useEffect(() => {
    const handleOpenAgent = (event) => {
      const { projectId, projectName } = event.detail;
      openAgent(projectId, projectName);
    };

    window.addEventListener("openProjectAgent", handleOpenAgent);

    return () => {
      window.removeEventListener("openProjectAgent", handleOpenAgent);
    };
  }, []);

  // Verifica si hay agentes abiertos para mostrar/ocultar el componente
  useEffect(() => {
    setIsVisible(openAgents.length > 0);
  }, [openAgents]);

  const openAgent = (projectId, projectName) => {
    // Verifica si ya existe un agente para este proyecto
    const existingAgent = openAgents.find(
      (agent) => agent.projectId === projectId
    );

    if (!existingAgent) {
      const newAgent = {
        id: Date.now(),
        projectId,
        projectName,
      };
      setOpenAgents((prev) => [...prev, newAgent]);
      setIsMinimized(false); // Asegurarse de que la ventana esté visible
    } else {
      // Si ya existe, asegurarse de que la ventana esté visible
      setIsMinimized(false);
    }
  };

  const closeAllAgents = () => {
    setOpenAgents([]);
    setIsMinimized(false);
  };

  const removeAgent = (agentId) => {
    setOpenAgents((prev) => prev.filter((agent) => agent.id !== agentId));
  };

  const minimizeWindow = () => {
    setIsMinimized(true);
  };

  const maximizeWindow = () => {
    setIsMinimized(false);
  };

  if (!isVisible) {
    return null;
  }

  // Si está minimizado, mostrar solo el botón flotante
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-20 z-40">
        <button
          onClick={maximizeWindow}
          className="bg-[#F2D543] hover:bg-[#f2f243] text-primarioDark p-3 rounded-full shadow-lg transition-all transform hover:scale-105 relative"
          title={`Project Agents (${openAgents.length})`}
        >
          <Bot size={20} />
          {openAgents.length > 1 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {openAgents.length}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <ProjectAgent
      agents={openAgents}
      onClose={closeAllAgents}
      onMinimize={minimizeWindow}
      onRemoveAgent={removeAgent}
      isMinimized={false}
    />
  );
}

// Función utilitaria para abrir un agente desde cualquier componente
export const openProjectAgent = (projectId, projectName) => {
  const event = new CustomEvent("openProjectAgent", {
    detail: { projectId, projectName },
  });
  window.dispatchEvent(event);
};

export default ProjectAgentManager;
