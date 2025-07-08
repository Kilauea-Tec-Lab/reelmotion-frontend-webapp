import Pusher from "pusher-js";
import Cookies from "js-cookie";

let pusherClient;

export function createPusherClient() {
  if (!pusherClient && Cookies.get("token")) {
    pusherClient = new Pusher(import.meta.env.VITE_PUSHER_APP_KEY, {
      cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
      forceTLS: true,
      channelAuthorization: {
        endpoint: `${
          import.meta.env.VITE_APP_BACKEND_URL_WAPI
        }api/broadcasting/auth`,
        headers: {
          Authorization: "Bearer " + Cookies.get("token"),
          // Accept: "application/json",
        },
      },
    });
  }
  return pusherClient;
}
