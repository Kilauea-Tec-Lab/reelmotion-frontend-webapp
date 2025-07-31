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
