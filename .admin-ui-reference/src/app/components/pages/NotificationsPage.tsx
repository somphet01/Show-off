import { useState } from "react";
import { useApp } from "../../context";
import { mockNotifications } from "../../mockData";
import type { Notification, NotificationType } from "../../types";
import { Bell, CheckCheck, ChevronRight, ShoppingBag, AlertTriangle, Package, DollarSign, Truck, Settings } from "lucide-react";

const typeIcon: Record<NotificationType, React.ReactNode> = {
  new_order: <ShoppingBag size={14} />, awaiting_slip: <DollarSign size={14} />,
  slip_rejected: <AlertTriangle size={14} />, payment_approved: <DollarSign size={14} />,
  low_stock: <Package size={14} />, out_of_stock: <Package size={14} />,
  po_received: <Package size={14} />, shipping_update: <Truck size={14} />,
  system_warning: <Settings size={14} />, announcement: <Bell size={14} />,
};
const typeColor: Record<NotificationType, string> = {
  new_order: "bg-blue-100 text-blue-500", awaiting_slip: "bg-amber-100 text-amber-500",
  slip_rejected: "bg-red-100 text-red-500", payment_approved: "bg-green-100 text-green-500",
  low_stock: "bg-amber-100 text-amber-500", out_of_stock: "bg-red-100 text-red-500",
  po_received: "bg-blue-100 text-blue-500", shipping_update: "bg-purple-100 text-purple-500",
  system_warning: "bg-neutral-100 text-neutral-500", announcement: "bg-neutral-100 text-neutral-500",
};

export function NotificationsPage() {
  const { navigate } = useApp();
  const [notifs, setNotifs] = useState<Notification[]>(mockNotifications);
  const markRead = (id: string) => setNotifs(ns => ns.map(n => n.id === id ? { ...n, isRead: true } : n));
  const markAllRead = () => setNotifs(ns => ns.map(n => ({ ...n, isRead: true })));
  const unread = notifs.filter(n => !n.isRead).length;

  return (
    <div className="p-5 space-y-4 max-w-[800px] mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-neutral-900" style={{ fontWeight: 700, fontSize: "20px" }}>Notifications</h1>
          {unread > 0 && <span className="bg-neutral-950 text-white text-xs rounded-full px-2 py-0.5" style={{ fontSize: "11px", fontWeight: 700 }}>{unread}</span>}
        </div>
        {unread > 0 && (
          <button onClick={markAllRead} className="flex items-center gap-1.5 text-neutral-500 hover:text-neutral-800 transition-colors" style={{ fontSize: "13.5px" }}>
            <CheckCheck size={14} /> อ่านทั้งหมด
          </button>
        )}
      </div>

      {notifs.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-xl border border-neutral-100">
          <Bell size={30} className="mx-auto text-neutral-300 mb-3" />
          <p className="text-neutral-500" style={{ fontSize: "14px" }}>ไม่มีการแจ้งเตือน</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifs.map(n => (
            <div
              key={n.id}
              className={`bg-white rounded-xl border overflow-hidden cursor-pointer transition-all hover:shadow-sm
                ${n.priority === "critical" ? "border-l-4 border-l-red-400 border-neutral-100" : n.priority === "warning" ? "border-l-4 border-l-amber-400 border-neutral-100" : "border-neutral-100"}
                ${!n.isRead ? "bg-neutral-100/50" : ""}`}
              onClick={() => markRead(n.id)}
            >
              <div className="flex items-start gap-3.5 p-4">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${typeColor[n.type]}`}>{typeIcon[n.type]}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`${!n.isRead ? "text-neutral-900" : "text-neutral-700"}`} style={{ fontWeight: !n.isRead ? 600 : 400, fontSize: "13.5px" }}>{n.title}</p>
                    <div className="flex items-center gap-2 shrink-0">
                      {!n.isRead && <div className="w-2 h-2 rounded-full bg-neutral-950" />}
                      <span className="text-neutral-400" style={{ fontSize: "11.5px" }}>{new Date(n.createdAt).toLocaleDateString("th-TH", { day: "2-digit", month: "short" })}</span>
                    </div>
                  </div>
                  <p className="text-neutral-500 mt-0.5" style={{ fontSize: "13px" }}>{n.message}</p>
                  {n.relatedLink && (
                    <button className="flex items-center gap-1 text-neutral-900 hover:text-neutral-800 mt-1.5 transition-colors" style={{ fontSize: "12.5px" }} onClick={e => { e.stopPropagation(); navigate(n.relatedLink as any); }}>
                      ดูรายละเอียด <ChevronRight size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
