import { formatLak, getDashboardData } from "../../lib/admin/data";

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

export default async function AdminDashboardPage() {
  const dashboard = await getDashboardData();
  const summaryCards = [
    { label: "Revenue today", value: formatLak(dashboard.summary.revenueToday), note: "Approved paid orders" },
    { label: "Expenses today", value: formatLak(dashboard.summary.expensesToday), note: "Manual expenses and received POs" },
    { label: "Profit today", value: formatLak(dashboard.summary.profitToday), note: "Revenue minus expenses" },
    { label: "New orders", value: String(dashboard.summary.newOrdersToday), note: "Web and chat orders" },
  ];

  const alerts = [
    { label: "Low stock variants", value: String(dashboard.alerts.lowStockCount) },
    { label: "Slips pending review", value: String(dashboard.alerts.pendingSlipCount) },
    { label: "New customers today", value: String(dashboard.alerts.newCustomersToday) },
  ];

  return (
    <main className="admin-page">
      <div className="admin-page-heading">
        <div>
          <span>Dashboard</span>
          <h1>Store overview</h1>
        </div>
        <p>Real data will appear after the Supabase schema is applied and the first products/orders are created.</p>
      </div>

      <section className="admin-summary-grid">
        {summaryCards.map((card) => (
          <article className="admin-summary-card" key={card.label}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <p>{card.note}</p>
          </article>
        ))}
      </section>

      <section className="admin-dashboard-grid">
        <article className="admin-panel">
          <div className="admin-panel-heading">
            <h2>Alerts</h2>
            <span>Needs attention</span>
          </div>
          <div className="admin-alert-list">
            {alerts.map((alert) => (
              <div key={alert.label}>
                <span>{alert.label}</span>
                <strong>{alert.value}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="admin-panel">
          <div className="admin-panel-heading">
            <h2>Latest orders</h2>
            <span>Last 5</span>
          </div>
          {dashboard.latestOrders.length > 0 ? (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Source</th>
                    <th>Status</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.latestOrders.map((order) => {
                    const customer = firstRelation(order.customers);

                    return (
                      <tr key={order.order_no}>
                        <td>{order.order_no}</td>
                        <td>{customer?.name ?? "Walk-in"}</td>
                        <td>{order.source}</td>
                        <td>{order.status} / {order.shipping_status}</td>
                        <td>{formatLak(order.final_amount || order.total_amount || 0)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="admin-empty-state">
              <strong>No orders yet</strong>
              <p>Orders from web checkout and chat will appear here.</p>
            </div>
          )}
        </article>
      </section>
    </main>
  );
}
