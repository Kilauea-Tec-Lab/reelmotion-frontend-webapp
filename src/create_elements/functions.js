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
