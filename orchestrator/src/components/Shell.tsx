"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { IconIntake, IconPlug, IconRuns } from "@/components/ui/Icons";

const NAV = [
  { href: "/runs", label: "Runs", Icon: IconRuns },
  { href: "/intake", label: "New task", Icon: IconIntake },
  { href: "/integrations", label: "Integrations", Icon: IconPlug },
];

/**
 * Fixed rail on desktop, horizontal strip on small screens. The rail never
 * competes with the run view: it is one colour, one weight, no chrome.
 */
export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <nav className="sticky top-0 z-30 flex shrink-0 items-center gap-1 border-b border-line bg-canvas/85 px-3 backdrop-blur lg:h-screen lg:w-[188px] lg:flex-col lg:items-stretch lg:gap-0 lg:border-r lg:border-b-0 lg:px-3 lg:py-4 lg:backdrop-blur-none">
        <Link href="/runs" className="flex items-center gap-2.5 py-3 lg:mb-6 lg:px-2">
          <Mark />
          <span className="hidden text-[13px] font-semibold tracking-tight lg:block">Orchestrator</span>
        </Link>

        <div className="flex flex-1 items-center gap-1 overflow-x-auto lg:flex-col lg:items-stretch lg:gap-0.5 lg:overflow-visible">
          {NAV.map(({ href, label, Icon }) => {
            const active = pathname === href || (href === "/runs" && pathname.startsWith("/runs"));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2.5 rounded-sm px-2.5 py-1.5 text-[13px] transition-colors duration-150",
                  active ? "bg-raised text-ink" : "text-ink-3 hover:bg-raised/60 hover:text-ink-2",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>

        <div className="hidden border-t border-line pt-3 lg:block">
          <p className="px-2.5 text-[11px] leading-relaxed text-ink-4">
            Milestone 1
            <br />
            <span className="text-ink-4/70">Mock runtime · no external calls</span>
          </p>
        </div>
      </nav>

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}

function Mark() {
  // Three nodes and two edges: the product in 16 pixels.
  return (
    <svg viewBox="0 0 16 16" className="h-4.5 w-4.5 text-run" aria-hidden>
      <path d="M4 8h3M9 8h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.55" />
      <circle cx="2.4" cy="8" r="1.7" fill="currentColor" opacity="0.5" />
      <circle cx="8" cy="8" r="2.1" fill="currentColor" />
      <circle cx="13.6" cy="8" r="1.7" fill="currentColor" opacity="0.5" />
    </svg>
  );
}
