"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  icon: string;
};

type AdminNavProps = {
  items: NavItem[];
  classNames?: {
    nav?: string;
    link?: string;
    active?: string;
  };
};

function AdminIcon({ name }: { name: string }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.9,
    viewBox: "0 0 24 24",
  };

  switch (name) {
    case "dashboard":
      return <svg aria-hidden="true" {...common}><path d="M4 5h6v6H4zM14 5h6v6h-6zM4 15h6v4H4zM14 15h6v4h-6z" /></svg>;
    case "orders":
      return <svg aria-hidden="true" {...common}><path d="M7 7h12l-1 12H8z" /><path d="M9 7a3 3 0 0 1 6 0" /></svg>;
    case "products":
      return <svg aria-hidden="true" {...common}><path d="M5 5h14v14H5z" /><path d="M8 9h8M8 13h5" /></svg>;
    case "inventory":
      return <svg aria-hidden="true" {...common}><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z" /><path d="m4.5 8 7.5 4 7.5-4M12 12v8" /></svg>;
    case "customers":
      return <svg aria-hidden="true" {...common}><path d="M16 19a4 4 0 0 0-8 0" /><path d="M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" /><path d="M19 18a3 3 0 0 0-2-2.8M5 18a3 3 0 0 1 2-2.8" /></svg>;
    case "finance":
      return <svg aria-hidden="true" {...common}><path d="M4 19h16" /><path d="M7 16V9M12 16V5M17 16v-7" /></svg>;
    case "analytics":
      return <svg aria-hidden="true" {...common}><path d="M4 19V5" /><path d="M4 15c3-5 6 1 9-4s5-2 7-5" /></svg>;
    case "purchase":
      return <svg aria-hidden="true" {...common}><path d="M5 6h14v13H5z" /><path d="M8 6a4 4 0 0 1 8 0" /><path d="M9 13h6" /></svg>;
    case "coupons":
      return <svg aria-hidden="true" {...common}><path d="M4 8a2 2 0 0 0 0 4 2 2 0 0 0 0 4h16a2 2 0 0 0 0-4 2 2 0 0 0 0-4z" /><path d="M9 9h.01M15 15h.01M15 9l-6 6" /></svg>;
    case "notifications":
      return <svg aria-hidden="true" {...common}><path d="M6 9a6 6 0 0 1 12 0c0 7 2 7 2 9H4c0-2 2-2 2-9" /><path d="M10 21h4" /></svg>;
    case "activity":
      return <svg aria-hidden="true" {...common}><path d="M4 5h16M4 12h16M4 19h16" /><path d="M8 5v14" /></svg>;
    case "settings":
    default:
      return <svg aria-hidden="true" {...common}><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" /><path d="M19 12h2M3 12h2M12 3v2M12 19v2" /></svg>;
  }
}

export function AdminNav({ items, classNames }: AdminNavProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="ເມນູຫຼັກຫຼັງບ້ານ" className={classNames?.nav}>
      {items.map((item) => {
        const active = item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href);
        const className = [classNames?.link, active ? classNames?.active : ""].filter(Boolean).join(" ");

        return (
          <Link aria-current={active ? "page" : undefined} className={className} href={item.href} key={item.href}>
            <AdminIcon name={item.icon} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
