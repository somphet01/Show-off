import { useState } from "react";
import { mockActivityLogs } from "../../mockData";

const actionLabel: Record<string, string> = {
  approve_slip: "อนุมัติสลิป", reject_slip: "ปฏิเสธสลิป", create_order: "สร้างออเดอร์",
  cancel_order: "ยกเลิกออเดอร์", update_shipping: "อัปเดตการส่ง", create_product: "สร้างสินค้า",
  update_product: "แก้ไขสินค้า", update_price: "เปลี่ยนราคา", adjust_stock: "ปรับสต็อก",
  mark_po_received: "รับสินค้า PO", update_settings: "เปลี่ยนการตั้งค่า", sign_in: "เข้าสู่ระบบ",
};
const actionColor: Record<string, string> = {
  approve_slip: "bg-green-100 text-green-700", reject_slip: "bg-red-100 text-red-600",
  create_order: "bg-blue-100 text-blue-700", cancel_order: "bg-red-100 text-red-600",
  update_shipping: "bg-purple-100 text-purple-700", adjust_stock: "bg-amber-100 text-amber-700",
  mark_po_received: "bg-green-100 text-green-700", update_price: "bg-neutral-100 text-neutral-600",
  sign_in: "bg-neutral-100 text-neutral-500", create_product: "bg-blue-100 text-blue-700",
  update_product: "bg-neutral-100 text-neutral-600", update_settings: "bg-neutral-100 text-neutral-600",
};

export function ActivityLogsPage() {
  const [filterUser, setFilterUser] = useState("all");
  const [filterAction, setFilterAction] = useState("all");

  const users = Array.from(new Set(mockActivityLogs.map(l => l.user)));
  const actions = Array.from(new Set(mockActivityLogs.map(l => l.action)));
  const filtered = mockActivityLogs.filter(l =>
    (filterUser === "all" || l.user === filterUser) && (filterAction === "all" || l.action === filterAction)
  );

  return (
    <div className="p-5 space-y-4 max-w-[1100px] mx-auto">
      <h1 className="text-neutral-900" style={{ fontWeight: 700, fontSize: "20px" }}>Activity Logs</h1>
      <div className="bg-white rounded-xl border border-neutral-100 p-4 flex flex-wrap gap-3">
        <select value={filterUser} onChange={e => setFilterUser(e.target.value)} className="border border-neutral-200 rounded-lg px-3 py-2 bg-white text-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-400" style={{ fontSize: "13px" }}>
          <option value="all">ทุกผู้ใช้</option>
          {users.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
        <select value={filterAction} onChange={e => setFilterAction(e.target.value)} className="border border-neutral-200 rounded-lg px-3 py-2 bg-white text-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-400" style={{ fontSize: "13px" }}>
          <option value="all">ทุก action</option>
          {actions.map(a => <option key={a} value={a}>{actionLabel[a] ?? a}</option>)}
        </select>
      </div>
      <div className="bg-white rounded-xl border border-neutral-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-100">
                {["เวลา", "ผู้ใช้", "Role", "Action", "เป้าหมาย", "รายละเอียด"].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-neutral-400" style={{ fontSize: "11.5px", fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {filtered.map(log => (
                <tr key={log.id} className="hover:bg-neutral-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="text-neutral-700" style={{ fontSize: "12.5px" }}>{new Date(log.createdAt).toLocaleDateString("th-TH", { day: "2-digit", month: "short" })}</p>
                    <p className="text-neutral-400" style={{ fontSize: "11px" }}>{new Date(log.createdAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center shrink-0">
                        <span className="text-neutral-800" style={{ fontSize: "10px", fontWeight: 700 }}>{log.user.split(" ").map(n => n[0]).join("").slice(0, 2)}</span>
                      </div>
                      <span className="text-neutral-800" style={{ fontSize: "13px" }}>{log.user}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5"><span className={`px-1.5 py-0.5 rounded text-xs ${log.role === "owner" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>{log.role}</span></td>
                  <td className="px-5 py-3.5"><span className={`px-2.5 py-1 rounded-full text-xs ${actionColor[log.action] ?? "bg-neutral-100 text-neutral-600"}`} style={{ fontSize: "11.5px" }}>{actionLabel[log.action] ?? log.action}</span></td>
                  <td className="px-5 py-3.5"><p className="text-neutral-500" style={{ fontSize: "12.5px" }}>{log.targetType}</p><p className="text-neutral-400 font-mono" style={{ fontSize: "11px" }}>{log.targetId}</p></td>
                  <td className="px-5 py-3.5"><p className="text-neutral-700" style={{ fontSize: "13px" }}>{log.summary}</p></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <div className="py-12 text-center"><p className="text-neutral-400" style={{ fontSize: "14px" }}>ไม่มี activity logs</p></div>}
      </div>
      <p className="text-neutral-400 text-right" style={{ fontSize: "12px" }}>แสดง {filtered.length} รายการ</p>
    </div>
  );
}
