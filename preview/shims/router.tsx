// In-memory router that stands in for next/link and next/navigation in the single-page preview.
import { useSyncExternalStore } from "react";

let current = "/";
const listeners = new Set<() => void>();

export function navigate(to: string) {
  if (to.startsWith("#")) to = to.slice(1);
  if (to === current) return;
  current = to;
  listeners.forEach((l) => l());
  window.scrollTo(0, 0);
}

export function useLocation() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => current,
  );
}

export const splitPath = (loc: string) => {
  const [path, query = ""] = loc.split("?");
  return { path, query };
};
