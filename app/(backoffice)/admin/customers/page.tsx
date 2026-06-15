export default function AdminCustomersPage() {
  return (
    <main className="admin-page">
      <div className="admin-page-heading">
        <div>
          <span>Backoffice</span>
          <h1>Customers</h1>
        </div>
        <p>Manage customer details, contact channels, purchase history, and VIP status.</p>
      </div>
      <section className="admin-panel">
        <div className="admin-empty-state">
          <strong>Customer profiles come after orders</strong>
          <p>The schema supports web accounts and manual customers from chat orders.</p>
        </div>
      </section>
    </main>
  );
}
