"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  icon: string;
};

function AdminIcon({ name }: { name: string }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8,
    viewBox: "0 0 24 24",
  };

  switch (name) {
    case "dashboard":
      return (
        <svg aria-hidden="true" {...common}>
          <path d="M4 5h7v6H4zM13 5h7v4h-7zM13 11h7v8h-7zM4 13h7v6H4z" />
        </svg>
      );
    case "orders":
      return (
        <svg aria-hidden="true" {...common}>
          <path d="M7 7h12l-1 12H8z" />
          <path d="M9 7a3 3 0 0 1 6 0" />
          <path d="M10 12h6" />
        </svg>
      );
    case "products":
      return (
        <svg aria-hidden="true" {...common}>
          <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z" />
          <path d="m4.5 8 7.5 4 7.5-4" />
          <path d="M12 12v8" />
        </svg>
      );
    case "inventory":
      return (
        <svg aria-hidden="true" {...common}>
          <path d="M4 6h16M6 6v14h12V6" />
          <path d="M9 10h6M9 14h6" />
        </svg>
      );
    case "customers":
      return (
        <svg aria-hidden="true" {...common}>
          <path d="M16 19a4 4 0 0 0-8 0" />
          <path d="M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
          <path d="M19 18a3 3 0 0 0-2-2.8M5 18a3 3 0 0 1 2-2.8" />
        </svg>
      );
    case "finance":
      return (
        <svg aria-hidden="true" {...common}>
          <path d="M4 19h16" />
          <path d="M7 16V9M12 16V5M17 16v-7" />
        </svg>
      );
    case "analytics":
      return (
        <svg aria-hidden="true" {...common}>
          <path d="M4 19V5" />
          <path d="M4 15c3-5 6 1 9-4s5-2 7-5" />
          <path d="M8 19v-4M13 19v-7M18 19v-9" />
        </svg>
      );
    case "purchase":
      return (
        <svg aria-hidden="true" {...common}>
          <path d="M5 6h14v13H5z" />
          <path d="M8 6a4 4 0 0 1 8 0" />
          <path d="M9 13h6" />
        </svg>
      );
    default:
      return (
        <svg aria-hidden="true" {...common}>
          <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
          <path d="M19 12h2M3 12h2M12 3v2M12 19v2" />
        </svg>
      );
  }
}

export function AdminNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav aria-label="ເມນູຫຼັງບ້ານ">
      {items.map((item) => {
        const active = item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href);

        return (
          <Link aria-current={active ? "page" : undefined} className={active ? "is-active" : ""} href={item.href} key={item.href}>
            <AdminIcon name={item.icon} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
