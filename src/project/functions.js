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
