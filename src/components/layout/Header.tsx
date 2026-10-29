"use client";

import { useEffect, useState } from "react";
import { Menu, Bell, LogOut, User } from "lucide-react";
import Link from "next/link";

interface MeResponse {
  success: boolean;
  data?: {
    name: string;
    email: string;
    role: string;
    institutionName?: string;
  };
}

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const [user, setUser] = useState<MeResponse["data"] | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: MeResponse) => {
        if (data?.success && data.data) setUser(data.data);
      })
      .catch(() => {});
  }, []);

  return (
    <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-border bg-surface px-4 lg:px-6">
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="rounded-md p-2 text-ink-muted hover:bg-canvas lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Page context */}
      <div className="hidden lg:block">
        <p className="text-sm font-medium text-ink">
          APAAR Student Academic Platform
        </p>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        <button
          className="rounded-md p-2 text-ink-muted hover:bg-canvas"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-canvas"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-white">
              {user?.name?.charAt(0).toUpperCase() ?? <User className="h-4 w-4" />}
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-sm font-medium text-ink">
                {user?.name ?? "Loading..."}
              </p>
              <p className="text-xs text-ink-muted">
                {user?.role?.replace(/_/g, " ") ?? ""}
              </p>
            </div>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border border-border bg-surface py-2 shadow-lg">
              <div className="border-b border-border px-4 py-2">
                <p className="text-sm font-medium text-ink">
                  {user?.name ?? "Guest"}
                </p>
                <p className="text-xs text-ink-muted">{user?.email ?? ""}</p>
                {user?.institutionName && (
                  <p className="text-xs text-ink-muted">{user.institutionName}</p>
                )}
              </div>
              <Link
                href="/profile"
                className="flex items-center gap-2 px-4 py-2 text-sm text-ink-light hover:bg-canvas"
              >
                <User className="h-4 w-4" /> My Profile
              </Link>
              <button
                onClick={async () => {
                  await fetch("/api/auth/logout", { method: "POST" });
                  window.location.href = "/login";
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-danger hover:bg-canvas"
              >
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
