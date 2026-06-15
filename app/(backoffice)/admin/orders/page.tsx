import { formatLak, getAdminOrders } from "../../../lib/admin/data";

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

export default async function AdminOrdersPage() {
  const { orders } = await getAdminOrders();

  return (
    <main className="admin-page">
      <div className="admin-page-heading">
        <div>
          <span>Backoffice</span>
          <h1>Orders</h1>
        </div>
        <p>Review web and chat orders, approve slips, update tracking, and manage fulfillment.</p>
      </div>
      <section className="admin-panel">
        <div className="admin-panel-heading">
          <h2>Order queue</h2>
          <span>{orders.length} orders</span>
        </div>
        {orders.length > 0 ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Source</th>
                  <th>Payment</th>
                  <th>Shipment</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const customer = firstRelation(order.customers);
                  const payment = firstRelation(order.payments);
                  const shipment = firstRelation(order.shipments);

                  return (
                    <tr key={order.id}>
                      <td>{order.order_no}</td>
                      <td>
                        <strong>{customer?.name ?? "Walk-in"}</strong>
                        <span>{customer?.phone ?? "-"}</span>
                      </td>
                      <td>{order.source}</td>
                      <td>{payment?.status ?? order.status}</td>
                      <td>{shipment?.status ?? order.shipping_status}</td>
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
            <p>Create chat orders or connect checkout to start receiving orders here.</p>
          </div>
        )}
      </section>
    </main>
  );
}
