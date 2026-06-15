export default function AdminFinancialsPage() {
  return (
    <main className="admin-page">
      <div className="admin-page-heading">
        <div>
          <span>Backoffice</span>
          <h1>Financials</h1>
        </div>
        <p>Review revenue, expenses, cost, and profit/loss by date range.</p>
      </div>
      <section className="admin-panel">
        <div className="admin-empty-state">
          <strong>Financial reports come after orders</strong>
          <p>Paid orders and expenses will feed this module automatically.</p>
        </div>
      </section>
    </main>
  );
}
