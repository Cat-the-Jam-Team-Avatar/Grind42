"use client";

import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className="nes-btn w-[42px] h-[42px] !p-0 !text-[14px] !leading-none"
      aria-label={isDark ? "Aydınlık temaya geç" : "Karanlık temaya geç"}
      title={isDark ? "Aydınlık tema" : "Karanlık tema"}
      onClick={toggleTheme}
      suppressHydrationWarning
    >
      {isDark ? "☀" : "☾"}
    </button>
  );
}
