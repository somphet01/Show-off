import { useState } from "react";
import { useApp } from "../../context";
import { mockPurchaseOrders } from "../../mockData";
import type { PurchaseOrderStatus } from "../../types";
import { Plus, ChevronRight, CheckCircle, AlertTriangle } from "lucide-react";
import { useAdminFeedback } from "../ui/AdminFeedback";

const statusLabel: Record<PurchaseOrderStatus, string> = {
  draft: "Draft", ordered: "สั่งแล้ว",
  in_transit: "กำลังขนส่ง", received: "รับแล้ว", closed: "ปิดแล้ว",
};
const statusColor: Record<PurchaseOrderStatus, string> = {
  draft: "bg-neutral-100 text-neutral-600",
  ordered: "bg-blue-100 text-blue-700",
  in_transit: "bg-amber-100 text-amber-700",
  received: "bg-green-100 text-green-700",
  closed: "bg-neutral-100 text-neutral-500",
};

const inputCls = "w-full border border-neutral-200 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:border-transparent bg-neutral-50 text-neutral-900";

/* ─── PO List ─── */
export function PurchaseOrdersListPage() {
  const { navigate } = useApp();
  const [filterStatus, setFilterStatus] = useState<PurchaseOrderStatus | "all">("all");

  const filtered = mockPurchaseOrders.filter(po =>
    filterStatus === "all" || po.status === filterStatus
  );

  return (
    <div className="p-5 space-y-4 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-neutral-900" style={{ fontWeight: 700, fontSize: "20px" }}>Purchase Orders</h1>
        <button
          onClick={() => navigate("create-purchase-order")}
          className="flex items-center gap-2 px-4 py-2.5 bg-neutral-950 text-white rounded-lg hover:bg-neutral-800 transition-colors"
          style={{ fontSize: "13px", fontWeight: 500 }}
        >
          <Plus size={14} /> สร้าง PO
        </button>
      </div>

      {/* Status filter pills */}
      <div className="bg-white rounded-xl border border-neutral-100 p-4">
        <div className="flex flex-wrap gap-2">
          {([
            { v: "all" as const, l: "ทั้งหมด" },
            { v: "draft" as const, l: "Draft" },
            { v: "ordered" as const, l: "สั่งแล้ว" },
            { v: "in_transit" as const, l: "กำลังขนส่ง" },
            { v: "received" as const, l: "รับแล้ว" },
          ] as const).map(f => (
            <button
              key={f.v}
              onClick={() => setFilterStatus(f.v)}
              className={`px-3.5 py-1.5 rounded-lg transition-colors ${filterStatus === f.v
                ? "bg-neutral-950 text-white"
                : "border border-neutral-200 text-neutral-600 hover:border-neutral-400"}`}
              style={{ fontSize: "12.5px" }}
            >
              {f.l}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-neutral-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-100">
                {["เลข PO", "Supplier", "สถานะ", "สกุลเงิน", "ต้นทุนรวม", "วันที่สั่ง", "วันที่คาด", ""].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-neutral-400" style={{ fontSize: "11.5px", fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {filtered.map(po => (
                <tr
                  key={po.id}
                  className="hover:bg-neutral-50/50 cursor-pointer transition-colors"
                  onClick={() => navigate("purchase-order-detail", po.id)}
                >
                  <td className="px-5 py-3.5">
                    <span className="text-neutral-900 font-mono" style={{ fontSize: "13px", fontWeight: 500 }}>{po.poNumber}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-neutral-800" style={{ fontSize: "13px" }}>{po.supplier}</p>
                    <p className="text-neutral-400" style={{ fontSize: "11.5px" }}>{po.supplierContact}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-xs ${statusColor[po.status]}`} style={{ fontSize: "11.5px" }}>
                      {statusLabel[po.status]}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-neutral-700" style={{ fontSize: "13px" }}>{po.currency}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-neutral-900" style={{ fontSize: "13px", fontWeight: 600 }}>
                      {po.totalCost.toLocaleString()} {po.currency}
                    </p>
                    <p className="text-neutral-400" style={{ fontSize: "11px" }}>
                      ≈ {Math.round(po.totalCost * po.exchangeRate).toLocaleString("en-US")}
                    </p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-neutral-500" style={{ fontSize: "12.5px" }}>{po.orderDate}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-neutral-500" style={{ fontSize: "12.5px" }}>{po.expectedDate}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <ChevronRight size={14} className="text-neutral-300" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-neutral-400" style={{ fontSize: "14px" }}>ไม่มี Purchase Orders</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Create PO ─── */
export function CreatePurchaseOrderPage() {
  const { navigate } = useApp();
  const feedback = useAdminFeedback();
  const [supplier, setSupplier] = useState("");
  const [supplierContact, setSupplierContact] = useState("");
  const [currency, setCurrency] = useState<"CNY" | "THB" | "USD">("CNY");
  const [exchangeRate, setExchangeRate] = useState(4800);
  const [orderDate, setOrderDate] = useState("2026-06-26");
  const [expectedDate, setExpectedDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([
    { id: "i1", productName: "", sku: "", variant: "", qty: 1, unitCost: 0 },
  ]);
  const [shippingCost, setShippingCost] = useState(0);
  const [otherCost, setOtherCost] = useState(0);
  const [saved, setSaved] = useState(false);

  const subtotal = items.reduce((s, i) => s + i.qty * i.unitCost, 0);
  const total = subtotal + shippingCost + otherCost;
  const totalLAK = total * exchangeRate;

  const addItem = () => setItems(is => [...is, { id: `i${Date.now()}`, productName: "", sku: "", variant: "", qty: 1, unitCost: 0 }]);
  const removeItem = async (id: string) => {
    const item = items.find(i => i.id === id);
    const ok = await feedback.confirm({
      title: "ລຶບລາຍການນີ້?",
      description: "ລາຍການສິນຄ້ານີ້ຈະຖືກຖອນອອກຈາກ PO.",
      itemName: item?.productName || item?.sku || "PO item",
      confirmLabel: "ລຶບ",
    });
    if (!ok) return;
    setItems(is => is.filter(i => i.id !== id));
    feedback.success("ລຶບລາຍການສຳເລັດ", item?.productName || item?.sku);
  };
  const updateItem = (id: string, field: string, value: string | number) =>
    setItems(is => is.map(i => i.id === id ? { ...i, [field]: value } : i));

  if (saved) return (
    <div className="flex flex-col items-center justify-center h-96 gap-4">
      <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center">
        <CheckCircle size={28} className="text-green-600" />
      </div>
      <p className="text-neutral-900" style={{ fontWeight: 600, fontSize: "17px" }}>สร้าง PO สำเร็จ</p>
    </div>
  );

  return (
    <div className="p-5 max-w-[1000px] mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("purchase-orders")} className="p-2 text-neutral-500 hover:text-neutral-900 hover:bg-white rounded-lg transition-colors">←</button>
          <h1 className="text-neutral-900" style={{ fontWeight: 700, fontSize: "20px" }}>สร้าง Purchase Order</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { feedback.success("ບັນທຶກ Draft ສຳເລັດ"); setSaved(true); }} className="px-4 py-2 border border-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors" style={{ fontSize: "13.5px" }}>Save Draft</button>
          <button onClick={() => { feedback.success("ບັນທຶກ PO ສຳເລັດ"); setSaved(true); }} className="px-4 py-2 bg-neutral-950 text-white rounded-lg hover:bg-neutral-800 transition-colors" style={{ fontSize: "13.5px", fontWeight: 500 }}>Mark Ordered</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {/* Supplier */}
          <div className="bg-white rounded-xl border border-neutral-100 p-5 space-y-3">
            <h3 className="text-neutral-900" style={{ fontWeight: 600 }}>ข้อมูล Supplier</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-neutral-500 mb-1.5" style={{ fontSize: "12.5px", fontWeight: 500 }}>ชื่อ Supplier</label>
                <input value={supplier} onChange={e => setSupplier(e.target.value)} className={inputCls} style={{ fontSize: "13.5px" }} placeholder="Supplier A - Guangzhou" />
              </div>
              <div>
                <label className="block text-neutral-500 mb-1.5" style={{ fontSize: "12.5px", fontWeight: 500 }}>ช่องทางติดต่อ</label>
                <input value={supplierContact} onChange={e => setSupplierContact(e.target.value)} className={inputCls} style={{ fontSize: "13.5px" }} placeholder="WeChat / LINE ID" />
              </div>
              <div>
                <label className="block text-neutral-500 mb-1.5" style={{ fontSize: "12.5px", fontWeight: 500 }}>วันที่สั่ง</label>
                <input type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)} className={inputCls} style={{ fontSize: "13.5px" }} />
              </div>
              <div>
                <label className="block text-neutral-500 mb-1.5" style={{ fontSize: "12.5px", fontWeight: 500 }}>วันที่คาดได้รับ</label>
                <input type="date" value={expectedDate} onChange={e => setExpectedDate(e.target.value)} className={inputCls} style={{ fontSize: "13.5px" }} />
              </div>
              <div>
                <label className="block text-neutral-500 mb-1.5" style={{ fontSize: "12.5px", fontWeight: 500 }}>สกุลเงิน</label>
                <select value={currency} onChange={e => setCurrency(e.target.value as any)} className={inputCls} style={{ fontSize: "13.5px" }}>
                  <option value="CNY">CNY (หยวน)</option>
                  <option value="THB">THB (บาท)</option>
                  <option value="USD">USD (ดอลลาร์)</option>
                </select>
              </div>
              <div>
                <label className="block text-neutral-500 mb-1.5" style={{ fontSize: "12.5px", fontWeight: 500 }}>อัตราแลก (→ LAK)</label>
                <input type="number" value={exchangeRate} onChange={e => setExchangeRate(parseInt(e.target.value) || 0)} className={inputCls} style={{ fontSize: "13.5px" }} />
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="bg-white rounded-xl border border-neutral-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-neutral-900" style={{ fontWeight: 600 }}>รายการสินค้า</h3>
              <button onClick={addItem} className="flex items-center gap-1.5 px-3 py-1.5 border border-neutral-200 text-neutral-600 rounded-lg hover:border-neutral-400 hover:text-neutral-800 transition-colors" style={{ fontSize: "13px" }}>
                <Plus size={13} /> เพิ่มรายการ
              </button>
            </div>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={item.id} className="grid grid-cols-6 gap-2 p-3 bg-neutral-50 rounded-lg items-end">
                  <div className="col-span-2">
                    <label className="block text-neutral-400 mb-1" style={{ fontSize: "11px" }}>ชื่อสินค้า</label>
                    <input value={item.productName} onChange={e => updateItem(item.id, "productName", e.target.value)} className="w-full border border-neutral-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-400" style={{ fontSize: "12.5px" }} placeholder="ชื่อสินค้า" />
                  </div>
                  <div>
                    <label className="block text-neutral-400 mb-1" style={{ fontSize: "11px" }}>SKU</label>
                    <input value={item.sku} onChange={e => updateItem(item.id, "sku", e.target.value)} className="w-full border border-neutral-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-400 font-mono" style={{ fontSize: "12px" }} />
                  </div>
                  <div>
                    <label className="block text-neutral-400 mb-1" style={{ fontSize: "11px" }}>Variant</label>
                    <input value={item.variant} onChange={e => updateItem(item.id, "variant", e.target.value)} className="w-full border border-neutral-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-400" style={{ fontSize: "12px" }} />
                  </div>
                  <div>
                    <label className="block text-neutral-400 mb-1" style={{ fontSize: "11px" }}>จำนวน</label>
                    <input type="number" value={item.qty} onChange={e => updateItem(item.id, "qty", parseInt(e.target.value) || 0)} className="w-full border border-neutral-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-400" style={{ fontSize: "12.5px" }} />
                  </div>
                  <div className="relative">
                    <label className="block text-neutral-400 mb-1" style={{ fontSize: "11px" }}>ราคา/{currency}</label>
                    <input type="number" value={item.unitCost} onChange={e => updateItem(item.id, "unitCost", parseInt(e.target.value) || 0)} className="w-full border border-neutral-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-400" style={{ fontSize: "12.5px" }} />
                    {items.length > 1 && (
                      <button onClick={() => void removeItem(item.id)} className="absolute -top-2 -right-2 w-5 h-5 bg-red-100 text-red-500 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors" style={{ fontSize: "12px" }}>×</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-neutral-500 mb-1.5" style={{ fontSize: "12.5px", fontWeight: 500 }}>หมายเหตุ</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} className={inputCls} style={{ fontSize: "13.5px" }} rows={2} placeholder="หมายเหตุ..." />
          </div>
        </div>

        {/* Cost Summary — dark */}
        <div>
          <div className="bg-neutral-950 rounded-xl p-5 sticky top-5 space-y-4 text-white">
            <h3 className="text-white" style={{ fontWeight: 600 }}>สรุปต้นทุน</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-neutral-400 mb-1.5" style={{ fontSize: "12px" }}>ค่าขนส่ง ({currency})</label>
                <input type="number" value={shippingCost} onChange={e => setShippingCost(parseInt(e.target.value) || 0)} className="w-full border border-neutral-700 rounded-lg px-3 py-2.5 bg-neutral-800 text-white focus:outline-none focus:ring-2 focus:ring-neutral-400" style={{ fontSize: "13.5px" }} />
              </div>
              <div>
                <label className="block text-neutral-400 mb-1.5" style={{ fontSize: "12px" }}>ค่าใช้จ่ายอื่น ({currency})</label>
                <input type="number" value={otherCost} onChange={e => setOtherCost(parseInt(e.target.value) || 0)} className="w-full border border-neutral-700 rounded-lg px-3 py-2.5 bg-neutral-800 text-white focus:outline-none focus:ring-2 focus:ring-neutral-400" style={{ fontSize: "13.5px" }} />
              </div>
            </div>
            <div className="border-t border-neutral-700 pt-4 space-y-2">
              <div className="flex justify-between text-neutral-400" style={{ fontSize: "13px" }}>
                <span>Subtotal</span><span>{subtotal.toLocaleString()} {currency}</span>
              </div>
              <div className="flex justify-between text-neutral-400" style={{ fontSize: "13px" }}>
                <span>ค่าส่ง</span><span>{shippingCost.toLocaleString()} {currency}</span>
              </div>
              <div className="flex justify-between text-neutral-400" style={{ fontSize: "13px" }}>
                <span>อื่นๆ</span><span>{otherCost.toLocaleString()} {currency}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-neutral-700">
                <span className="text-white" style={{ fontSize: "15px", fontWeight: 600 }}>รวม</span>
                <span className="text-neutral-600" style={{ fontSize: "18px", fontWeight: 700 }}>{total.toLocaleString()} {currency}</span>
              </div>
              <div className="flex justify-between text-neutral-500" style={{ fontSize: "12px" }}>
                <span>≈ LAK</span>
                <span>{Math.round(totalLAK).toLocaleString("en-US")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── PO Detail ─── */
export function PurchaseOrderDetailPage() {
  const { selectedId, navigate } = useApp();
  const po = mockPurchaseOrders.find(p => p.id === selectedId) ?? mockPurchaseOrders[0];
  const [showReceiveConfirm, setShowReceiveConfirm] = useState(false);
  const [received, setReceived] = useState(po.status === "received");

  if (!po) return null;

  const totalLAK = po.totalCost * po.exchangeRate;

  return (
    <div className="p-5 max-w-[1000px] mx-auto space-y-4">
      {showReceiveConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <h3 className="text-neutral-900" style={{ fontWeight: 600, fontSize: "17px" }}>ยืนยันรับสินค้า</h3>
            <p className="text-neutral-600" style={{ fontSize: "14px" }}>
              กำลังจะทำเครื่องหมายว่ารับสินค้า <strong>{po.poNumber}</strong> แล้ว
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-1.5">
              <div className="flex items-start gap-2">
                <AlertTriangle size={13} className="text-amber-500 mt-0.5 shrink-0" />
                <div className="text-amber-700 space-y-1" style={{ fontSize: "12.5px" }}>
                  <p>• สต็อกจะเพิ่มตามจำนวนสินค้าใน PO</p>
                  <p>• Stock movement จะถูกสร้างอัตโนมัติ</p>
                  <p>• ต้นทุนสินค้าอาจถูกอัปเดต</p>
                  <p>• ไม่สามารถย้อนกลับได้</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowReceiveConfirm(false)} className="flex-1 py-2.5 border border-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-50" style={{ fontSize: "14px" }}>ยกเลิก</button>
              <button
                onClick={() => { setShowReceiveConfirm(false); setReceived(true); }}
                className="flex-1 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700"
                style={{ fontSize: "14px", fontWeight: 500 }}
              >
                ยืนยันรับสินค้า
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("purchase-orders")} className="p-2 text-neutral-500 hover:text-neutral-900 hover:bg-white rounded-lg transition-colors">←</button>
          <h1 className="text-neutral-900" style={{ fontWeight: 700, fontSize: "20px" }}>{po.poNumber}</h1>
          <span className={`px-2.5 py-1 rounded-full text-xs ${
            received || po.status === "received" ? "bg-green-100 text-green-700" :
            po.status === "in_transit" ? "bg-amber-100 text-amber-700" :
            po.status === "ordered" ? "bg-blue-100 text-blue-700" :
            "bg-neutral-100 text-neutral-600"
          }`} style={{ fontSize: "12px" }}>
            {received ? "รับแล้ว" : statusLabel[po.status]}
          </span>
        </div>
        {!received && po.status !== "closed" && (
          <button
            onClick={() => setShowReceiveConfirm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            style={{ fontSize: "13.5px", fontWeight: 500 }}
          >
            <CheckCircle size={15} /> รับสินค้าแล้ว
          </button>
        )}
        {received && (
          <div className="flex items-center gap-1.5 text-green-600" style={{ fontSize: "13.5px" }}>
            <CheckCircle size={15} /> รับสินค้าแล้ว
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">

          {/* Items table */}
          <div className="bg-white rounded-xl border border-neutral-100 p-5">
            <h3 className="text-neutral-900 mb-4" style={{ fontWeight: 600 }}>รายการสินค้า</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-100">
                    {["สินค้า", "SKU", "Variant", "จำนวน", "ราคา/ชิ้น", "รวม"].map(h => (
                      <th key={h} className="text-left pb-2.5 text-neutral-400" style={{ fontSize: "11.5px", fontWeight: 500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {po.items.map(item => (
                    <tr key={item.id}>
                      <td className="py-3 pr-3"><p className="text-neutral-900" style={{ fontSize: "13.5px" }}>{item.productName}</p></td>
                      <td className="py-3 pr-3"><span className="font-mono text-neutral-500" style={{ fontSize: "12px" }}>{item.sku}</span></td>
                      <td className="py-3 pr-3"><span className="text-neutral-700" style={{ fontSize: "13px" }}>{item.variant}</span></td>
                      <td className="py-3 pr-3"><span className="text-neutral-900" style={{ fontSize: "13.5px", fontWeight: 600 }}>{item.quantity}</span></td>
                      <td className="py-3 pr-3"><span className="text-neutral-600" style={{ fontSize: "13px" }}>{item.unitCost} {po.currency}</span></td>
                      <td className="py-3"><span className="text-neutral-900" style={{ fontSize: "13.5px", fontWeight: 600 }}>{item.lineTotal} {po.currency}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl border border-neutral-100 p-5">
            <h3 className="text-neutral-900 mb-4" style={{ fontWeight: 600 }}>Timeline</h3>
            <div className="space-y-3">
              {po.timeline.map((t, i) => (
                <div key={t.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-neutral-400 mt-1.5 shrink-0" />
                    {i < po.timeline.length - 1 && <div className="w-px flex-1 bg-neutral-200 mt-1" />}
                  </div>
                  <div className="pb-3">
                    <p className="text-neutral-900" style={{ fontSize: "13.5px", fontWeight: 500 }}>{t.event}</p>
                    {t.detail && <p className="text-neutral-500" style={{ fontSize: "12.5px" }}>{t.detail}</p>}
                    <p className="text-neutral-400 mt-0.5" style={{ fontSize: "11.5px" }}>
                      {new Date(t.createdAt).toLocaleString("th-TH")} · {t.by}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Supplier */}
          <div className="bg-white rounded-xl border border-neutral-100 p-5">
            <h3 className="text-neutral-900 mb-3" style={{ fontWeight: 600 }}>Supplier</h3>
            <p className="text-neutral-900" style={{ fontWeight: 600 }}>{po.supplier}</p>
            <p className="text-neutral-500 mt-1" style={{ fontSize: "13.5px" }}>{po.supplierContact}</p>
            <div className="mt-4 pt-4 border-t border-neutral-100 space-y-2">
              {[
                ["วันที่สั่ง", po.orderDate],
                ["วันที่คาด", po.expectedDate],
                po.receivedDate ? ["วันที่รับ", po.receivedDate] : null,
              ].filter(Boolean).map(([l, v]: any) => (
                <div key={l} className="flex justify-between">
                  <span className="text-neutral-400" style={{ fontSize: "12.5px" }}>{l}</span>
                  <span className="text-neutral-700" style={{ fontSize: "12.5px" }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Cost Summary — dark */}
          <div className="bg-neutral-950 rounded-xl p-5 text-white">
            <h3 className="text-neutral-400 mb-4" style={{ fontSize: "12.5px" }}>สรุปต้นทุน</h3>
            <div className="space-y-2">
              {[
                ["Subtotal", `${po.subtotal} ${po.currency}`],
                ["ค่าส่ง", `${po.shippingCost} ${po.currency}`],
                ["อื่นๆ", `${po.otherCost} ${po.currency}`],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between text-neutral-400" style={{ fontSize: "13px" }}>
                  <span>{l}</span><span>{v}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2 border-t border-neutral-700">
                <span className="text-white" style={{ fontSize: "15px", fontWeight: 600 }}>รวม</span>
                <span className="text-neutral-600" style={{ fontSize: "16px", fontWeight: 700 }}>{po.totalCost} {po.currency}</span>
              </div>
              <div className="flex justify-between text-neutral-500" style={{ fontSize: "12px" }}>
                <span>1 {po.currency} = {po.exchangeRate.toLocaleString()} LAK</span>
              </div>
              <div className="flex justify-between text-neutral-300 pt-1" style={{ fontSize: "13px", fontWeight: 600 }}>
                <span>≈ LAK</span>
                <span>{Math.round(totalLAK).toLocaleString("en-US")}</span>
              </div>
            </div>
          </div>

          {po.notes && (
            <div className="bg-white rounded-xl border border-neutral-100 p-5">
              <h3 className="text-neutral-900 mb-2" style={{ fontWeight: 600 }}>หมายเหตุ</h3>
              <p className="text-neutral-600" style={{ fontSize: "13.5px" }}>{po.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
