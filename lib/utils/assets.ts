export function getAssetUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  if (!base) return path;
  // Idempotent: don't double-prefix if already prefixed
  if (path.startsWith(base)) return path;
  // Ensure leading slash
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}
