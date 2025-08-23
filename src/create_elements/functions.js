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
    // Crear FormData para enviar el archivo de audio
    const formData = new FormData();
    
    // Agregar el blob de audio
    if (voiceData.audio_blob) {
      formData.append('audio_file', voiceData.audio_blob, 'voice.mp3');
    }
    
    // Agregar el resto de los datos como JSON
    const jsonData = {
      name: voiceData.name,
      description: voiceData.description,
      duration: voiceData.duration,
      format: voiceData.format,
      text_used: voiceData.text_used,
      voice_id: voiceData.voice_id,
      voice_name: voiceData.voice_name,
      model_id: voiceData.model_id,
      voice_settings: voiceData.voice_settings,
      project_id: voiceData.project_id,
    };
    
    formData.append('voice_data', JSON.stringify(jsonData));

    const response = await fetch(
      `${import.meta.env.VITE_APP_BACKEND_URL}projects/create-elevenlabs-voice`,
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + Cookies.get("token"),
          // No incluir Content-Type para que el navegador lo establezca automáticamente con boundary
        },
        body: formData,
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

    // Log the first voice to understand the structure
    if (voicesArray.length > 0) {
      console.log("First voice structure:", voicesArray[0]);
      console.log("Voice fields:", Object.keys(voicesArray[0]));
    }

    console.log("Fetched voices:", voicesArray);
    return { success: true, voices: voicesArray };
  } catch (error) {
    console.error("Error fetching AudioStack voices:", error);
    return { success: false, error: error.message, voices: [] };
  }
}

// Get authenticated audio preview from AudioStack
export async function getAudioStackPreview(audioUrl) {
  try {
    console.log("Fetching audio preview:", audioUrl);

    const response = await fetch(audioUrl, {
      method: "GET",
      headers: {
        "x-api-key": AUDIOSTACK_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(
        `AudioStack preview error: ${response.status} ${response.statusText}`
      );
    }

    const audioBlob = await response.blob();
    const audioBlobUrl = URL.createObjectURL(audioBlob);

    return { success: true, audioUrl: audioBlobUrl };
  } catch (error) {
    console.error("Error fetching AudioStack preview:", error);
    return { success: false, error: error.message };
  }
}

// Get authenticated generated audio from AudioStack
export async function getAudioStackGeneratedAudio(audioUrl) {
  try {
    console.log("Fetching generated audio:", audioUrl);

    // For generated audio URLs, we need to use a different approach
    const response = await fetch(audioUrl, {
      method: "GET",
      headers: {
        "x-api-key": AUDIOSTACK_API_KEY,
        "Content-Type": "audio/mpeg",
      },
      mode: "cors",
    });

    if (!response.ok) {
      throw new Error(
        `AudioStack generated audio error: ${response.status} ${response.statusText}`
      );
    }

    const audioBlob = await response.blob();
    const audioBlobUrl = URL.createObjectURL(audioBlob);

    return { success: true, audioUrl: audioBlobUrl };
  } catch (error) {
    console.error("Error fetching AudioStack generated audio:", error);
    // If direct fetch fails due to CORS, try alternative approach
    try {
      console.log("Trying alternative approach for generated audio...");

      // Create a temporary audio element to test if the URL works directly
      const audio = new Audio();
      audio.crossOrigin = "anonymous";

      return new Promise((resolve) => {
        audio.oncanplaythrough = () => {
          console.log("Generated audio URL works directly");
          resolve({ success: true, audioUrl: audioUrl });
        };

        audio.onerror = () => {
          console.log("Generated audio URL doesn't work directly");
          resolve({
            success: false,
            error: "Cannot access generated audio due to CORS restrictions",
          });
        };

        audio.src = audioUrl;
      });
    } catch (fallbackError) {
      console.error("Fallback approach also failed:", fallbackError);
      return { success: false, error: error.message };
    }
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

    // AudioStack returns scriptId inside data object
    const scriptId = data.data?.scriptId || data.scriptId || data.id;
    if (!scriptId) {
      console.error("No scriptId found in response:", data);
      throw new Error("No scriptId returned from AudioStack API");
    }

    return { success: true, data: { ...data.data, scriptId } };
  } catch (error) {
    console.error("Error creating AudioStack script:", error);
    return { success: false, error: error.message };
  }
}

// Generar speech en AudioStack
export async function generateAudioStackSpeech(speechData) {
  try {
    console.log("Generating speech with AudioStack API...");
    console.log("Speech data received:", speechData);

    if (!speechData.scriptId) {
      throw new Error("scriptId is required but not provided");
    }

    if (!speechData.voiceId) {
      throw new Error("voiceId is required but not provided");
    }

    const requestBody = {
      scriptId: speechData.scriptId,
      voice: speechData.voiceId,
    };

    console.log("Request body for TTS:", requestBody);

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

    // Extract speechId from the correct location in the response
    const speechId =
      ttsData.data?.speechId ||
      ttsData.speechId ||
      ttsData.data?.id ||
      ttsData.id;
    if (!speechId) {
      console.error("No speechId found in TTS response:", ttsData);
      throw new Error("No speechId returned from TTS API");
    }

    console.log("Using speechId for mix:", speechId);

    // Crear mix con el speech generado
    const mixRequestBody = {
      speechId: speechId,
    };

    console.log("Mix request body:", mixRequestBody);

    const mixResponse = await fetch(`${AUDIOSTACK_BASE_URL}/production/mix`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "x-api-key": AUDIOSTACK_API_KEY,
      },
      body: JSON.stringify(mixRequestBody),
    });

    if (!mixResponse.ok) {
      const errorText = await mixResponse.text();
      throw new Error(
        `AudioStack Mix API error: ${mixResponse.status} ${mixResponse.statusText} - ${errorText}`
      );
    }

    const mixData = await mixResponse.json();
    console.log("Mix created:", mixData);

    // Extract productionId from mix response, with fallback to speechId
    const productionId =
      mixData.data?.productionId ||
      mixData.productionId ||
      mixData.data?.id ||
      mixData.id;

    console.log("Using productionId for encoder:", productionId);
    console.log("Available speechId as fallback:", speechId);

    // Prepare encoder request body
    const encoderRequestBody = {};

    if (productionId) {
      encoderRequestBody.productionId = productionId;
    } else if (speechId) {
      // Fallback to speechId if no productionId available
      encoderRequestBody.speechId = speechId;
    } else {
      throw new Error("No productionId or speechId available for encoding");
    }

    encoderRequestBody.preset = "mp3_high";

    console.log("Encoder request body:", encoderRequestBody);

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
        body: JSON.stringify(encoderRequestBody),
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

    // Obtener la URL del archivo generado - estructura: { data: { url: "...", format: "mp3" } }
    const audioUrl =
      encodeData.data?.url ||
      encodeData.url ||
      encodeData.downloadUrl ||
      encodeData.fileUrl;

    if (!audioUrl) {
      console.error("No audio URL found in encode response:", encodeData);
      throw new Error("No audio URL returned from encoder");
    }

    return {
      success: true,
      data: {
        audioUrl: audioUrl,
        url: audioUrl,
        format: encodeData.data?.format || "mp3",
        speechId: speechId,
        productionId: productionId,
        duration: ttsData.data?.duration || ttsData.duration || null,
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
      `${import.meta.env.VITE_APP_BACKEND_URL}projects/create-voice`,
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
