"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Dumbbell,
  Home,
  LineChart,
  ListChecks,
} from "lucide-react";

const ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/routines", label: "Routines", icon: ListChecks },
  { href: "/log", label: "Log", icon: Dumbbell },
  { href: "/progress", label: "Progress", icon: LineChart },
  { href: "/calendar", label: "History", icon: CalendarDays },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 z-10 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)]">
      <ul className="flex">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] uppercase tracking-wide ${
                  isActive ? "text-accent" : "text-fg-muted"
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
