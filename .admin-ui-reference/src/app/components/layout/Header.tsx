import { useApp } from "../../context";
import type { PageKey } from "../../types";
import { Bell, Calendar, ChevronRight, Menu, Plus, Search } from "lucide-react";

const pageTitles: Record<PageKey, string> = {
  login: "ເຂົ້າລະບົບ",
  dashboard: "ພາບລວມ",
  orders: "ອໍເດີ",
  "order-detail": "ລາຍລະອຽດອໍເດີ",
  "create-order": "ສ້າງອໍເດີ",
  products: "ສິນຄ້າ",
  "create-product": "ເພີ່ມສິນຄ້າ",
  "edit-product": "ແກ້ໄຂສິນຄ້າ",
  "website-editor": "ແກ້ໄຂໜ້າເວັບ",
  inventory: "ສະຕັອກ",
  "stock-movement": "ປະຫວັດສະຕັອກ",
  "stock-adjustment": "ປັບສະຕັອກ",
  customers: "ລູກຄ້າ",
  "customer-detail": "ຂໍ້ມູນລູກຄ້າ",
  financials: "ການເງິນ",
  expenses: "ລາຍຈ່າຍ",
  "purchase-orders": "ໃບສັ່ງຊື້",
  "create-purchase-order": "ສ້າງ PO",
  "purchase-order-detail": "ລາຍລະອຽດ PO",
  coupons: "ຄູປອງ",
  "create-coupon": "ຄູປອງ",
  notifications: "ແຈ້ງເຕືອນ",
  "activity-logs": "ປະຫວັດການໃຊ້ງານ",
  settings: "ຕັ້ງຄ່າ",
};

const breadcrumbParents: Partial<Record<PageKey, PageKey>> = {
  "order-detail": "orders",
  "create-order": "orders",
  "create-product": "products",
  "edit-product": "products",
  "stock-movement": "inventory",
  "stock-adjustment": "inventory",
  "customer-detail": "customers",
  "create-purchase-order": "purchase-orders",
  "purchase-order-detail": "purchase-orders",
  "create-coupon": "coupons",
  expenses: "financials",
};

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { currentPage, navigate, unreadCount } = useApp();
  const parent = breadcrumbParents[currentPage];
  const today = new Date().toLocaleDateString("lo-LA", { day: "numeric", month: "long", year: "numeric" });

  return (
    <header className="flex shrink-0 items-center gap-3 border-b border-neutral-100 bg-white/95 px-5 py-3.5 backdrop-blur">
      <button className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950 lg:hidden" onClick={onMenuClick} type="button">
        <Menu size={20} />
      </button>

      <div className="hidden items-center gap-2 rounded-full border border-neutral-100 bg-white px-3.5 py-1.5 shadow-sm sm:flex">
        <Calendar className="text-neutral-500" size={13} />
        <span className="text-neutral-600" style={{ fontSize: "12.5px" }}>{today}</span>
      </div>

      <div className="flex min-w-0 items-center gap-1.5 text-neutral-500">
        {parent && (
          <>
            <button className="rounded-full px-2 py-1 transition-colors hover:bg-neutral-100 hover:text-neutral-950" onClick={() => navigate(parent)} style={{ fontSize: "13px" }} type="button">
              {pageTitles[parent]}
            </button>
            <ChevronRight className="shrink-0" size={13} />
          </>
        )}
        <span className="truncate text-neutral-950" style={{ fontSize: "13px", fontWeight: 650 }}>{pageTitles[currentPage]}</span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="hidden w-56 items-center gap-2 rounded-2xl border border-neutral-100 bg-white px-4 py-2.5 shadow-sm md:flex">
          <Search className="shrink-0 text-neutral-400" size={13} />
          <input className="w-full flex-1 bg-transparent text-neutral-700 outline-none placeholder:text-neutral-400" placeholder="ຄົ້ນຫາ..." style={{ fontSize: "13px" }} />
        </div>

        <button
          className="flex items-center gap-1.5 rounded-full bg-neutral-950 px-4 py-2.5 text-white transition-colors hover:bg-neutral-800"
          onClick={() => navigate("create-order")}
          style={{ fontSize: "12.5px", fontWeight: 650 }}
          type="button"
        >
          <Plus size={13} />
          <span className="hidden sm:inline">ສ້າງອໍເດີ</span>
        </button>

        <button
          className="relative flex h-10 w-10 items-center justify-center rounded-full border border-neutral-100 bg-white text-neutral-600 shadow-sm transition-colors hover:bg-neutral-50 hover:text-neutral-950"
          onClick={() => navigate("notifications")}
          type="button"
        >
          <Bell size={16} />
          {unreadCount > 0 && <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-red-500" />}
        </button>
      </div>
    </header>
  );
}
