import { AdminLoginForm } from "../../../admin/AdminLoginForm";

export default function AdminLoginPage() {
  return (
    <main className="admin-login-page">
      <section className="admin-login-panel">
        <span className="admin-kicker">SHOW OFF ຫຼັງບ້ານ</span>
        <h1>ເຂົ້າລະບົບແອດມິນ</h1>
        <p>ເຂົ້າລະບົບເພື່ອຈັດການສິນຄ້າ, ອໍເດີ, ສະລິບ, ສະຕ໊ອກ, ລູກຄ້າ ແລະການເງິນຂອງຮ້ານ.</p>
        <AdminLoginForm />
      </section>
    </main>
  );
}
