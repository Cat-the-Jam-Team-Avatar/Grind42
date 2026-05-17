"use client";

import { useTheme } from "./ThemeProvider";

export default function ThemeToggle({ size = "md" }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const sizeClass =
    size === "sm" ? "w-8 h-8 text-[13px]" : "w-10 h-10 text-[15px]";

  return (
    <button
      type="button"
      className={`${sizeClass} shrink-0 flex items-center justify-center border-[3px] border-g42-line bg-g42-paper text-g42-ink shadow-[3px_3px_0_var(--g42-line)] hover:bg-g42-paper-2 active:shadow-none active:translate-x-[3px] active:translate-y-[3px] transition-[box-shadow,transform] duration-75 cursor-pointer`}
      aria-label={isDark ? "Aydınlık temaya geç" : "Karanlık temaya geç"}
      title={isDark ? "Aydınlık tema" : "Karanlık tema"}
      onClick={toggleTheme}
      suppressHydrationWarning
    >
      <span aria-hidden="true" suppressHydrationWarning>
        {isDark ? "☀" : "☾"}
      </span>
    </button>
  );
}
