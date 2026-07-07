import { useApp } from "../../context";
import { mockCustomers, mockOrders } from "../../mockData";
import { ArrowLeft, Star, Phone, Mail, MapPin, ShoppingBag, ChevronRight, Edit, Plus } from "lucide-react";

const typeLabel = { retail: "Retail", wholesale: "Wholesale", vip: "VIP" };
const typeColor = {
  retail: "bg-neutral-100 text-neutral-600",
  wholesale: "bg-blue-100 text-blue-700",
  vip: "bg-purple-100 text-purple-700",
};

export function CustomerDetailPage() {
  const { selectedId, navigate } = useApp();
  const customer = mockCustomers.find(c => c.id === selectedId) ?? mockCustomers[0];
  const orders = mockOrders.filter(o => o.customerPhone === customer?.phone);

  if (!customer) return null;

  const initials = customer.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="p-5 max-w-[1000px] mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("customers")} className="p-2 text-neutral-500 hover:text-neutral-900 hover:bg-white rounded-lg transition-colors">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-neutral-900" style={{ fontWeight: 700, fontSize: "20px" }}>ข้อมูลลูกค้า</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Profile + Stats */}
        <div className="space-y-4">

          {/* Profile card */}
          <div className="bg-white rounded-xl border border-neutral-100 p-5">
            <div className="flex flex-col items-center text-center pb-5">
              <div className="w-16 h-16 rounded-xl bg-neutral-950 flex items-center justify-center mb-3 shadow-sm shadow-neutral-200">
                <span className="text-white" style={{ fontSize: "20px", fontWeight: 800 }}>{initials}</span>
              </div>
              <h2 className="text-neutral-900" style={{ fontWeight: 700, fontSize: "17px" }}>{customer.name}</h2>
              <div className="flex items-center gap-2 mt-2">
                <span className={`px-2.5 py-0.5 rounded-full text-xs ${typeColor[customer.type]}`}>
                  {typeLabel[customer.type]}
                </span>
                {customer.isVip && (
                  <span className="flex items-center gap-1 px-2.5 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                    <Star size={10} className="fill-yellow-500" /> VIP
                  </span>
                )}
              </div>
              <p className="text-neutral-400 mt-2" style={{ fontSize: "12px" }}>
                สมาชิกตั้งแต่ {new Date(customer.createdAt).toLocaleDateString("th-TH", { year: "numeric", month: "long" })}
              </p>
            </div>

            <div className="space-y-3 border-t border-neutral-100 pt-4">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0">
                  <Phone size={13} className="text-neutral-500" />
                </div>
                <span className="text-neutral-700" style={{ fontSize: "13.5px" }}>{customer.phone}</span>
              </div>
              {customer.email && (
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0">
                    <Mail size={13} className="text-neutral-500" />
                  </div>
                  <span className="text-neutral-700" style={{ fontSize: "13.5px" }}>{customer.email}</span>
                </div>
              )}
              {customer.addresses.map(addr => (
                <div key={addr.id} className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin size={13} className="text-neutral-500" />
                  </div>
                  <div>
                    <p className="text-neutral-400" style={{ fontSize: "11px" }}>
                      {addr.label}{addr.isDefault ? " · default" : ""}
                    </p>
                    <p className="text-neutral-700" style={{ fontSize: "13px" }}>{addr.address}</p>
                  </div>
                </div>
              ))}
            </div>

            {customer.notes && (
              <div className="mt-4 pt-4 border-t border-neutral-100">
                <p className="text-neutral-400 mb-1" style={{ fontSize: "12px" }}>หมายเหตุ</p>
                <p className="text-neutral-700" style={{ fontSize: "13.5px" }}>{customer.notes}</p>
              </div>
            )}

            <div className="flex gap-2 mt-4 pt-4 border-t border-neutral-100">
              <button className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-neutral-200 text-neutral-600 rounded-lg hover:bg-neutral-50 hover:border-neutral-400 hover:text-neutral-800 transition-colors" style={{ fontSize: "12.5px" }}>
                <Edit size={12} /> แก้ไข
              </button>
              <button className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-neutral-200 text-neutral-600 rounded-lg hover:bg-neutral-50 hover:border-neutral-400 hover:text-neutral-800 transition-colors" style={{ fontSize: "12.5px" }}>
                <Plus size={12} /> เพิ่มที่อยู่
              </button>
            </div>
          </div>

          {/* Stats — dark card */}
          <div className="bg-neutral-950 rounded-xl p-5">
            <p className="text-neutral-400 mb-4" style={{ fontSize: "12.5px", fontWeight: 500 }}>สรุปการซื้อ</p>
            <div className="space-y-4">
              <div>
                <p className="text-neutral-500" style={{ fontSize: "11.5px" }}>ออเดอร์ทั้งหมด</p>
                <p className="text-white" style={{ fontWeight: 700, fontSize: "28px" }}>{customer.totalOrders}</p>
              </div>
              <div>
                <p className="text-neutral-500" style={{ fontSize: "11.5px" }}>ยอดซื้อรวม</p>
                <p className="text-neutral-600" style={{ fontWeight: 700, fontSize: "20px" }}>
                  {customer.totalSpent > 0 ? Math.round(customer.totalSpent).toLocaleString("en-US") : "—"}
                </p>
              </div>
              <div>
                <p className="text-neutral-500" style={{ fontSize: "11.5px" }}>ออเดอร์ล่าสุด</p>
                <p className="text-neutral-300" style={{ fontSize: "13.5px", fontWeight: 500 }}>
                  {customer.lastOrderDate
                    ? new Date(customer.lastOrderDate).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" })
                    : "—"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Order History */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-neutral-100 p-5">
            <h3 className="text-neutral-900 mb-4" style={{ fontWeight: 600 }}>ประวัติออเดอร์</h3>

            {orders.length === 0 ? (
              <div className="py-14 text-center">
                <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center mx-auto mb-3">
                  <ShoppingBag size={22} className="text-neutral-400" />
                </div>
                <p className="text-neutral-500" style={{ fontSize: "14px" }}>ยังไม่มีประวัติการสั่งซื้อ</p>
              </div>
            ) : (
              <div className="space-y-2">
                {orders.map(order => (
                  <div
                    key={order.id}
                    className="flex items-center gap-4 p-4 rounded-lg border border-neutral-100 hover:border-neutral-300 hover:bg-neutral-100/50 cursor-pointer transition-all"
                    onClick={() => navigate("order-detail", order.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-neutral-900 font-mono" style={{ fontWeight: 600, fontSize: "13.5px" }}>
                          {order.orderNumber}
                        </p>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          order.status === "paid" ? "bg-green-100 text-green-700" :
                          order.status === "cancelled" ? "bg-red-100 text-red-600" :
                          "bg-amber-100 text-amber-700"
                        }`} style={{ fontSize: "11px" }}>
                          {order.status === "paid" ? "ชำระแล้ว" : order.status === "cancelled" ? "ยกเลิก" : "รอดำเนินการ"}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          order.channel === "web" ? "bg-blue-100 text-blue-700" :
                          order.channel === "chat" ? "bg-purple-100 text-purple-700" :
                          "bg-neutral-100 text-neutral-700"
                        }`} style={{ fontSize: "11px" }}>
                          {order.channel}
                        </span>
                      </div>
                      <p className="text-neutral-400 truncate" style={{ fontSize: "12px" }}>
                        {order.items.map(i => i.productName).join(", ")}
                      </p>
                      <p className="text-neutral-300 mt-0.5" style={{ fontSize: "11.5px" }}>
                        {new Date(order.createdAt).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-neutral-900" style={{ fontWeight: 700, fontSize: "14px" }}>
                        {Math.round(order.totalAmount).toLocaleString("en-US")}
                      </p>
                      <p className="text-neutral-400" style={{ fontSize: "11.5px" }}>
                        {order.items.reduce((s, i) => s + i.quantity, 0)} ชิ้น
                      </p>
                    </div>
                    <ChevronRight size={14} className="text-neutral-300 shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
