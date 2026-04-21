import Cookies from "js-cookie";

async function postJSON(path, data) {
  const response = await fetch(
    `${import.meta.env.VITE_APP_BACKEND_URL}${path}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + Cookies.get("token"),
      },
      body: JSON.stringify(data),
    },
  );

  const responseData = await response.json();

  if (response.status === 200 || response.status === 201) {
    return responseData;
  }

  if (!response.ok) {
    const serverMessage =
      responseData?.error || responseData?.message || response.statusText;
    const error = new Error(serverMessage);
    error.response = responseData;
    error.status = response.status;
    throw error;
  }

  return responseData;
}

export async function createSubscription(data) {
  try {
    return await postJSON("suscriptions/create", data);
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
        method: "POST",
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
    return await postJSON("suscriptions/update", data);
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
    throw error;
  }
}

export async function confirmSubscription(data) {
  try {
    return await postJSON("suscriptions/confirm", data);
  } catch (error) {
    console.error("Error confirming subscription:", error);
    throw error;
  }
}

// PayPal Subscription Flow

export async function createPaypalSubscription(data) {
  try {
    return await postJSON("suscriptions/paypal/create", data);
  } catch (error) {
    console.error("Error creating PayPal subscription:", error);
    throw error;
  }
}

export async function capturePaypalSubscription(data) {
  try {
    return await postJSON("suscriptions/paypal/capture", data);
  } catch (error) {
    console.error("Error capturing PayPal subscription:", error);
    throw error;
  }
}

export async function updatePaypalSubscription(data) {
  try {
    return await postJSON("suscriptions/paypal/update", data);
  } catch (error) {
    console.error("Error updating PayPal subscription:", error);
    throw error;
  }
}

export async function switchSubscriptionProvider(data) {
  try {
    return await postJSON("suscriptions/switch-provider", data);
  } catch (error) {
    console.error("Error switching subscription provider:", error);
    throw error;
  }
}

// Force-clear a PayPal subscription record that is orphaned in our DB but no
// longer exists at PayPal (e.g. created in sandbox, migrated to live env).
// Backend should: set paypal_subscription_id = NULL, status = 'invalid',
// WITHOUT calling PayPal cancel API. Safe to call when regular cancel fails
// with RESOURCE_NOT_FOUND.
export async function forceResetPaypalSubscription() {
  try {
    return await postJSON("suscriptions/paypal/force-reset", {});
  } catch (error) {
    console.error("Error force-resetting PayPal subscription:", error);
    throw error;
  }
}
