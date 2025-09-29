import React, { createContext, useContext, useState, useEffect } from "react";

const ProjectAgentContext = createContext();

export const useProjectAgent = () => {
  const context = useContext(ProjectAgentContext);
  if (!context) {
    throw new Error(
      "useProjectAgent must be used within a ProjectAgentProvider"
    );
  }
  return context;
};

export const ProjectAgentProvider = ({ children }) => {
  const [openAgents, setOpenAgents] = useState([]);

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
        isMinimized: false,
        messages: [],
        lastActivity: new Date(),
      };
      setOpenAgents((prev) => [...prev, newAgent]);
    } else {
      // Si ya existe, lo trae al frente y lo desminiaturiza
      setOpenAgents((prev) =>
        prev.map((agent) =>
          agent.projectId === projectId
            ? { ...agent, isMinimized: false, lastActivity: new Date() }
            : agent
        )
      );
    }
  };

  const closeAgent = (agentId) => {
    setOpenAgents((prev) => prev.filter((agent) => agent.id !== agentId));
  };

  const minimizeAgent = (agentId) => {
    setOpenAgents((prev) =>
      prev.map((agent) =>
        agent.id === agentId ? { ...agent, isMinimized: true } : agent
      )
    );
  };

  const updateAgentMessages = (agentId, messages) => {
    setOpenAgents((prev) =>
      prev.map((agent) =>
        agent.id === agentId
          ? { ...agent, messages, lastActivity: new Date() }
          : agent
      )
    );
  };

  const getAgentData = (agentId) => {
    return openAgents.find((agent) => agent.id === agentId);
  };

  const value = {
    openAgents,
    openAgent,
    closeAgent,
    minimizeAgent,
    updateAgentMessages,
    getAgentData,
  };

  return (
    <ProjectAgentContext.Provider value={value}>
      {children}
    </ProjectAgentContext.Provider>
  );
};

// Función utilitaria para abrir un agente desde cualquier componente
export const openProjectAgent = (projectId, projectName) => {
  const event = new CustomEvent("openProjectAgent", {
    detail: { projectId, projectName },
  });
  window.dispatchEvent(event);
};
