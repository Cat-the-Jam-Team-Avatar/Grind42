"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Ana Sayfa" },
  { href: "/market", label: "Market" },
  { href: "/leaderboard", label: "Liderlik" },
  { href: "/dev", label: "Dev" },
];

export default function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center justify-center gap-2 max-[920px]:justify-start max-[920px]:overflow-x-auto max-[920px]:pb-[2px]" aria-label="Ana navigasyon">
      {NAV_ITEMS.map((item) => {
        const isActive =
          item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            className={`nes-btn min-w-0 whitespace-nowrap !px-[10px] !py-2 !text-[9px] max-[560px]:!text-[8px] max-[560px]:!py-[7px] max-[560px]:!px-2 ${isActive ? "is-primary" : ""}`}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
