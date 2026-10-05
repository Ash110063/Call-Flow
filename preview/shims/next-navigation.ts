import { navigate, splitPath, useLocation } from "./router";

export function useRouter() {
  return { push: navigate, replace: navigate, back: () => navigate("/"), refresh: () => {}, prefetch: () => {} };
}

export function usePathname() {
  return splitPath(useLocation()).path;
}

export function useSearchParams() {
  return new URLSearchParams(splitPath(useLocation()).query);
}

export function useParams<T extends Record<string, string>>(): T {
  const m = splitPath(useLocation()).path.match(/^\/jobs\/(\d+)$/);
  return (m ? { id: m[1] } : {}) as unknown as T;
}

export function notFound() {
  navigate("/");
}
