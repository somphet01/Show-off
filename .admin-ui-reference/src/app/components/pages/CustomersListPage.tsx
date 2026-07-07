import { useState } from "react";
import { useApp } from "../../context";
import { mockCustomers } from "../../mockData";
import { Search, Star, ChevronRight } from "lucide-react";

const typeLabel = { retail: "Retail", wholesale: "Wholesale", vip: "VIP" };
const typeColor = { retail: "bg-neutral-100 text-neutral-600", wholesale: "bg-blue-100 text-blue-700", vip: "bg-purple-100 text-purple-700" };

export function CustomersListPage() {
  const { navigate } = useApp();
  const [search, setSearch] = useState("");
  const [filterVip, setFilterVip] = useState(false);

  const filtered = mockCustomers.filter(c => {
    const q = search.toLowerCase();
    return (!search || c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.email?.toLowerCase().includes(q)) && (!filterVip || c.isVip);
  });

  return (
    <div className="p-5 space-y-4 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-neutral-900" style={{ fontWeight: 700, fontSize: "20px" }}>Customers</h1>
        <span className="text-neutral-400" style={{ fontSize: "13px" }}>{mockCustomers.length} ลูกค้าทั้งหมด</span>
      </div>
      <div className="bg-white rounded-xl border border-neutral-100 p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหาชื่อ เบอร์ หรืออีเมล..." className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 rounded-lg bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-400" style={{ fontSize: "13.5px" }} />
        </div>
        <button onClick={() => setFilterVip(v => !v)} className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg transition-colors ${filterVip ? "bg-purple-600 text-white" : "border border-neutral-200 text-neutral-600 hover:border-neutral-400"}`} style={{ fontSize: "13px" }}>
          <Star size={13} /> VIP
        </button>
      </div>
      <div className="bg-white rounded-xl border border-neutral-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center"><p className="text-neutral-500" style={{ fontSize: "14px" }}>ไม่พบลูกค้า</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-100">
                  {["ลูกค้า", "ติดต่อ", "ประเภท", "ออเดอร์", "ยอดซื้อรวม", "ออเดอร์ล่าสุด", ""].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-neutral-400" style={{ fontSize: "11.5px", fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {filtered.map(c => (
                  <tr key={c.id} className="hover:bg-neutral-50/50 cursor-pointer transition-colors" onClick={() => navigate("customer-detail", c.id)}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center shrink-0">
                          <span className="text-neutral-800" style={{ fontSize: "12px", fontWeight: 700 }}>{c.name.split(" ").map(n => n[0]).join("").slice(0, 2)}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-neutral-800" style={{ fontWeight: 500, fontSize: "13.5px" }}>{c.name}</p>
                            {c.isVip && <Star size={11} className="text-yellow-400 fill-yellow-400" />}
                          </div>
                          <p className="text-neutral-400" style={{ fontSize: "11.5px" }}>สมาชิกตั้งแต่ {new Date(c.createdAt).toLocaleDateString("th-TH", { year: "numeric", month: "short" })}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4"><p className="text-neutral-800" style={{ fontSize: "13px" }}>{c.phone}</p>{c.email && <p className="text-neutral-400" style={{ fontSize: "11.5px" }}>{c.email}</p>}</td>
                    <td className="px-5 py-4"><span className={`px-2 py-0.5 rounded-full text-xs ${typeColor[c.type]}`}>{typeLabel[c.type]}</span></td>
                    <td className="px-5 py-4"><span className="text-neutral-900" style={{ fontSize: "14px", fontWeight: 700 }}>{c.totalOrders}</span></td>
                    <td className="px-5 py-4"><span className="text-neutral-900" style={{ fontSize: "13.5px", fontWeight: 600 }}>{c.totalSpent > 0 ? Math.round(c.totalSpent).toLocaleString("en-US") : "—"}</span></td>
                    <td className="px-5 py-4"><span className="text-neutral-400" style={{ fontSize: "12.5px" }}>{c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString("th-TH", { day: "2-digit", month: "short" }) : "—"}</span></td>
                    <td className="px-5 py-4"><ChevronRight size={15} className="text-neutral-300" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
