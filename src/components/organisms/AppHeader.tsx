"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { EmployeeAvatar, Text } from "@/components/atoms";

type Props = {
  userEmail: string | null;
};

export const AppHeader = ({ userEmail }: Props) => {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 h-(--header-height) bg-(--background)/80 backdrop-blur-sm">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-10">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <Text as="span" className="font-serif text-lg text-(--heading)">
            Workforce
          </Text>
        </Link>

        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            className="flex items-center gap-2 rounded-full px-1.5 py-1 transition hover:bg-(--secondary-bg)"
          >
            <EmployeeAvatar seed={userEmail ?? "you"} size="sm" />
            <ChevronDown size={16} className="text-(--muted-faint)" />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-56 rounded-2xl bg-(--surface) py-1"
            >
              {userEmail && (
                <div className="px-3.5 py-2.5">
                  <Text size="sm" tone="muted" className="truncate">
                    {userEmail}
                  </Text>
                </div>
              )}
              <Link
                href="/settings"
                role="menuitem"
                onClick={() => setMenuOpen(false)}
                className="block w-full px-3.5 py-2.5 text-left text-sm text-(--body) transition hover:bg-(--secondary-bg)"
              >
                Settings
              </Link>
              <button
                type="button"
                role="menuitem"
                onClick={handleSignOut}
                className="w-full px-3.5 py-2.5 text-left text-sm text-(--body) transition hover:bg-(--secondary-bg)"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
