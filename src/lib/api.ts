/** Base URL for API calls. Set NEXT_PUBLIC_API_BASE when deploying static frontend to GitHub Pages. */
export function getApiBase(): string {
  const base = process.env.NEXT_PUBLIC_API_BASE;
  return base && typeof base === "string" ? base.replace(/\/$/, "") : "";
}
