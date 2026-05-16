"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Ana Sayfa" },
  { href: "/market", label: "Market" },
  { href: "/leaderboard", label: "Liderlik" },
  { href: "/dev", label: "Dev" },
];

export default function AppNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/auth/sign-out", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <nav
      className="flex items-center gap-1 max-[920px]:overflow-x-auto max-[920px]:pb-[2px]"
      aria-label="Ana navigasyon"
    >
      {NAV_ITEMS.map((item) => {
        const isActive =
          item.href === "/dashboard"
            ? pathname === item.href
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={[
              "relative whitespace-nowrap px-3 py-2 text-[11px] font-[var(--font-silkscreen),monospace] tracking-wide transition-colors duration-75",
              "border-b-[3px]",
              isActive
                ? "text-g42-accent border-g42-accent"
                : "text-g42-muted border-transparent hover:text-g42-ink hover:border-g42-line",
            ].join(" ")}
          >
            {item.label}
          </Link>
        );
      })}

      <button
        type="button"
        onClick={handleLogout}
        className="ml-2 whitespace-nowrap px-3 py-2 text-[11px] font-[var(--font-silkscreen),monospace] tracking-wide border-b-[3px] border-transparent text-g42-muted hover:text-g42-danger hover:border-g42-danger transition-colors duration-75 cursor-pointer"
        aria-label="Çıkış yap"
      >
        Çıkış
      </button>
    </nav>
  );
}
