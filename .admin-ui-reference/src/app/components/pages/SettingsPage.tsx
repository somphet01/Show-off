import { useState } from "react";
import { adminUsers } from "../../mockData";
import { CheckCircle, AlertTriangle, Store, CreditCard, RefreshCw, Tag, Package, Users } from "lucide-react";
import { useAdminFeedback } from "../ui/AdminFeedback";

const inputCls = "w-full border border-neutral-200 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:border-transparent bg-neutral-50 text-neutral-900";

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-neutral-100 p-6">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-900 shrink-0">{icon}</div>
        <h3 className="text-neutral-900" style={{ fontWeight: 600, fontSize: "15px" }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

export function SettingsPage() {
  const feedback = useAdminFeedback();
  const [storeName, setStoreName] = useState("SHOW OFF");
  const [contactEmail, setContactEmail] = useState("hello@showoff.la");
  const [phone, setPhone] = useState("020 1234 5678");
  const [bankName, setBankName] = useState("BCEL Bank");
  const [accountName, setAccountName] = useState("SHOW OFF CO LTD");
  const [accountNumber, setAccountNumber] = useState("010-1234567-8");
  const [thbToLak, setThbToLak] = useState("196");
  const [defaultCurrency, setDefaultCurrency] = useState("LAK");
  const [roundingRule, setRoundingRule] = useState("nearest_1000");
  const [defaultMinStock, setDefaultMinStock] = useState("5");
  const [showRateConfirm, setShowRateConfirm] = useState(false);
  const [savedSection, setSavedSection] = useState<string | null>(null);

  const save = (s: string) => {
    setSavedSection(s);
    feedback.success("ບັນທຶກສຳເລັດ");
    setTimeout(() => setSavedSection(null), 2500);
  };

  const SaveRow = ({ section }: { section: string }) => (
    <div className="flex items-center justify-between mt-5 pt-4 border-t border-neutral-100">
      {savedSection === section ? <span className="flex items-center gap-1.5 text-green-600" style={{ fontSize: "13.5px" }}><CheckCircle size={14} /> บันทึกแล้ว</span> : <div />}
      <button onClick={() => save(section)} className="px-5 py-2 bg-neutral-950 text-white rounded-lg hover:bg-neutral-800 transition-colors" style={{ fontSize: "13.5px", fontWeight: 500 }}>บันทึก</button>
    </div>
  );

  return (
    <div className="p-5 space-y-4 max-w-[900px] mx-auto">
      {showRateConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <h3 className="text-neutral-900" style={{ fontWeight: 600, fontSize: "17px" }}>เปลี่ยนอัตราแลกเปลี่ยน</h3>
            <p className="text-neutral-600" style={{ fontSize: "14px" }}>ปรับ 1 THB = <strong>{thbToLak} LAK</strong></p>
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <AlertTriangle size={14} className="text-amber-500 mt-0.5 shrink-0" />
              <p className="text-amber-700" style={{ fontSize: "13px" }}>จะมีผลกับออเดอร์ที่สร้างใหม่เท่านั้น</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowRateConfirm(false)} className="flex-1 py-2.5 border border-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-50" style={{ fontSize: "14px" }}>ยกเลิก</button>
              <button onClick={() => { setShowRateConfirm(false); save("exchange"); }} className="flex-1 py-2.5 bg-neutral-950 text-white rounded-lg hover:bg-neutral-800" style={{ fontSize: "14px", fontWeight: 500 }}>ยืนยัน</button>
            </div>
          </div>
        </div>
      )}

      <h1 className="text-neutral-900" style={{ fontWeight: 700, fontSize: "20px" }}>Settings</h1>

      <Section title="ข้อมูลร้าน" icon={<Store size={15} />}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[["ชื่อร้าน", storeName, setStoreName], ["Email ติดต่อ", contactEmail, setContactEmail], ["เบอร์โทร", phone, setPhone]].map(([l, v, s]: any) => (
            <div key={l as string}><label className="block text-neutral-500 mb-1.5" style={{ fontSize: "12.5px", fontWeight: 500 }}>{l}</label><input value={v} onChange={e => s(e.target.value)} className={inputCls} style={{ fontSize: "13.5px" }} /></div>
          ))}
          <div><label className="block text-neutral-500 mb-1.5" style={{ fontSize: "12.5px", fontWeight: 500 }}>โซเชียล</label><input className={inputCls} style={{ fontSize: "13.5px" }} placeholder="@showoff.la" /></div>
        </div>
        <SaveRow section="store" />
      </Section>

      <Section title="การชำระเงิน / บัญชีธนาคาร" icon={<CreditCard size={15} />}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[["ชื่อธนาคาร", bankName, setBankName], ["ชื่อบัญชี", accountName, setAccountName], ["เลขบัญชี", accountNumber, setAccountNumber]].map(([l, v, s]: any) => (
            <div key={l as string}><label className="block text-neutral-500 mb-1.5" style={{ fontSize: "12.5px", fontWeight: 500 }}>{l}</label><input value={v} onChange={e => s(e.target.value)} className={`${inputCls} ${l === "เลขบัญชี" ? "font-mono" : ""}`} style={{ fontSize: "13.5px" }} /></div>
          ))}
          {["QR LAK", "QR THB"].map(q => (
            <div key={q}><label className="block text-neutral-500 mb-1.5" style={{ fontSize: "12.5px", fontWeight: 500 }}>{q}</label>
              <div className="border-2 border-dashed border-neutral-200 rounded-lg p-4 text-center text-neutral-400 cursor-pointer hover:border-neutral-400 hover:text-neutral-900 transition-colors" style={{ fontSize: "13px" }}>อัปโหลด {q}</div>
            </div>
          ))}
        </div>
        <SaveRow section="payment" />
      </Section>

      <Section title="อัตราแลกเปลี่ยน" icon={<RefreshCw size={15} />}>
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-neutral-500 mb-1.5" style={{ fontSize: "12.5px", fontWeight: 500 }}>1 THB = ? LAK</label>
            <input type="number" value={thbToLak} onChange={e => setThbToLak(e.target.value)} className={inputCls} style={{ fontSize: "22px", fontWeight: 700 }} />
          </div>
          <button onClick={() => setShowRateConfirm(true)} className="px-5 py-2.5 bg-neutral-950 text-white rounded-lg hover:bg-neutral-800 transition-colors whitespace-nowrap shadow-sm shadow-neutral-200" style={{ fontSize: "13.5px", fontWeight: 500 }}>อัปเดต</button>
        </div>
        <p className="text-neutral-400 mt-3" style={{ fontSize: "12.5px" }}>อัปเดตล่าสุด: 26 มิ.ย. 2026 09:00 · โดย Mina Soukda</p>
        {savedSection === "exchange" && <span className="flex items-center gap-1.5 text-green-600 mt-2" style={{ fontSize: "13.5px" }}><CheckCircle size={14} /> อัปเดตแล้ว</span>}
      </Section>

      <Section title="การตั้งราคา" icon={<Tag size={15} />}>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-neutral-500 mb-1.5" style={{ fontSize: "12.5px", fontWeight: 500 }}>สกุลเงินหลัก</label>
            <select value={defaultCurrency} onChange={e => setDefaultCurrency(e.target.value)} className={inputCls} style={{ fontSize: "13.5px" }}>
              <option value="LAK">LAK (กีบ)</option><option value="THB">THB (บาท)</option>
            </select>
          </div>
          <div><label className="block text-neutral-500 mb-1.5" style={{ fontSize: "12.5px", fontWeight: 500 }}>กฎการปัดเศษ</label>
            <select value={roundingRule} onChange={e => setRoundingRule(e.target.value)} className={inputCls} style={{ fontSize: "13.5px" }}>
              <option value="nearest_1000">ปัดใกล้ 1,000 LAK</option>
              <option value="nearest_500">ปัดใกล้ 500 LAK</option>
              <option value="none">ไม่ปัด</option>
            </select>
          </div>
        </div>
        <SaveRow section="pricing" />
      </Section>

      <Section title="ตั้งค่าสต็อก" icon={<Package size={15} />}>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-neutral-500 mb-1.5" style={{ fontSize: "12.5px", fontWeight: 500 }}>สต็อกขั้นต่ำเริ่มต้น</label>
            <input type="number" value={defaultMinStock} onChange={e => setDefaultMinStock(e.target.value)} className={inputCls} style={{ fontSize: "13.5px" }} />
          </div>
          <div><label className="block text-neutral-500 mb-1.5" style={{ fontSize: "12.5px", fontWeight: 500 }}>เตือนเมื่อสต็อกต่ำกว่า</label>
            <input type="number" defaultValue="3" className={inputCls} style={{ fontSize: "13.5px" }} />
          </div>
        </div>
        <SaveRow section="stock" />
      </Section>

      <Section title="ผู้ดูแลระบบ" icon={<Users size={15} />}>
        <div className="space-y-2.5">
          {adminUsers.map(u => (
            <div key={u.id} className="flex items-center justify-between p-3.5 bg-neutral-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-neutral-950 flex items-center justify-center">
                  <span className="text-white" style={{ fontSize: "11px", fontWeight: 700 }}>{u.name.split(" ").map(n => n[0]).join("").slice(0, 2)}</span>
                </div>
                <div>
                  <p className="text-neutral-900" style={{ fontWeight: 500, fontSize: "13.5px" }}>{u.name}</p>
                  <p className="text-neutral-400" style={{ fontSize: "12px" }}>{u.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs ${u.role === "owner" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>{u.role}</span>
                <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">{u.status}</span>
              </div>
            </div>
          ))}
        </div>
        <button className="mt-4 w-full py-2.5 border-2 border-dashed border-neutral-200 text-neutral-400 rounded-lg hover:border-neutral-400 hover:text-neutral-900 transition-colors" style={{ fontSize: "13.5px" }}>+ เชิญแอดมินใหม่</button>
      </Section>
    </div>
  );
}
