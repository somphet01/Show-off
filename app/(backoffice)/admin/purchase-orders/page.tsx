export default function AdminPurchaseOrdersPage() {
  return (
    <main className="admin-page">
      <div className="admin-page-heading">
        <div>
          <span>Backoffice</span>
          <h1>Purchase Orders</h1>
        </div>
        <p>Record supplier orders, receiving status, costs, and automatic stock increases.</p>
      </div>
      <section className="admin-panel">
        <div className="admin-empty-state">
          <strong>PO receiving is planned</strong>
          <p>Receiving a PO will increase stock and create movement records.</p>
        </div>
      </section>
    </main>
  );
}
