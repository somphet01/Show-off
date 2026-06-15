import Link from "next/link";
import { ReactNode } from "react";
import { signOutAdmin } from "../../admin/actions";
import { requireAdminSession } from "../../lib/admin/auth";

const adminNav = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/inventory", label: "Inventory" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/financials", label: "Financials" },
  { href: "/admin/purchase-orders", label: "Purchase Orders" },
  { href: "/admin/settings", label: "Settings" },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await requireAdminSession();

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="admin-brand" href="/admin">
          SHOW OFF
        </Link>
        <nav>
          {adminNav.map((item) => (
            <Link href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <div>
            <span>Backoffice</span>
            <strong>{session.displayName ?? session.email ?? "Admin"}</strong>
          </div>
          <form action={signOutAdmin}>
            <button type="submit">Sign out</button>
          </form>
        </header>
        {children}
      </div>
    </div>
  );
}
