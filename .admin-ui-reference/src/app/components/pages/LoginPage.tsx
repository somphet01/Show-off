import { useState } from "react";
import { useApp } from "../../context";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export function LoginPage() {
  const { login } = useApp();
  const [email, setEmail] = useState("mina@showoff.la");
  const [password, setPassword] = useState("showoff2026");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("กรุณากรอกอีเมลและรหัสผ่าน"); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); login(); }, 800);
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-neutral-950 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-neutral-200">
            <span className="text-white" style={{ fontWeight: 800, fontSize: "16px", letterSpacing: "-0.5px" }}>SO</span>
          </div>
          <h1 className="text-neutral-900" style={{ fontWeight: 700, fontSize: "22px" }}>SHOW OFF</h1>
          <p className="text-neutral-500 mt-1" style={{ fontSize: "13.5px" }}>ระบบจัดการหลังบ้าน</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-7">
          <h2 className="text-neutral-900 mb-5" style={{ fontWeight: 600, fontSize: "17px" }}>เข้าสู่ระบบ</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-neutral-500 mb-1.5" style={{ fontSize: "13px", fontWeight: 500 }}>อีเมล</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="admin@showoff.la"
                className="w-full px-4 py-3 border border-neutral-200 rounded-lg bg-neutral-50 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:border-transparent transition-all placeholder:text-neutral-400"
                style={{ fontSize: "14px" }}
              />
            </div>
            <div>
              <label className="block text-neutral-500 mb-1.5" style={{ fontSize: "13px", fontWeight: 500 }}>รหัสผ่าน</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-11 border border-neutral-200 rounded-lg bg-neutral-50 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:border-transparent transition-all"
                  style={{ fontSize: "14px" }}
                />
                <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
                <p className="text-red-600" style={{ fontSize: "13px" }}>{error}</p>
              </div>
            )}
            <button
              type="submit" disabled={loading}
              className="w-full bg-neutral-950 hover:bg-neutral-800 text-white py-3 rounded-lg disabled:opacity-60 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-neutral-200"
              style={{ fontSize: "14px", fontWeight: 600 }}
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </button>
          </form>
          <p className="text-center text-neutral-400 mt-5" style={{ fontSize: "12px" }}>Demo: ใส่ email ใดก็ได้ แล้วกด เข้าสู่ระบบ</p>
        </div>
      </div>
    </div>
  );
}
