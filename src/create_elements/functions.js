import { desc } from "framer-motion/client";
import Cookies from "js-cookie";
import { getUserInfo } from "../auth/functions";

//MULTILOADERS
export async function multiloaderGet() {
  const [folders, projects, user] = await Promise.all([
    getFolders(),
    getProjects(),
    getUserInfo(),
  ]);
  return { folders, projects, user };
}

//FOLDERS
export async function getFolders() {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_APP_BACKEND_URL}folders/get`,
      {
        headers: {
          Authorization: "Bearer " + Cookies.get("token"),
        },
      }
    );
    return response.json();
  } catch (error) {
    return new Response("Ups", { status: 500 });
  }
}

export async function createFolder(data) {
  const info = {
    name: data.name,
    description: data.description,
    folder_type: data.folder_type,
    color: data.color,
    shared_users: data.shared_users || [], // Array of user IDs to share with
  };

  const response = await fetch(
    `${import.meta.env.VITE_APP_BACKEND_URL}folders/create`,
    {
      method: "POST",
      body: JSON.stringify(info),
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + Cookies.get("token"),
      },
    }
  );

  return response;
}

export async function editFolder(data) {
  const info = {
    id: data.id,
    name: data.name,
    description: data.description,
    folder_type: data.folder_type,
    color: data.color,
    shared_users: data.shared_users || [], // Array of user IDs to share with
  };

  const response = await fetch(
    `${import.meta.env.VITE_APP_BACKEND_URL}folders/edit`,
    {
      method: "POST",
      body: JSON.stringify(info),
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + Cookies.get("token"),
      },
    }
  );

  return response;
}

export async function destroyFolder(data) {
  const info = {
    id: data.id,
  };

  const response = await fetch(
    `${import.meta.env.VITE_APP_BACKEND_URL}folders/delete`,
    {
      method: "POST",
      body: JSON.stringify(info),
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + Cookies.get("token"),
      },
    }
  );

  return response;
}

//PROJECTS
export async function getProjects() {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_APP_BACKEND_URL}projects/get`,
      {
        headers: {
          Authorization: "Bearer " + Cookies.get("token"),
        },
      }
    );
    return response.json();
  } catch (error) {
    return new Response("Ups", { status: 500 });
  }
}

export async function createProject(data) {
  const info = {
    name: data.name,
    description: data.description,
    folder_id: data.folder_id,
    project_type: data.project_type,
  };

  const response = await fetch(
    `${import.meta.env.VITE_APP_BACKEND_URL}projects/create`,
    {
      method: "POST",
      body: JSON.stringify(info),
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + Cookies.get("token"),
      },
    }
  );

  return response;
}

export async function editProject(data) {
  const info = {
    id: data.id,
    name: data.name,
    description: data.description,
    folder_id: data.folder_id,
    project_type: data.visibility,
  };

  const response = await fetch(
    `${import.meta.env.VITE_APP_BACKEND_URL}projects/edit`,
    {
      method: "POST",
      body: JSON.stringify(info),
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + Cookies.get("token"),
      },
    }
  );

  return response;
}

export async function destroyProject(data) {
  const info = {
    id: data.id,
  };

  const response = await fetch(
    `${import.meta.env.VITE_APP_BACKEND_URL}projects/delete`,
    {
      method: "POST",
      body: JSON.stringify(info),
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + Cookies.get("token"),
      },
    }
  );

  return response;
}

