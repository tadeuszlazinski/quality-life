import {
  isPermissionGranted,
  requestPermission,
  sendNotification
} from "@tauri-apps/plugin-notification";
import { playAppSound } from "./sound";

export async function notify(title: string, body: string) {
  try {
    let granted = await isPermissionGranted();
    if (!granted) {
      granted = (await requestPermission()) === "granted";
    }
    if (granted) {
      sendNotification({ title, body });
      playAppSound("notification");
      return;
    }
  } catch {
    // Browser notification fallback below.
  }

  if ("Notification" in window) {
    const permission =
      Notification.permission === "granted"
        ? "granted"
        : await Notification.requestPermission();

    if (permission === "granted") {
      new Notification(title, { body });
      playAppSound("notification");
    }
  }
}
