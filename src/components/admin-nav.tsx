"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [{ href: "/", label: "Dashboard", icon: "📊" }],
  },
  {
    label: "People",
    items: [
      { href: "/users", label: "Users", icon: "👤" },
      { href: "/signup-domains", label: "Signup domains", icon: "🏫" },
      { href: "/whitelisted-emails", label: "Whitelisted emails", icon: "✉️" },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/media", label: "Captions", icon: "💬" },
      { href: "/images", label: "Images", icon: "🖼️" },
      { href: "/votes", label: "Votes", icon: "🗳️" },
      { href: "/terms", label: "Terms", icon: "📖" },
      { href: "/examples", label: "Examples", icon: "⭐" },
    ],
  },
  {
    label: "AI pipeline",
    items: [
      { href: "/requests", label: "Requests", icon: "📨" },
      { href: "/prompt-chains", label: "Prompt chains", icon: "⛓️" },
      { href: "/chain-mix", label: "Chain mix", icon: "🎚️" },
      { href: "/llm-providers", label: "LLM providers", icon: "🏢" },
      { href: "/llm-models", label: "LLM models", icon: "🤖" },
      { href: "/llm-responses", label: "LLM responses", icon: "🧾" },
    ],
  },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto md:flex-col md:gap-4 md:overflow-visible">
      {NAV_GROUPS.map((group) => (
        <div key={group.label} className="flex gap-1 md:flex-col md:gap-0.5">
          <p className="hidden px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 md:block">
            {group.label}
          </p>
          {group.items.map((item) => {
            const isActive =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
                }`}
              >
                <span aria-hidden="true">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
