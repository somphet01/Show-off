export default function AdminInventoryPage() {
  return (
    <main className="admin-page">
      <div className="admin-page-heading">
        <div>
          <span>Backoffice</span>
          <h1>Inventory</h1>
        </div>
        <p>Track low stock, stock movement logs, and manual adjustments.</p>
      </div>
      <section className="admin-panel">
        <div className="admin-empty-state">
          <strong>Inventory movement log is planned</strong>
          <p>Every stock increase or decrease will be recorded with a reference.</p>
        </div>
      </section>
    </main>
  );
}
