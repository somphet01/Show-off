import Link from "next/link";
import { ReactNode } from "react";
import { AdminNav } from "../../admin/AdminNav";
import { AdminTopbarTabs } from "../../admin/AdminTopbarTabs";
import { signOutAdmin } from "../../admin/actions";
import { requireAdminSession } from "../../lib/admin/auth";

const adminNav = [
  { href: "/admin", label: "ພາບລວມ", icon: "dashboard" },
  { href: "/admin/orders", label: "ອໍເດີ", icon: "orders" },
  { href: "/admin/products", label: "ສິນຄ້າ", icon: "products" },
  { href: "/admin/inventory", label: "ສະຕ໊ອກ", icon: "inventory" },
  { href: "/admin/customers", label: "ລູກຄ້າ", icon: "customers" },
  { href: "/admin/financials", label: "ການເງິນ", icon: "finance" },
  { href: "/admin/analytics", label: "ວິເຄາະ", icon: "analytics" },
  { href: "/admin/purchase-orders", label: "ສັ່ງຊື້ເຂົ້າ", icon: "purchase" },
  { href: "/admin/settings", label: "ຕັ້ງຄ່າ", icon: "settings" },
];

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="m20 20-4.2-4.2" />
      <circle cx="11" cy="11" r="6" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.2 2.4 3.3 5.4 3.3 9S14.2 18.6 12 21M12 3c-2.2 2.4-3.3 5.4-3.3 9s1.1 6.6 3.3 9" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M6 9a6 6 0 0 1 12 0c0 7 2 7 2 9H4c0-2 2-2 2-9" />
      <path d="M10 21h4" />
    </svg>
  );
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await requireAdminSession();
  const today = new Intl.DateTimeFormat("lo-LA", { dateStyle: "medium" }).format(new Date());

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="admin-brand" href="/admin" aria-label="SHOW OFF Admin">
          <span className="admin-brand-mark">SO</span>
          <span>
            SHOW OFF
            <small>ຫຼັງບ້ານຮ້ານ</small>
          </span>
        </Link>
        <AdminNav items={adminNav} />
        <div className="admin-sidebar-profile">
          <span>ຜູ້ເບິ່ງແຍງ</span>
          <strong>{session.displayName ?? "SHOW OFF"}</strong>
          <small>{session.email ?? "ເຈົ້າຂອງຮ້ານ"}</small>
        </div>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-search" aria-label="ຄົ້ນຫາ">
            <SearchIcon />
            <strong>Search data...</strong>
          </div>
          <AdminTopbarTabs />
          <div className="admin-topbar-tools" aria-label="ເຄື່ອງມື">
            <button aria-label="ປ່ຽນພາສາ" type="button"><GlobeIcon /></button>
            <button aria-label="ແຈ້ງເຕືອນ" className="has-dot" type="button"><BellIcon /></button>
          </div>
          <div className="admin-topbar-meta">
            <span>{today}</span>
            <strong>{session.displayName ?? session.email ?? "Admin"}</strong>
          </div>
          <form action={signOutAdmin}>
            <button type="submit">ອອກຈາກລະບົບ</button>
          </form>
        </header>
        {children}
      </div>
    </div>
  );
}
