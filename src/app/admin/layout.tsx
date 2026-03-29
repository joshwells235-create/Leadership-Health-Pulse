"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // Don't show nav on the login page
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  const navItems = [
    { href: "/admin", label: "Companies" },
    { href: "/admin/leads", label: "Leads" },
  ];

  return (
    <div className="min-h-screen bg-light-gray">
      {/* Top Nav */}
      <nav className="bg-navy shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            {/* Logo + Nav Links */}
            <div className="flex items-center gap-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <Link href="/admin" className="flex items-center gap-2">
                <img
                  src="/leadshift-logo-white.svg"
                  alt="LeadShift"
                  className="h-6 opacity-90"
                />
              </Link>
              <div className="flex gap-1">
                {navItems.map((item) => {
                  const isActive =
                    item.href === "/admin"
                      ? pathname === "/admin" ||
                        pathname.startsWith("/admin/companies")
                      : pathname === item.href ||
                        pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                        isActive
                          ? "bg-white/15 text-white shadow-sm"
                          : "text-white/60 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="text-white/50 text-xs font-medium hover:text-white/90 transition-colors px-3 py-1.5 rounded-md hover:bg-white/10"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">{children}</div>
    </div>
  );
}
