import Cookies from "js-cookie";

export async function getProjects(id) {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_APP_BACKEND_URL}projects/get/${id}`,
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

export async function createImageFreepik(data) {
  const info = {
    prompt: data.prompt,
  };

  const response = await fetch(
    `${import.meta.env.VITE_APP_BACKEND_URL}ai/generate-image-freepik`,
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

export async function createImageOpenAI(data) {
  const info = {
    prompt: data.prompt,
    base_image: data.base_image,
  };

  const response = await fetch(
    `${import.meta.env.VITE_APP_BACKEND_URL}ai/generate-image-openai`,
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

export async function createImageNanoBanana(data) {
  const info = {
    prompt: data.prompt,
    base_image: data.base_image, // base64
  };

  const response = await fetch(
    `${import.meta.env.VITE_APP_BACKEND_URL}ai/generate-image-nano-banana`,
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

export async function createCharacter(data) {
  const info = {
    project_id: data.project_id, // Asegurarse de enviar el ID del proyecto
    type: data.type,
    ai_model: data.ai_model,
    prompt: data.prompt,
    base_64_image: data.base_64_image,
    name: data.name,
    description: data.description,
  };

  const response = await fetch(
    `${import.meta.env.VITE_APP_BACKEND_URL}projects/create-character`,
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

export async function editCharacter(data) {
  const info = {
    id: data.id,
    name: data.name,
    description: data.description,
  };

  const response = await fetch(
    `${import.meta.env.VITE_APP_BACKEND_URL}projects/edit-character`,
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

export async function destroyCharacter(data) {
  const info = {
    id: data.id,
  };

  const response = await fetch(
    `${import.meta.env.VITE_APP_BACKEND_URL}projects/delete-character`,
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

export async function createSpot(data) {
  const info = {
    project_id: data.project_id, // Asegurarse de enviar el ID del proyecto
    type: data.type,
    ai_model: data.ai_model,
    prompt: data.prompt,
    base_64_image: data.base_64_image,
    name: data.name,
    description: data.description,
  };

  const response = await fetch(
    `${import.meta.env.VITE_APP_BACKEND_URL}projects/create-spot`,
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

export async function editSpot(data) {
  const info = {
    id: data.id,
    name: data.name,
    description: data.description,
  };

  const response = await fetch(
    `${import.meta.env.VITE_APP_BACKEND_URL}projects/edit-spot`,
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

export async function destroySpot(data) {
  const info = {
    id: data.id,
  };

  const response = await fetch(
    `${import.meta.env.VITE_APP_BACKEND_URL}projects/delete-spot`,
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

export async function editFrame(data) {
  const info = {
    id: data.id,
    name: data.name,
    description: data.description,
  };

  const response = await fetch(
    `${import.meta.env.VITE_APP_BACKEND_URL}projects/edit-frame`,
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

export async function destroyFrame(data) {
  const info = {
    id: data.id,
  };

  const response = await fetch(
    `${import.meta.env.VITE_APP_BACKEND_URL}projects/delete-frame`,
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

/* VIDEO GENERATRION */
export async function createRunwayVideo(data) {
  const info = {
    project_id: data.project_id, // Asegurarse de enviar el ID del proyecto
    characters: data.characters,
    spots: data.spots,
    ai_model: data.ai_model,
    ai_prompt: data.ai_prompt,
    video_duration: data.video_duration,
  };

  const response = await fetch(
    `${import.meta.env.VITE_APP_BACKEND_URL}ai/generate-video-runway`,
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
