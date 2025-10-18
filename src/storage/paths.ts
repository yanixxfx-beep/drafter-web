// Path utilities for OPFS storage
export function splitPath(path: string) {
  const trimmed = path.replace(/^\/+|\/+$/g, "");
  const parts = trimmed.split("/");
  return {
    dirs: parts.slice(0, -1).filter(Boolean),
    file: parts[parts.length - 1],
  };
}



