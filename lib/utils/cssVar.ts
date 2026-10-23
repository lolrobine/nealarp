/**
 * Read a theme custom property as a concrete colour, for canvas drawing.
 *
 * Canvas takes colour strings, not CSS variables, so themed canvases used to
 * hardcode a hex value — which means one of the two themes always got the
 * wrong one. This reads the value the page is actually using.
 *
 * The fallback covers server rendering and jsdom, where there is no computed
 * style to read.
 */
export function cssVar(name: string, fallback: string): string {
  if (typeof window === "undefined" || typeof getComputedStyle !== "function") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}
