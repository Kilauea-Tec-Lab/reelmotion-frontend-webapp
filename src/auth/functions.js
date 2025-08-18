import Cookies from "js-cookie";

export async function getAccountInfo() {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_APP_BACKEND_URL}users/get`,
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

export async function createAccount(data) {
  const info = {
    username: data.username,
    name: data.name,
    last_name: data.last_name || "", // Add default if not provided
    email: data.email,
    password: data.password,
  };

  const response = await fetch(
    `${import.meta.env.VITE_APP_BACKEND_URL}users/create`,
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

export async function login(data) {
  const info = {
    email: data.email,
    password: data.password,
  };

  const response = await fetch(
    `${import.meta.env.VITE_APP_BACKEND_URL}auth/login`,
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

export async function getUserInfo() {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_APP_BACKEND_URL}users/get-user-info`,
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

export async function userInfoLoader() {
  const token = Cookies.get("token");

  // Si no hay token, redirigir inmediatamente al login
  if (!token) {
    throw new Response("No token found", {
      status: 401,
      statusText: "Authentication required",
    });
  }

  try {
    const response = await fetch(
      `${import.meta.env.VITE_APP_BACKEND_URL}users/get-user-info`,
      {
        headers: {
          Authorization: "Bearer " + token,
        },
      }
    );

    // Si el token es inválido o expiró
    if (response.status === 401) {
      Cookies.remove("token");
      throw new Response("Token expired", {
        status: 401,
        statusText: "Token expired or invalid",
      });
    }

    if (!response.ok) {
      throw new Response(`Server error: ${response.status}`, {
        status: response.status,
        statusText: `Server responded with ${response.status}`,
      });
    }

    const data = await response.json();

    if (!data?.success) {
      Cookies.remove("token");
      throw new Response("Authentication failed", {
        status: 401,
        statusText: "Invalid response from server",
      });
    }

    return data;
  } catch (error) {
    // Si es un Response ya creado, lo devolvemos tal como está
    if (error instanceof Response) {
      throw error;
    }

    // Para errores de red, JSON parse, etc.
    throw new Response("Network error", {
      status: 500,
      statusText: "Failed to connect to server",
    });
  }
}

export async function getUserNotifications() {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_APP_BACKEND_URL}users/notifications`,
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

export async function deleteNotification(notification_id) {
  try {
    const formData = new FormData();
    formData.append("notification_id", notification_id);

    const response = await fetch(
      `${import.meta.env.VITE_APP_BACKEND_URL}users/delete-notification`,
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + Cookies.get("token"),
        },
        body: formData,
      }
    );
    return response.json();
  } catch (error) {
    return new Response("Ups", { status: 500 });
  }
}
