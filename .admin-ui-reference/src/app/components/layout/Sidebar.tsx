import { useApp } from "../../context";
import type { PageKey } from "../../types";
import {
  LayoutDashboard, ShoppingBag, PackageSearch, Shirt, Archive,
  Users, DollarSign, Ticket, Bell, FileText, Settings, LogOut, X, MonitorPlay,
} from "lucide-react";

interface NavItem { key: PageKey; label: string; icon: React.ReactNode; }

const navItems: NavItem[] = [
  { key: "dashboard", label: "ພາບລວມ", icon: <LayoutDashboard size={17} /> },
  { key: "orders", label: "ອໍເດີ", icon: <ShoppingBag size={17} /> },
  { key: "products", label: "ສິນຄ້າ", icon: <Shirt size={17} /> },
  { key: "website-editor", label: "ໜ້າເວັບ", icon: <MonitorPlay size={17} /> },
  { key: "inventory", label: "ສະຕັອກ", icon: <PackageSearch size={17} /> },
  { key: "customers", label: "ລູກຄ້າ", icon: <Users size={17} /> },
  { key: "financials", label: "ການເງິນ", icon: <DollarSign size={17} /> },
  { key: "purchase-orders", label: "ໃບສັ່ງຊື້", icon: <Archive size={17} /> },
  { key: "coupons", label: "ຄູປອງ", icon: <Ticket size={17} /> },
  { key: "notifications", label: "ແຈ້ງເຕືອນ", icon: <Bell size={17} /> },
  { key: "activity-logs", label: "ປະຫວັດ", icon: <FileText size={17} /> },
  { key: "settings", label: "ຕັ້ງຄ່າ", icon: <Settings size={17} /> },
];

interface SidebarProps { mobileOpen: boolean; onMobileClose: () => void; }

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const { currentPage, navigate, user, logout, unreadCount } = useApp();

  const isActive = (key: PageKey) =>
    currentPage === key ||
    (key === "orders" && ["order-detail", "create-order"].includes(currentPage)) ||
    (key === "products" && ["create-product", "edit-product"].includes(currentPage)) ||
    (key === "inventory" && ["stock-movement", "stock-adjustment"].includes(currentPage)) ||
    (key === "customers" && currentPage === "customer-detail") ||
    (key === "purchase-orders" && ["create-purchase-order", "purchase-order-detail"].includes(currentPage)) ||
    (key === "coupons" && currentPage === "create-coupon");

  const handleNav = (key: PageKey) => { navigate(key); onMobileClose(); };

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm lg:hidden" onClick={onMobileClose} />
      )}
      <aside className={`fixed top-0 left-0 h-full w-[220px] border-r border-neutral-100 bg-white/95 z-50 flex flex-col shadow-sm backdrop-blur transition-transform duration-300
        ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>

        {/* Brand */}
        <div className="flex items-center gap-2.5 px-5 pt-6 pb-5">
          <div className="w-10 h-10 rounded-2xl bg-neutral-950 flex items-center justify-center shrink-0 shadow-sm shadow-neutral-200">
            <span className="text-white" style={{ fontWeight: 800, fontSize: "13px", letterSpacing: "-0.5px" }}>SO</span>
          </div>
          <div>
            <p className="text-neutral-900" style={{ fontWeight: 700, fontSize: "14px", letterSpacing: "0.04em" }}>SHOW OFF</p>
            <p className="text-neutral-400" style={{ fontSize: "10px" }}>ລະບົບຫຼັງບ້ານ</p>
          </div>
          <button onClick={onMobileClose} className="ml-auto lg:hidden text-neutral-400 hover:text-neutral-700">
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 space-y-0.5">
          {navItems.map(item => {
            const active = isActive(item.key);
            return (
              <button
                key={item.key}
                onClick={() => handleNav(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left transition-all
                  ${active ? "bg-neutral-950 text-white" : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"}`}
              >
                <span className="shrink-0">{item.icon}</span>
                <span style={{ fontSize: "13.5px", fontWeight: active ? 600 : 400 }}>{item.label}</span>
                {item.key === "notifications" && unreadCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white rounded-full px-1.5 py-0.5 leading-none" style={{ fontSize: "10px", fontWeight: 700 }}>
                    {unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User card — black */}
        <div className="m-3 mt-4">
          <div className="bg-neutral-950 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-full bg-neutral-700 flex items-center justify-center shrink-0">
                <span className="text-white" style={{ fontSize: "12px", fontWeight: 700 }}>
                  {user?.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-white truncate" style={{ fontSize: "13px", fontWeight: 600 }}>{user?.name}</p>
                <p className="text-neutral-400" style={{ fontSize: "11px" }}>{user?.role}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-full py-2 transition-colors"
              style={{ fontSize: "12.5px" }}
            >
              <LogOut size={13} /> ອອກຈາກລະບົບ
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