// Search users by username
export async function searchUsers(username) {
  try {
    const response = await fetch(
      `${
        import.meta.env.VITE_APP_BACKEND_URL
      }users/search?username=${encodeURIComponent(username)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + Cookies.get("token"),
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error searching users:", error);
    return { success: false, error: error.message, data: [] };
  }
}

export async function searchProjects(projectName) {
  try {
    const response = await fetch(
      `${
        import.meta.env.VITE_APP_BACKEND_URL
      }projects/search?name=${encodeURIComponent(projectName)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + Cookies.get("token"),
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error searching projects:", error);
    return { success: false, error: error.message, data: [] };
  }
}

// AUDIOSTACK API FUNCTIONS (Direct REST API calls)
const AUDIOSTACK_API_KEY = "d4218845-b810-421e-a62a-e48a1ba4569a";
const AUDIOSTACK_BASE_URL = "https://v2.api.audio";

// Obtener voces disponibles de AudioStack
export async function getAudioStackVoices() {
  try {
    console.log("Fetching voices from AudioStack API...");

    const response = await fetch(`${AUDIOSTACK_BASE_URL}/speech/voice`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "x-api-key": AUDIOSTACK_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(
        `AudioStack API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    console.log("AudioStack voices response:", data);

    // Verificación defensiva para asegurar que devolvemos un array
    let voicesArray = [];
    if (Array.isArray(data)) {
      voicesArray = data;
    } else if (data && data.data && Array.isArray(data.data.voices)) {
      // Estructura específica de AudioStack: { data: { voices: [...] } }
      voicesArray = data.data.voices;
    } else if (data && Array.isArray(data.voices)) {
      voicesArray = data.voices;
    } else if (data && Array.isArray(data.data)) {
      voicesArray = data.data;
    } else if (data && Array.isArray(data.results)) {
      voicesArray = data.results;
    }

    console.log("Fetched voices:", voicesArray);
    return { success: true, voices: voicesArray };
  } catch (error) {
    console.error("Error fetching AudioStack voices:", error);
    return { success: false, error: error.message, voices: [] };
  }
}

// Crear script en AudioStack
export async function createAudioStackScript(textData) {
  try {
    console.log("Creating script with AudioStack API...");

    const requestBody = {
      projectName: textData.projectName || "reelmotion",
      moduleName: textData.moduleName || "voice_generation",
      scriptName: textData.scriptName || `script_${Date.now()}`,
      scriptText: textData.text,
    };

    const response = await fetch(`${AUDIOSTACK_BASE_URL}/content/script`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "x-api-key": AUDIOSTACK_API_KEY,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `AudioStack API error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const data = await response.json();
    console.log("Script created:", data);
    return { success: true, data: data };
  } catch (error) {
    console.error("Error creating AudioStack script:", error);
    return { success: false, error: error.message };
  }
}

// Generar speech en AudioStack
export async function generateAudioStackSpeech(speechData) {
  try {
    console.log("Generating speech with AudioStack API...");

    const requestBody = {
      scriptId: speechData.scriptId,
      voice: speechData.voiceId,
    };

    const response = await fetch(`${AUDIOSTACK_BASE_URL}/speech/tts`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "x-api-key": AUDIOSTACK_API_KEY,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `AudioStack API error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const ttsData = await response.json();
    console.log("TTS created:", ttsData);

    // Crear mix con el speech generado
    const mixResponse = await fetch(`${AUDIOSTACK_BASE_URL}/production/mix`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "x-api-key": AUDIOSTACK_API_KEY,
      },
      body: JSON.stringify({
        speechId: ttsData.speechId,
      }),
    });

    if (!mixResponse.ok) {
      const errorText = await mixResponse.text();
      throw new Error(
        `AudioStack Mix API error: ${mixResponse.status} ${mixResponse.statusText} - ${errorText}`
      );
    }

    const mixData = await mixResponse.json();
    console.log("Mix created:", mixData);

    // Codificar a MP3 de alta calidad
    const encodeResponse = await fetch(
      `${AUDIOSTACK_BASE_URL}/delivery/encoder`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "x-api-key": AUDIOSTACK_API_KEY,
        },
        body: JSON.stringify({
          productionId: mixData.productionId,
          preset: "mp3_high",
        }),
      }
    );

    if (!encodeResponse.ok) {
      const errorText = await encodeResponse.text();
      throw new Error(
        `AudioStack Encoder API error: ${encodeResponse.status} ${encodeResponse.statusText} - ${errorText}`
      );
    }

    const encodeData = await encodeResponse.json();
    console.log("Encoding completed:", encodeData);

    // Obtener la URL del archivo generado
    const audioUrl =
      encodeData.url || encodeData.downloadUrl || encodeData.fileUrl;

    return {
      success: true,
      data: {
        audioUrl: audioUrl,
        url: audioUrl,
        speechId: ttsData.speechId,
        mixId: mixData.productionId,
        encodeId: encodeData.encodeId,
        duration: ttsData.duration || null,
      },
    };
  } catch (error) {
    console.error("Error generating AudioStack speech:", error);
    return { success: false, error: error.message };
  }
}

// Crear voz en el backend (única función que va al backend)
export async function createVoice(voiceData) {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_APP_BACKEND_URL}voice/create`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + Cookies.get("token"),
        },
        body: JSON.stringify(voiceData),
      }
    );

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("Error creating voice:", error);
    return { success: false, error: error.message };
  }
}
