import Cookies from "js-cookie";

/** Billing details saved on the last token purchase; used to prefill the checkout form. */
export async function getBillingInfo() {
  const response = await fetch(
    `${import.meta.env.VITE_APP_BACKEND_URL}payments/billing-info`,
    {
      headers: {
        Accept: "application/json",
        Authorization: "Bearer " + Cookies.get("token"),
      },
    }
  );
  if (!response.ok) return null;
  return await response.json();
}
