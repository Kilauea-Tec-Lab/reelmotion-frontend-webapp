import Cookies from "js-cookie";

export async function getInfoToEdit() {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_APP_BACKEND_URL}editor/get-info-to-edit`,
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

// Function to convert file to base64
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}

// Function to compress image and convert to base64
export function compressImageToBase64(file, maxWidth = 1920, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw and compress image
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to base64 with compression
      const compressedBase64 = canvas.toDataURL("image/jpeg", quality);
      resolve(compressedBase64);
    };

    img.onerror = (error) => reject(error);

    // Create object URL for the image
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;
  });
}

// Function to create image via API
export async function createImage(base64Image, imageName) {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_APP_BACKEND_URL}editor/create-image`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + Cookies.get("token"),
        },
        body: JSON.stringify({
          base_64_image: base64Image,
          name: imageName,
        }),
      }
    );

    const responseData = await response.json();

    if (response.ok && responseData.code === 200) {
      // Return the image data from the response
      return {
        id: responseData.image.id || `image_${Date.now()}`,
        name: responseData.image.name,
        image_url: responseData.image.image_url,
        user_id: responseData.image.user_id,
        duration: 5, // default duration for images
        type: "image",
      };
    } else {
      throw new Error(responseData.message || "Error creating image");
    }
  } catch (error) {
    console.error("Error creating image:", error);
    throw error;
  }
}

// Function to handle image drop and upload
export async function handleImageDrop(files) {
  const uploadedImages = [];

  for (const file of files) {
    try {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        console.warn(`File ${file.name} is not an image`);
        continue;
      }

      // Compress and convert to base64
      const compressedBase64 = await compressImageToBase64(file);

      // Upload to server
      const imageData = await createImage(compressedBase64, file.name);

      // imageData ya viene con todas las propiedades necesarias desde createImage
      uploadedImages.push(imageData);
    } catch (error) {
      console.error(`Error processing image ${file.name}:`, error);
    }
  }

  return uploadedImages;
}

// Function to create audio (music/voice) via API
export async function createAudio(type, base64Audio, audioName, duration = null) {
  // type should be 'music' or 'voice'
  try {
    const response = await fetch(
      `${import.meta.env.VITE_APP_BACKEND_URL}editor/create-${type}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + Cookies.get("token"),
        },
        body: JSON.stringify({
          // Use a generic key the backend can map; adjust if needed server-side
          base_64_audio: base64Audio,
          name: audioName,
          duration: duration, // Send the real duration to backend
        }),
      }
    );

    const responseData = await response.json();

    if (response.ok && responseData.code === 200) {
      // Try to normalize different possible payload shapes
      const key = type; // 'music' or 'voice'
      const item =
        responseData[key] ||
        responseData.data ||
        responseData.item ||
        responseData;

      const urlField =
        item?.url ||
        item?.audio_url ||
        item?.[`${type}_url`] ||
        item?.file_url ||
        null;

      return {
        id: item?.id || `${type}_${Date.now()}`,
        name: item?.name || audioName,
        url: urlField,
        user_id: item?.user_id,
        // Use the real duration if available, otherwise fallback to defaults
        duration: duration || item?.duration || (type === "music" ? 30 : 15),
        type,
      };
    } else {
      throw new Error(responseData.message || `Error creating ${type}`);
    }
  } catch (error) {
    console.error(`Error creating ${type}:`, error);
    throw error;
  }
}

// Function to handle audio (music/voice) drop and upload
// Function to get audio duration
function getAudioDuration(file) {
  return new Promise((resolve, reject) => {
    const audio = document.createElement("audio");
    const url = URL.createObjectURL(file);
    
    audio.addEventListener("loadedmetadata", () => {
      URL.revokeObjectURL(url);
      resolve(audio.duration);
    });
    
    audio.addEventListener("error", () => {
      URL.revokeObjectURL(url);
      reject(new Error("Error loading audio file"));
    });
    
    audio.src = url;
  });
}

export async function handleAudioDrop(files, type) {
  const uploaded = [];

  for (const file of files) {
    try {
      if (!file.type.startsWith("audio/")) {
        console.warn(`File ${file.name} is not an audio file`);
        continue;
      }

      // Get audio duration
      const duration = await getAudioDuration(file);

      // Convert to base64 (no compression for audio)
      const base64 = await fileToBase64(file);

      // Upload to server with real duration
      const audioData = await createAudio(type, base64, file.name, duration);

      uploaded.push(audioData);
    } catch (error) {
      console.error(`Error processing ${type} ${file.name}:`, error);
    }
  }

  return uploaded;
}
