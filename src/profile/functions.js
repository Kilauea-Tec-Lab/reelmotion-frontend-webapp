import Cookies from "js-cookie";

// Función para actualizar el perfil del usuario
export const updateUserProfile = async (profileData) => {
  try {
    const formData = new FormData();

    // Agregar los campos de texto al FormData
    if (profileData.name) formData.append("name", profileData.name);
    if (profileData.email) formData.append("email", profileData.email);
    if (profileData.phone) formData.append("phone", profileData.phone);

    // Agregar la imagen solo si hay una nueva imagen
    if (profileData.profile_image instanceof File) {
      formData.append("profile_image", profileData.profile_image);
    }

    const response = await fetch(
      `${import.meta.env.VITE_APP_BACKEND_URL}users/update`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Cookies.get("token")}`,
        },
        body: formData,
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Error updating profile");
    }

    return result;
  } catch (error) {
    console.error("Error updating profile:", error);
    throw error;
  }
};
