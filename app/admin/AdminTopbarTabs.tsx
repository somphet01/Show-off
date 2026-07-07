"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type AdminTopbarTabsProps = {
  classNames?: {
    nav?: string;
    link?: string;
    active?: string;
  };
};

const tabs = [
  { href: "/admin", label: "ມື້ນີ້", match: (pathname: string) => pathname === "/admin" },
  { href: "/admin/orders", label: "ອໍເດີດ່ວນ", match: (pathname: string) => pathname.startsWith("/admin/orders") },
  {
    href: "/admin/inventory",
    label: "ສະຕ໋ອກ",
    match: (pathname: string) => pathname.startsWith("/admin/inventory") || pathname.startsWith("/admin/products"),
  },
  { href: "/admin/financials", label: "ການເງິນ", match: (pathname: string) => pathname.startsWith("/admin/financials") },
];

export function AdminTopbarTabs({ classNames }: AdminTopbarTabsProps) {
  const pathname = usePathname();

  return (
    <nav className={classNames?.nav} aria-label="ທາງລັດຫຼັງບ້ານ">
      {tabs.map((tab) => {
        const active = tab.match(pathname);
        const className = [classNames?.link, active ? classNames?.active : ""].filter(Boolean).join(" ");

        return (
          <Link aria-current={active ? "page" : undefined} className={className} href={tab.href} key={tab.href}>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
