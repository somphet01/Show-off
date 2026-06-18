"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/admin", label: "Overview", match: (pathname: string) => pathname === "/admin" },
  { href: "/admin/analytics", label: "Reports", match: (pathname: string) => pathname.startsWith("/admin/analytics") },
  { href: "/admin/inventory", label: "Inventory", match: (pathname: string) => pathname.startsWith("/admin/inventory") || pathname.startsWith("/admin/products") },
];

export function AdminTopbarTabs() {
  const pathname = usePathname();

  return (
    <nav className="admin-topbar-tabs" aria-label="ທາງລັດຫຼັງບ້ານ">
      {tabs.map((tab) => (
        <Link aria-current={tab.match(pathname) ? "page" : undefined} className={tab.match(pathname) ? "is-active" : ""} href={tab.href} key={tab.href}>
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
