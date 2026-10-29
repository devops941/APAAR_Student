"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  GraduationCap,
  ClipboardList,
  FileText,
  ShieldCheck,
  ScrollText,
  GraduationCap as Logo,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Institutions", href: "/institutions", icon: Building2 },
  { label: "Students", href: "/students", icon: GraduationCap },
  { label: "Academic Records", href: "/academic-records", icon: ClipboardList },
  { label: "Documents", href: "/documents", icon: FileText },
  { label: "Verification", href: "/verifications", icon: ShieldCheck },
  { label: "Audit Logs", href: "/audit-logs", icon: ScrollText },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <aside className="flex w-[248px] flex-shrink-0 flex-col border-r border-border bg-surface">
      {/* Logo / Brand */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white">
          <Logo className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-ink">APAAR Platform</p>
          <p className="text-xs text-ink-muted">Student Data & Verification</p>
        </div>
        {onNavigate && (
          <button
            onClick={onNavigate}
            className="rounded-md p-1 text-ink-muted hover:bg-canvas lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                isActive
                  ? "bg-primary-light text-primary"
                  : "text-ink-light hover:bg-canvas hover:text-ink"
              )}
            >
              <Icon className="h-4.5 w-4.5 flex-shrink-0" strokeWidth={2} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-4">
        <p className="text-xs text-ink-muted">
          © 2026 APAAR Platform
          <br />
          AICTE Demonstration Build
        </p>
      </div>
    </aside>
  );
}
