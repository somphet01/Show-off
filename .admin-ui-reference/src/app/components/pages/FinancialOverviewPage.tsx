import { useState } from "react";
import { mockOrders, mockExpenses } from "../../mockData";
import { Plus, TrendingDown, Edit, Trash2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useAdminFeedback } from "../ui/AdminFeedback";

const revenueData = [
  { month: "ม.ค.", revenue: 8200000, expenses: 4100000 }, { month: "ก.พ.", revenue: 9500000, expenses: 4800000 },
  { month: "มี.ค.", revenue: 7800000, expenses: 3900000 }, { month: "เม.ย.", revenue: 11200000, expenses: 5600000 },
  { month: "พ.ค.", revenue: 13000000, expenses: 6500000 }, { month: "มิ.ย.", revenue: 9800000, expenses: 6700000 },
];
const expenseCategoryLabel: Record<string, string> = {
  product_cost: "ต้นทุนสินค้า", shipping: "ค่าส่ง", ads: "โฆษณา",
  packaging: "บรรจุภัณฑ์", rent: "ค่าเช่า", salary: "เงินเดือน", other: "อื่นๆ",
};

export function FinancialOverviewPage() {
  const feedback = useAdminFeedback();
  const [showAdd, setShowAdd] = useState(false);
  const [deletedExpenses, setDeletedExpenses] = useState<string[]>([]);
  const [category, setCategory] = useState("other");
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");

  const paidOrders = mockOrders.filter(o => o.paymentStatus === "paid");
  const totalRevenue = paidOrders.reduce((s, o) => s + o.totalAmount, 0);
  const visibleExpenses = mockExpenses.filter(e => !deletedExpenses.includes(e.id));
  const totalExpenses = visibleExpenses.reduce((s, e) => s + e.amount, 0);
  const totalProfit = totalRevenue - totalExpenses;

  const inputCls = "w-full border border-neutral-200 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-neutral-400 bg-neutral-50 text-neutral-900";
  const deleteExpense = async (id: string) => {
    const expense = mockExpenses.find(e => e.id === id);
    const ok = await feedback.confirm({
      title: "ລຶບລາຍຈ່າຍນີ້?",
      description: "ລາຍຈ່າຍນີ້ຈະຖືກຖອນອອກຈາກລາຍການ.",
      itemName: expense?.description || expense?.refNo,
      confirmLabel: "ລຶບ",
    });
    if (!ok) return;
    setDeletedExpenses(items => [...items, id]);
    feedback.success("ລຶບລາຍຈ່າຍສຳເລັດ", expense?.description);
  };

  return (
    <div className="p-5 space-y-4 max-w-[1200px] mx-auto">
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <h3 className="text-neutral-900" style={{ fontWeight: 600, fontSize: "17px" }}>เพิ่มรายจ่าย</h3>
            <div className="space-y-3">
              <div><label className="block text-neutral-500 mb-1" style={{ fontSize: "12.5px" }}>หมวดหมู่</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className={inputCls} style={{ fontSize: "13.5px" }}>
                  {Object.entries(expenseCategoryLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div><label className="block text-neutral-500 mb-1" style={{ fontSize: "12.5px" }}>รายละเอียด</label>
                <input value={desc} onChange={e => setDesc(e.target.value)} className={inputCls} style={{ fontSize: "13.5px" }} placeholder="รายละเอียด" />
              </div>
              <div><label className="block text-neutral-500 mb-1" style={{ fontSize: "12.5px" }}>จำนวน (LAK)</label>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className={inputCls} style={{ fontSize: "13.5px" }} />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 border border-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-50" style={{ fontSize: "14px" }}>ยกเลิก</button>
              <button onClick={() => { setShowAdd(false); feedback.success("ບັນທຶກລາຍຈ່າຍສຳເລັດ", desc); }} className="flex-1 py-2.5 bg-neutral-950 text-white rounded-lg hover:bg-neutral-800" style={{ fontSize: "14px", fontWeight: 500 }}>บันทึก</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-neutral-900" style={{ fontWeight: 700, fontSize: "20px" }}>Financials</h1>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2.5 bg-neutral-950 text-white rounded-lg hover:bg-neutral-800 transition-colors" style={{ fontSize: "13px", fontWeight: 500 }}>
          <Plus size={14} /> เพิ่มรายจ่าย
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-2 bg-neutral-950 rounded-xl p-5 text-white">
          <p className="text-neutral-400" style={{ fontSize: "12.5px" }}>รายรับรวม (มิ.ย.)</p>
          <p className="text-white mt-1" style={{ fontWeight: 700, fontSize: "28px" }}>{Math.round(totalRevenue).toLocaleString("en-US")}</p>
          <p className="text-neutral-500 mt-1" style={{ fontSize: "12px" }}>{paidOrders.length} ออเดอร์</p>
        </div>
        <div className="bg-white rounded-xl border border-neutral-100 p-5">
          <p className="text-neutral-500" style={{ fontSize: "12.5px" }}>รายจ่ายรวม</p>
          <p className="text-red-600 mt-1" style={{ fontWeight: 700, fontSize: "22px" }}>{Math.round(totalExpenses).toLocaleString("en-US")}</p>
          <div className="flex items-center gap-1 mt-1"><TrendingDown size={12} className="text-red-400" /><span className="text-neutral-400" style={{ fontSize: "12px" }}>เดือนนี้</span></div>
        </div>
        <div className="bg-white rounded-xl border border-neutral-100 p-5">
          <p className="text-neutral-500" style={{ fontSize: "12.5px" }}>กำไรสุทธิ</p>
          <p className="text-green-600 mt-1" style={{ fontWeight: 700, fontSize: "22px" }}>{Math.round(totalProfit).toLocaleString("en-US")}</p>
          <p className="text-neutral-400 mt-1" style={{ fontSize: "12px" }}>Margin {((totalProfit / totalRevenue) * 100).toFixed(1)}%</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-neutral-100 p-5">
        <h3 className="text-neutral-900 mb-4" style={{ fontWeight: 600 }}>รายรับ vs รายจ่าย (6 เดือน)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={revenueData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#a3a3a3" }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={v => Number(v).toLocaleString("en-US")} tick={{ fontSize: 11, fill: "#a3a3a3" }} axisLine={false} tickLine={false} width={64} />
            <Tooltip formatter={(v: number) => [Math.round(v).toLocaleString("en-US"), ""]} contentStyle={{ fontSize: 12, borderRadius: 12, border: "1px solid #e5e5e5" }} />
            <Bar dataKey="revenue" name="รายรับ" fill="#0a0a0a" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" name="รายจ่าย" fill="#0a0a0a" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl border border-neutral-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-50">
          <h3 className="text-neutral-900" style={{ fontWeight: 600 }}>รายจ่ายล่าสุด</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-100">
                {["วันที่", "Ref", "หมวดหมู่", "รายละเอียด", "จำนวน", ""].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-neutral-400" style={{ fontSize: "11.5px", fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {visibleExpenses.map(e => (
                <tr key={e.id} className="hover:bg-neutral-50/50 transition-colors">
                  <td className="px-5 py-3.5"><span className="text-neutral-700" style={{ fontSize: "13px" }}>{e.date}</span></td>
                  <td className="px-5 py-3.5"><span className="font-mono text-neutral-400" style={{ fontSize: "12px" }}>{e.refNo}</span></td>
                  <td className="px-5 py-3.5"><span className="px-2.5 py-1 bg-neutral-100 text-neutral-600 rounded-full text-xs">{expenseCategoryLabel[e.category]}</span></td>
                  <td className="px-5 py-3.5"><span className="text-neutral-700" style={{ fontSize: "13.5px" }}>{e.description}</span></td>
                  <td className="px-5 py-3.5"><span className="text-neutral-900" style={{ fontSize: "13.5px", fontWeight: 600 }}>{Math.round(e.amount).toLocaleString("en-US")}</span></td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-1">
                      <button className="p-1.5 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50 rounded-lg transition-colors"><Edit size={13} /></button>
                      <button onClick={() => void deleteExpense(e.id)} className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
