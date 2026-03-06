export const THEME_KEY = "utilities-theme";

export type Theme = "light" | "dark";

export const resolveTheme = (candidate?: string | null): Theme | null => {
  if (candidate === "light" || candidate === "dark") return candidate;
  return null;
};
