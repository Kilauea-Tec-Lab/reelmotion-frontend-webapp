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

// ELEVENLABS API FUNCTIONS
const ELEVENLABS_API_KEY = "sk_2255a4e8aaeaf2c8211f2ffc968686b602250cd260314f16";
const ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1";

// Obtener voces disponibles de ElevenLabs
export async function getElevenLabsVoices() {
  try {
    console.log("Fetching voices from ElevenLabs API...");

    const response = await fetch(`${ELEVENLABS_BASE_URL}/voices`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "xi-api-key": ELEVENLABS_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(
        `ElevenLabs API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    console.log("ElevenLabs voices response:", data);

    // ElevenLabs devuelve las voces en un array de voices
    const voicesArray = data.voices || [];

    // Log the first voice to understand the structure
    if (voicesArray.length > 0) {
      console.log("First voice structure:", voicesArray[0]);
      console.log("Voice fields:", Object.keys(voicesArray[0]));
    }

    console.log("Fetched voices:", voicesArray);
    return { success: true, voices: voicesArray };
  } catch (error) {
    console.error("Error fetching ElevenLabs voices:", error);
    return { success: false, error: error.message, voices: [] };
  }
}

// Generar speech con ElevenLabs
export async function generateElevenLabsSpeech(speechData) {
  try {
    console.log("Generating speech with ElevenLabs API...");
    console.log("Speech data received:", speechData);

    if (!speechData.voiceId) {
      throw new Error("voiceId is required but not provided");
    }

    if (!speechData.text) {
      throw new Error("text is required but not provided");
    }

    const requestBody = {
      text: speechData.text,
      model_id: speechData.model_id || "eleven_multilingual_v2", // Default to multilingual v2
      voice_settings: {
        stability: speechData.stability || 0.5,
        similarity_boost: speechData.similarity_boost || 0.5,
        style: speechData.style || 0.0,
        use_speaker_boost: speechData.use_speaker_boost || true,
      },
    };

    console.log("Request body for ElevenLabs TTS:", requestBody);

    const response = await fetch(
      `${ELEVENLABS_BASE_URL}/text-to-speech/${speechData.voiceId}`,
      {
        method: "POST",
        headers: {
          Accept: "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": ELEVENLABS_API_KEY,
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `ElevenLabs API error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    // Get audio blob from response
    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);

    // Calculate estimated duration (rough estimate based on text length)
    const words = speechData.text.trim().split(/\s+/).length;
    const estimatedDuration = (words / 150) * 60; // 150 words per minute

    return {
      success: true,
      data: {
        audioUrl: audioUrl,
        audioBlob: audioBlob,
        format: "mp3",
        duration: estimatedDuration,
        textUsed: speechData.text,
        voiceId: speechData.voiceId,
        model_id: requestBody.model_id,
        voice_settings: requestBody.voice_settings,
      },
    };
  } catch (error) {
    console.error("Error generating ElevenLabs speech:", error);
    return { success: false, error: error.message };
  }
}

// Crear voz en el backend usando ElevenLabs
export async function createElevenLabsVoice(voiceData) {
  try {
    // Convertir el blob de audio a base64
    const base64Audio = await blobToBase64(voiceData.audio_blob);
    
    const requestBody = {
      name: voiceData.name,
      description: voiceData.description,
      base_64_audio: base64Audio,
      duration: voiceData.duration,
      format: voiceData.format,
      text_used: voiceData.text_used,
      voice_id: voiceData.voice_id,
      voice_name: voiceData.voice_name,
      model_id: voiceData.model_id,
      voice_settings: voiceData.voice_settings,
    };

    const response = await fetch(
      `${import.meta.env.VITE_APP_BACKEND_URL}editor/create-voice`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + Cookies.get("token"),
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("Error creating ElevenLabs voice:", error);
    return { success: false, error: error.message };
  }
}

// Función helper para convertir blob a base64
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      resolve(dataUrl);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
