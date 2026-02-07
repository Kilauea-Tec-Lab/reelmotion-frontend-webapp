import Cookies from "js-cookie";

export async function createSubscription(data) {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_APP_BACKEND_URL}suscriptions/create`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + Cookies.get("token"),
        },
        body: JSON.stringify(data),
      },
    );

    if (response.status === 201) {
      return response.json();
    }

    if (!response.ok) {
      throw new Error(`Failed to create subscription: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error("Error creating subscription:", error);
    throw error;
  }
}

export async function getMySubscription() {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_APP_BACKEND_URL}suscriptions/my-suscription`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + Cookies.get("token"),
        },
      },
    );

    if (!response.ok) {
      throw new Error("Failed to fetch subscription");
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching subscription:", error);
    throw error;
  }
}

export async function cancelSubscription() {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_APP_BACKEND_URL}suscriptions/cancel`,
      {
        method: "POST", // Asumiendo que es POST basándonos en instrucciones previas para endpoints de acción
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + Cookies.get("token"),
        },
      },
    );

    if (response.status === 200 || response.status === 404) {
      return response.json();
    }

    if (!response.ok) {
      throw new Error("Failed to cancel subscription");
    }

    return response.json();
  } catch (error) {
    console.error("Error canceling subscription:", error);
    throw error;
  }
}

export async function updateSubscription(data) {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_APP_BACKEND_URL}suscriptions/update`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + Cookies.get("token"),
        },
        body: JSON.stringify(data),
      },
    );

    if (response.status === 200 || response.status === 201) {
      return response.json();
    }

    if (!response.ok) {
      throw new Error(`Failed to update subscription: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error("Error updating subscription:", error);
    throw error;
  }
}

export async function getBillingInfo() {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_APP_BACKEND_URL}suscriptions/get-billing-info`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + Cookies.get("token"),
        },
      },
    );

    if (!response.ok) {
      throw new Error("Failed to fetch billing info");
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching billing info:", error);
    // Silent fail or rethrow? Usually better to just log and let form be empty if it fails.
    // But keeping consistency with other functions that throw.
    throw error;
  }
}
