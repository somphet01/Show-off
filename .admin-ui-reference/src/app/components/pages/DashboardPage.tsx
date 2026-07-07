import { useApp } from "../../context";
import { mockOrders, mockProducts, mockNotifications, mockExpenses } from "../../mockData";
import { ShoppingBag, Clock, Truck, Package, AlertTriangle, ChevronRight, Flame, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

const dayFormatter = new Intl.DateTimeFormat("lo-LA", { day: "2-digit" });

function dateKey(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return date.toISOString().slice(0, 10);
}

function latestBusinessDate() {
  const dates = [...mockOrders.map(o => dateKey(o.createdAt)), ...mockExpenses.map(e => e.date || dateKey(e.createdAt))].filter(Boolean).sort();
  return dates.at(-1) || new Date().toISOString().slice(0, 10);
}

function formatLak(value: number) {
  return Math.round(value || 0).toLocaleString("en-US");
}

function buildSalesData(anchorDate: string) {
  const anchor = new Date(`${anchorDate}T00:00:00.000Z`);
  const revenueByDate = new Map<string, number>();

  mockOrders
    .filter(o => o.status !== "cancelled")
    .forEach(o => {
      const key = dateKey(o.createdAt);
      revenueByDate.set(key, (revenueByDate.get(key) || 0) + o.totalAmount);
    });

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(anchor);
    date.setUTCDate(anchor.getUTCDate() - (6 - index));
    const key = date.toISOString().slice(0, 10);
    return { day: dayFormatter.format(date), revenue: revenueByDate.get(key) || 0 };
  });
}

function buildChannelData() {
  const channelLabels: Record<string, string> = { web: "Web", chat: "Chat", walkin: "Walk-in", "walk-in": "Walk-in" };
  const totals = new Map<string, number>();

  mockOrders
    .filter(o => o.status !== "cancelled")
    .forEach(o => {
      const label = channelLabels[o.channel] || o.channel || "Other";
      totals.set(label, (totals.get(label) || 0) + o.totalAmount);
    });

  return ["Web", "Chat", "Walk-in"].map(ch => ({ ch, v: totals.get(ch) || 0 }));
}

function buildTopProducts() {
  const totals = new Map<string, number>();

  mockOrders
    .filter(o => o.status !== "cancelled")
    .flatMap(o => o.items || [])
    .forEach(item => {
      totals.set(item.productName, (totals.get(item.productName) || 0) + item.quantity);
    });

  const fromOrders = [...totals.entries()]
    .map(([name, sold]) => ({ name, sold }))
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 5);

  if (fromOrders.length > 0) return fromOrders;

  return mockProducts.slice(0, 5).map(product => ({
    name: product.name,
    sold: product.variants.reduce((sum, variant) => sum + Math.max(variant.stock, 0), 0),
  }));
}
const orderStatusColor: Record<string, string> = {
  pending: "bg-neutral-100 text-neutral-600", awaiting_payment_slip: "bg-amber-100 text-amber-700",
  awaiting_confirmation: "bg-neutral-100 text-neutral-700", paid: "bg-green-100 text-green-700", cancelled: "bg-red-100 text-red-600",
};
const orderStatusLabel: Record<string, string> = {
  pending: "Pending", awaiting_payment_slip: "รอสลิป", awaiting_confirmation: "รอตรวจ", paid: "ชำระแล้ว", cancelled: "ยกเลิก",
};
const DARK = "#0a0a0a";
const WHITE = "#ffffff";

const criticalAlerts = mockNotifications.filter(n => !n.isRead && n.priority !== "normal");

