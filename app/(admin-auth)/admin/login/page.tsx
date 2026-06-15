import { AdminLoginForm } from "../../../admin/AdminLoginForm";

export default function AdminLoginPage() {
  return (
    <main className="admin-login-page">
      <section className="admin-login-panel">
        <span className="admin-kicker">Show Off Backoffice</span>
        <h1>Admin Login</h1>
        <p>Sign in to manage products, orders, slips, stock, customers, and shop financials.</p>
        <AdminLoginForm />
      </section>
    </main>
  );
}
