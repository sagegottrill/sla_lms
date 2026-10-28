import { useForumRealtime } from "@/hooks/useForumRealtime";

/** Mounts global forum toast/notification popups (same hook the web app uses). */
export default function ForumAlerts() {
  useForumRealtime();
  return null;
}