export function DashboardPage() {
  const { navigate } = useApp();
  const businessDate = latestBusinessDate();
  const salesData = buildSalesData(businessDate);
  const channelData = buildChannelData();
  const topProducts = buildTopProducts();
  const maxTopProductSold = Math.max(...topProducts.map(p => p.sold), 1);
  const todayOrders = mockOrders.filter(o => o.status !== "cancelled" && dateKey(o.createdAt) === businessDate);
  const todayRevenue = todayOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  const todayExpenses = mockExpenses
    .filter(expense => (expense.date || dateKey(expense.createdAt)) === businessDate)
    .reduce((sum, expense) => sum + expense.amount, 0);
  const todayProfit = todayRevenue - todayExpenses;
  const yesterdayRevenue = mockOrders
    .filter(order => {
      const date = new Date(`${businessDate}T00:00:00.000Z`);
      date.setUTCDate(date.getUTCDate() - 1);
      return order.status !== "cancelled" && dateKey(order.createdAt) === date.toISOString().slice(0, 10);
    })
    .reduce((sum, order) => sum + order.totalAmount, 0);
  const revenueChange = yesterdayRevenue > 0 ? Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100) : 0;
  const pendingSlips = mockOrders.filter(o => o.paymentStatus === "pending_review").length;
  const pendingShip = mockOrders.filter(o => o.paymentStatus === "paid" && o.shippingStatus === "not_shipped").length;
  const lowStock = mockProducts.filter(p => p.variants.some(v => v.stock <= v.minimumStock)).length;

  return (
    <div className="p-5 space-y-4 max-w-[1400px] mx-auto">

      {/* Alerts */}
      {criticalAlerts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {criticalAlerts.map(a => (
            <button key={a.id} onClick={() => navigate("notifications")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-colors
                ${a.priority === "critical" ? "bg-red-50 border border-red-200 text-red-700 hover:bg-red-100" : "bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100"}`}>
              <AlertTriangle size={13} />
              <span style={{ fontSize: "12.5px" }}>{a.title}</span>
              <ChevronRight size={12} />
            </button>
          ))}
        </div>
      )}

      {/* Row 1: Hero dark card + 2 cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-2 bg-neutral-950 rounded-2xl p-5 text-white relative overflow-hidden">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-neutral-400" style={{ fontSize: "12.5px" }}>รายรับวันนี้</p>
              <p className="text-white mt-1" style={{ fontWeight: 700, fontSize: "28px" }}>{formatLak(todayRevenue)}</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-neutral-950 flex items-center justify-center shrink-0">
              <Flame size={17} className="text-white" />
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <ArrowUpRight size={14} className="text-green-400" />
            <span className="text-green-400" style={{ fontSize: "12.5px" }}>{revenueChange >= 0 ? "+" : ""}{revenueChange}% vs เมื่อวาน</span>
          </div>
          <div className="mt-3 h-14 opacity-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="heroGrad"  x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={WHITE} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={WHITE} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="revenue" stroke={WHITE} strokeWidth={1.5} fill="url(#heroGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="absolute -right-8 -bottom-8 w-36 h-36 rounded-full border border-white/5" />
        </div>

        <div className="bg-white rounded-xl p-5 border border-neutral-100">
          <div className="flex items-start justify-between mb-2">
            <p className="text-neutral-500" style={{ fontSize: "12.5px" }}>กำไรวันนี้</p>
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
              <TrendingUp size={15} className="text-green-600" />
            </div>
          </div>
          <p className="text-neutral-900" style={{ fontWeight: 700, fontSize: "22px" }}>{formatLak(todayProfit)}</p>
          <div className="flex items-center gap-1 mt-1.5">
            <ArrowUpRight size={13} className="text-green-500" />
            <span className="text-green-600" style={{ fontSize: "12px" }}>{todayProfit >= 0 ? "ກຳໄລສຸດທິ" : "ຂາດທຶນ"}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-neutral-100">
          <div className="flex items-start justify-between mb-2">
            <p className="text-neutral-500" style={{ fontSize: "12.5px" }}>รายจ่ายวันนี้</p>
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
              <ArrowDownRight size={15} className="text-red-500" />
            </div>
          </div>
          <p className="text-neutral-900" style={{ fontWeight: 700, fontSize: "22px" }}>{formatLak(todayExpenses)}</p>
          <p className="text-neutral-400 mt-1.5" style={{ fontSize: "12px" }}>ລາຍຈ່າຍຈາກຂໍ້ມູນຈິງ</p>
        </div>
      </div>

      {/* Row 2: Task cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "ออเดอร์ใหม่", value: String(todayOrders.length), sub: "วันนี้", icon: <ShoppingBag size={16} className="text-neutral-900" />, bg: "bg-neutral-100", page: "orders" as const },
          { label: "รอตรวจสลิป", value: String(pendingSlips), sub: "ออเดอร์", icon: <Clock size={16} className="text-amber-500" />, bg: "bg-amber-100", page: "orders" as const },
          { label: "รอจัดส่ง", value: String(pendingShip), sub: "ออเดอร์", icon: <Truck size={16} className="text-blue-500" />, bg: "bg-blue-100", page: "orders" as const },
          { label: "สต็อกต่ำ", value: String(lowStock), sub: "สินค้า", icon: <Package size={16} className="text-red-500" />, bg: "bg-red-100", page: "inventory" as const },
        ].map(card => (
          <button key={card.label} onClick={() => navigate(card.page)}
            className="bg-white rounded-xl p-5 border border-neutral-100 text-left hover:shadow-md hover:border-neutral-300 transition-all">
            <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center mb-3`}>{card.icon}</div>
            <p className="text-neutral-900" style={{ fontWeight: 700, fontSize: "26px" }}>{card.value}</p>
            <p className="text-neutral-500 mt-0.5" style={{ fontSize: "12.5px" }}>{card.label}</p>
          </button>
        ))}
      </div>

      {/* Row 3: Chart + Top products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl border border-neutral-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-neutral-900" style={{ fontWeight: 600 }}>ยอดขาย 7 วัน</h3>
            <span className="text-neutral-400" style={{ fontSize: "12px" }}>มิ.ย. 2026</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={salesData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={DARK} stopOpacity={0.08} />
                  <stop offset="95%" stopColor={DARK} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#a3a3a3" }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => Number(v).toLocaleString("en-US")} tick={{ fontSize: 11, fill: "#a3a3a3" }} axisLine={false} tickLine={false} width={64} />
              <Tooltip formatter={(v: number) => [Math.round(v).toLocaleString("en-US"), "Revenue"]} contentStyle={{ fontSize: 12, borderRadius: 12, border: "1px solid #e5e5e5" }} />
              <Area type="monotone" dataKey="revenue" stroke={DARK} strokeWidth={2} fill="url(#revGrad)" dot={false} activeDot={{ r: 4, fill: DARK, strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-neutral-950 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white" style={{ fontWeight: 600 }}>สินค้าขายดี</h3>
            <button onClick={() => navigate("products")} className="text-neutral-500 hover:text-white transition-colors" style={{ fontSize: "12px" }}>ดูทั้งหมด</button>
          </div>
          <div className="space-y-3.5">
            {topProducts.map((p, i) => (
              <div key={p.name} className="flex items-center gap-3">
                <span className="text-neutral-600 w-4 shrink-0" style={{ fontSize: "11px", fontWeight: 600 }}>#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-neutral-200 truncate" style={{ fontSize: "12.5px" }}>{p.name}</p>
                  <div className="w-full bg-neutral-800 rounded-full h-1 mt-1">
                    <div className="h-1 rounded-full bg-neutral-950" style={{ width: `${Math.max(8, (p.sold / maxTopProductSold) * 100)}%` }} />
                  </div>
                </div>
                <p className="text-white shrink-0" style={{ fontSize: "12px", fontWeight: 600 }}>{p.sold}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 4: Latest Orders */}
      <div className="bg-white rounded-xl border border-neutral-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-50">
          <h3 className="text-neutral-900" style={{ fontWeight: 600 }}>ออเดอร์ล่าสุด</h3>
          <button onClick={() => navigate("orders")} className="flex items-center gap-1 text-neutral-900 hover:text-neutral-800 transition-colors" style={{ fontSize: "13px", fontWeight: 500 }}>
            ดูทั้งหมด <ChevronRight size={14} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-neutral-50">
                {["เลขออเดอร์", "ลูกค้า", "ช่องทาง", "ยอดรวม", "สถานะ", ""].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-neutral-400" style={{ fontSize: "11.5px", fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {mockOrders.slice(0, 5).map(order => (
                <tr key={order.id} className="hover:bg-neutral-50/60 cursor-pointer transition-colors" onClick={() => navigate("order-detail", order.id)}>
                  <td className="px-5 py-3.5"><span className="text-neutral-900 font-mono" style={{ fontSize: "13px", fontWeight: 500 }}>{order.orderNumber}</span></td>
                  <td className="px-5 py-3.5"><p className="text-neutral-800" style={{ fontSize: "13px" }}>{order.customerName}</p><p className="text-neutral-400" style={{ fontSize: "11.5px" }}>{order.customerPhone}</p></td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${order.channel === "web" ? "bg-blue-100 text-blue-700" : order.channel === "chat" ? "bg-purple-100 text-purple-700" : "bg-neutral-100 text-neutral-700"}`} style={{ fontSize: "11px" }}>{order.channel}</span>
                  </td>
                  <td className="px-5 py-3.5"><span className="text-neutral-900" style={{ fontSize: "13px", fontWeight: 600 }}>{Math.round(order.totalAmount).toLocaleString("en-US")}</span></td>
                  <td className="px-5 py-3.5"><span className={`px-2.5 py-1 rounded-full text-xs ${orderStatusColor[order.status]}`} style={{ fontSize: "11.5px" }}>{orderStatusLabel[order.status]}</span></td>
                  <td className="px-5 py-3.5"><ChevronRight size={14} className="text-neutral-300" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "สร้างออเดอร์", page: "create-order" as const, dark: true },
          { label: "เพิ่มสินค้า", page: "create-product" as const, dark: false },
          { label: "ตรวจสลิป", page: "orders" as const, dark: false },
          { label: "ปรับสต็อก", page: "stock-adjustment" as const, dark: false },
        ].map(a => (
          <button key={a.label} onClick={() => navigate(a.page)}
            className={`py-3 rounded-lg transition-colors ${a.dark ? "bg-neutral-950 text-white hover:bg-neutral-800" : "bg-white border border-neutral-200 text-neutral-700 hover:border-neutral-400 hover:text-neutral-800"}`}
            style={{ fontSize: "13.5px", fontWeight: 500 }}>
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}
