import { useState } from "react";
import { useApp } from "../../context";
import { mockCoupons } from "../../mockData";
import type { CouponStatus } from "../../types";
import { Plus, Edit, Trash2, AlertTriangle, CheckCircle, Percent, Hash } from "lucide-react";
import { useAdminFeedback } from "../ui/AdminFeedback";

const statusLabel: Record<CouponStatus, string> = { active: "Active", inactive: "Inactive", expired: "หมดอายุ", usage_limit_reached: "ใช้ครบ" };
const statusColor: Record<CouponStatus, string> = {
  active: "bg-green-100 text-green-700", inactive: "bg-neutral-100 text-neutral-600",
  expired: "bg-red-100 text-red-600", usage_limit_reached: "bg-amber-100 text-amber-700",
};

export function CouponsListPage() {
  const { navigate } = useApp();
  const feedback = useAdminFeedback();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleted, setDeleted] = useState<string[]>([]);
  const coupons = mockCoupons.filter(c => !deleted.includes(c.id));

  const deleteCoupon = async (id: string) => {
    const coupon = mockCoupons.find((item) => item.id === id);
    const confirmed = await feedback.confirm({
      title: "ລຶບຄູປອງນີ້?",
      description: "ຄູປອງນີ້ຈະຖືກລຶບອອກຈາກລາຍການ.",
      itemName: coupon?.code,
      confirmLabel: "ລຶບຄູປອງ",
    });

    if (!confirmed) return;
    setDeleted((items) => [...items, id]);
    setDeleteTarget(null);
    feedback.success("ລຶບຄູປອງສຳເລັດ", coupon?.code);
  };

  return (
    <div className="p-5 space-y-4 max-w-[1100px] mx-auto">
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <h3 className="text-neutral-900" style={{ fontWeight: 600, fontSize: "17px" }}>ลบคูปอง</h3>
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
              <AlertTriangle size={14} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-red-700" style={{ fontSize: "13px" }}>คูปองจะถูกลบถาวร ไม่สามารถกู้คืนได้</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 border border-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-50" style={{ fontSize: "14px" }}>ยกเลิก</button>
              <button onClick={() => void deleteCoupon(deleteTarget)} className="flex-1 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700" style={{ fontSize: "14px", fontWeight: 500 }}>ลบ</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-neutral-900" style={{ fontWeight: 700, fontSize: "20px" }}>Coupons</h1>
        <button onClick={() => navigate("create-coupon")} className="flex items-center gap-2 px-4 py-2.5 bg-neutral-950 text-white rounded-lg hover:bg-neutral-800 transition-colors" style={{ fontSize: "13px", fontWeight: 500 }}>
          <Plus size={14} /> สร้างคูปอง
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {coupons.map(c => (
          <div key={c.id} className="bg-white rounded-xl border border-neutral-100 p-5 hover:shadow-sm transition-all">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-900">
                    {c.discountType === "percentage" ? <Percent size={14} /> : <Hash size={14} />}
                  </div>
                  <p className="font-mono text-neutral-900" style={{ fontWeight: 700, fontSize: "16px" }}>{c.code}</p>
                </div>
                <span className={`mt-2 inline-block px-2.5 py-0.5 rounded-full text-xs ${statusColor[c.status]}`}>{statusLabel[c.status]}</span>
              </div>
              <div className="flex gap-1">
                <button onClick={() => navigate("create-coupon", c.id)} className="p-1.5 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50 rounded-lg transition-colors"><Edit size={13} /></button>
                <button onClick={() => void deleteCoupon(c.id)} className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={13} /></button>
              </div>
            </div>
            <div className="bg-neutral-50 rounded-lg p-3 space-y-2">
              <div className="flex justify-between">
                <span className="text-neutral-500" style={{ fontSize: "13px" }}>ส่วนลด</span>
                <span className="text-neutral-900" style={{ fontWeight: 700, fontSize: "15px" }}>
                  {c.discountType === "percentage" ? `${c.discountValue}%` : `${c.discountValue.toLocaleString()} LAK`}
                </span>
              </div>
              <div className="flex justify-between text-neutral-500" style={{ fontSize: "12.5px" }}>
                <span>สั่งขั้นต่ำ</span><span>{c.minimumOrderAmount.toLocaleString()} LAK</span>
              </div>
              <div className="flex justify-between text-neutral-500" style={{ fontSize: "12.5px" }}>
                <span>ใช้แล้ว</span><span>{c.usedCount}/{c.usageLimit}</span>
              </div>
            </div>
            <div className="mt-3">
              <div className="w-full bg-neutral-100 rounded-full h-1.5">
                <div className={`h-1.5 rounded-full ${c.usedCount >= c.usageLimit ? "bg-red-400" : "bg-neutral-950"}`} style={{ width: `${Math.min((c.usedCount / c.usageLimit) * 100, 100)}%` }} />
              </div>
              <div className="flex justify-between mt-1.5 text-neutral-400" style={{ fontSize: "11px" }}>
                <span>หมดอายุ</span><span>{c.expiresAt}</span>
              </div>
            </div>
          </div>
        ))}
        {coupons.length === 0 && (
          <div className="col-span-3 py-16 text-center bg-white rounded-xl border border-neutral-100">
            <p className="text-neutral-400" style={{ fontSize: "14px" }}>ไม่มีคูปอง</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function CreateEditCouponPage() {
  const { navigate, selectedId, currentPage } = useApp();
  const feedback = useAdminFeedback();
  const isEdit = currentPage === "create-coupon" && !!selectedId;
  const existing = isEdit ? mockCoupons.find(c => c.id === selectedId) : null;
  const [code, setCode] = useState(existing?.code ?? "");
  const [active, setActive] = useState(existing?.status === "active" ?? true);
  const [discountType, setDiscountType] = useState<"percentage" | "fixed_amount">(existing?.discountType ?? "percentage");
  const [discountValue, setDiscountValue] = useState(existing?.discountValue ?? 10);
  const [minOrder, setMinOrder] = useState(existing?.minimumOrderAmount ?? 0);
  const [usageLimit, setUsageLimit] = useState(existing?.usageLimit ?? 100);
  const [startDate, setStartDate] = useState(existing?.startDate ?? "2026-07-01");
  const [expiresAt, setExpiresAt] = useState(existing?.expiresAt ?? "2026-12-31");
  const [saved, setSaved] = useState(false);

  const codeError = code.length > 0 && !isEdit && mockCoupons.some(c => c.code === code);
  const inputCls = "w-full border border-neutral-200 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-neutral-400 bg-neutral-50 text-neutral-900";

  if (saved) return (
    <div className="flex flex-col items-center justify-center h-96 gap-4">
      <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center"><CheckCircle size={28} className="text-green-600" /></div>
      <p className="text-neutral-900" style={{ fontWeight: 600, fontSize: "17px" }}>{isEdit ? "บันทึกสำเร็จ" : "สร้างคูปองสำเร็จ"}</p>
    </div>
  );

  return (
    <div className="p-5 max-w-[560px] mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("coupons")} className="p-2 text-neutral-500 hover:text-neutral-900 hover:bg-white rounded-lg transition-colors">←</button>
        <h1 className="text-neutral-900" style={{ fontWeight: 700, fontSize: "20px" }}>{isEdit ? "แก้ไขคูปอง" : "สร้างคูปอง"}</h1>
      </div>

      <div className="bg-white rounded-xl border border-neutral-100 p-6 space-y-5">
        <div>
          <label className="block text-neutral-500 mb-1.5" style={{ fontSize: "12.5px", fontWeight: 500 }}>Code <span className="text-red-500">*</span></label>
          <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} className={`${inputCls} font-mono ${codeError ? "border-red-300 ring-2 ring-red-200" : ""}`} style={{ fontSize: "16px", fontWeight: 700, letterSpacing: "0.05em" }} placeholder="SUMMER20" />
          {codeError && <p className="text-red-500 mt-1" style={{ fontSize: "12.5px" }}>Code นี้ถูกใช้แล้ว</p>}
        </div>

        <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
          <div><p className="text-neutral-800" style={{ fontSize: "13.5px", fontWeight: 500 }}>เปิดใช้งาน</p><p className="text-neutral-400" style={{ fontSize: "12px" }}>ลูกค้าสามารถใช้คูปองนี้ได้</p></div>
          <button onClick={() => setActive(a => !a)} className={`w-11 h-6 rounded-full transition-colors relative ${active ? "bg-neutral-950" : "bg-neutral-300"}`}>
            <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all shadow ${active ? "left-6" : "left-1"}`} />
          </button>
        </div>

        <div>
          <label className="block text-neutral-500 mb-2" style={{ fontSize: "12.5px", fontWeight: 500 }}>ประเภทส่วนลด</label>
          <div className="grid grid-cols-2 gap-2">
            {[{ v: "percentage" as const, l: "เปอร์เซ็นต์ (%)" }, { v: "fixed_amount" as const, l: "ลดคงที่ (LAK)" }].map(o => (
              <button key={o.v} onClick={() => setDiscountType(o.v)} className={`py-2.5 rounded-lg border-2 transition-colors ${discountType === o.v ? "border-neutral-900 bg-neutral-50 text-neutral-800" : "border-neutral-200 text-neutral-600"}`} style={{ fontSize: "13px" }}>{o.l}</button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-neutral-500 mb-1.5" style={{ fontSize: "12.5px", fontWeight: 500 }}>มูลค่า ({discountType === "percentage" ? "%" : "LAK"})</label><input type="number" value={discountValue} onChange={e => setDiscountValue(parseFloat(e.target.value) || 0)} className={inputCls} style={{ fontSize: "14px", fontWeight: 600 }} /></div>
          <div><label className="block text-neutral-500 mb-1.5" style={{ fontSize: "12.5px", fontWeight: 500 }}>ยอดขั้นต่ำ (LAK)</label><input type="number" value={minOrder} onChange={e => setMinOrder(parseInt(e.target.value) || 0)} className={inputCls} style={{ fontSize: "13.5px" }} /></div>
          <div><label className="block text-neutral-500 mb-1.5" style={{ fontSize: "12.5px", fontWeight: 500 }}>จำกัดการใช้</label><input type="number" value={usageLimit} onChange={e => setUsageLimit(parseInt(e.target.value) || 1)} className={inputCls} style={{ fontSize: "13.5px" }} /></div>
          <div><label className="block text-neutral-500 mb-1.5" style={{ fontSize: "12.5px", fontWeight: 500 }}>วันที่เริ่ม</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputCls} style={{ fontSize: "13.5px" }} /></div>
          <div className="col-span-2"><label className="block text-neutral-500 mb-1.5" style={{ fontSize: "12.5px", fontWeight: 500 }}>วันหมดอายุ</label><input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} className={inputCls} style={{ fontSize: "13.5px" }} /></div>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={() => navigate("coupons")} className="flex-1 py-2.5 border border-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-50" style={{ fontSize: "14px" }}>ยกเลิก</button>
          <button onClick={() => { feedback.success(isEdit ? "ບັນທຶກຄູປອງສຳເລັດ" : "ສ້າງຄູປອງສຳເລັດ", code); navigate("coupons"); }} disabled={!code || codeError} className="flex-1 py-2.5 bg-neutral-950 text-white rounded-lg hover:bg-neutral-800 disabled:opacity-50" style={{ fontSize: "14px", fontWeight: 500 }}>
            {isEdit ? "บันทึก" : "สร้างคูปอง"}
          </button>
        </div>
      </div>
    </div>
  );
}
