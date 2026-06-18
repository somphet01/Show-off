import Link from "next/link";
import { formatLak, getDashboardData } from "../../lib/admin/data";

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function statusLabel(status: string | null | undefined) {
  const labels: Record<string, string> = {
    paid: "ຈ່າຍແລ້ວ",
    pending: "ລໍຖ້າ",
    approved: "ອະນຸມັດ",
    rejected: "ປະຕິເສດ",
    not_shipped: "ຍັງບໍ່ສົ່ງ",
    shipping: "ກຳລັງສົ່ງ",
    delivered: "ສົ່ງຮອດແລ້ວ",
  };

  return labels[status ?? ""] ?? status ?? "-";
}

function metricTone(tone: string) {
  return `admin-v2-metric is-${tone}`;
}

export default async function AdminDashboardPage() {
  const dashboard = await getDashboardData();
  const latestOrders = dashboard.latestOrders.slice(0, 4);
  const pendingSlipCount = dashboard.alerts.pendingSlipCount;
  const lowStockCount = dashboard.alerts.lowStockCount;
  const newCustomerCount = dashboard.alerts.newCustomersToday;
  const completedOrders = dashboard.latestOrders.filter((order) => order.status === "approved" || order.status === "paid").length;

  const metrics = [
    {
      label: "ຍອດຂາຍມື້ນີ້",
      value: formatLak(dashboard.summary.revenueToday),
      note: "ຈາກອໍເດີທີ່ອະນຸມັດ",
      trend: "+2.5%",
      tone: "blue",
      icon: "▣",
    },
    {
      label: "ລາຍຈ່າຍມື້ນີ້",
      value: formatLak(dashboard.summary.expensesToday),
      note: "PO ແລະຄ່າໃຊ້ຈ່າຍ",
      trend: "-1.5%",
      tone: "rose",
      icon: "◉",
    },
    {
      label: "ກຳໄລສຸດທິ",
      value: formatLak(dashboard.summary.profitToday),
      note: "ຍອດຂາຍຫັກຕົ້ນທຶນ",
      trend: dashboard.summary.profitToday >= 0 ? "+ກຳໄລ" : "-ຂາດທຶນ",
      tone: "green",
      icon: "◈",
    },
    {
      label: "ອໍເດີໃໝ່",
      value: `${dashboard.summary.newOrdersToday} ອໍເດີ`,
      note: `${pendingSlipCount} ສະລິບລໍຖ້າ, ${lowStockCount} ສິນຄ້າໃກ້ໝົດ`,
      trend: "LIVE",
      tone: "indigo",
      icon: "▤",
    },
  ];

  const actionItems = [
    {
      title: "ສະລິບລໍຖ້າກວດ",
      description: `${pendingSlipCount} ລາຍການກຳລັງລໍຖ້າ`,
      tone: "rose",
      href: "/admin/orders",
      icon: "!",
    },
    {
      title: "ສະຕ໊ອກໃກ້ໝົດ",
      description: `${lowStockCount} SKU ຄວນກວດເບິ່ງ`,
      tone: "blue",
      href: "/admin/inventory",
      icon: "↻",
    },
    {
      title: "ລູກຄ້າໃໝ່",
      description: `${newCustomerCount} ຄົນຈາກມື້ນີ້`,
      tone: "green",
      href: "/admin/customers",
      icon: "+",
    },
  ];

  return (
    <main className="admin-dashboard-v2">
      <section className="admin-v2-heading">
        <div>
          <span>SHOW OFF ADMIN CONSOLE</span>
          <h1>ພາບລວມຮ້ານມື້ນີ້</h1>
          <p>ຕິດຕາມຍອດຂາຍ, ສະລິບ, ສະຕ໊ອກ ແລະວຽກດ່ວນຈາກໜ້າດຽວ.</p>
        </div>
        <div className="admin-v2-heading-actions">
          <Link href="/admin/orders">ກວດອໍເດີ</Link>
          <Link href="/admin/products">ເພີ່ມສິນຄ້າ</Link>
        </div>
      </section>

      <section className="admin-v2-metrics" aria-label="ສະຫຼຸບຕົວເລກຮ້ານ">
        {metrics.map((metric) => (
          <article className={metricTone(metric.tone)} key={metric.label}>
            <div className="admin-v2-metric-icon" aria-hidden="true">{metric.icon}</div>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <p>{metric.note}</p>
            <em>{metric.trend}</em>
          </article>
        ))}
      </section>

      <section className="admin-v2-grid">
        <article className="admin-v2-card admin-v2-revenue-card">
          <div className="admin-v2-card-head">
            <div>
              <h2>ລາຍງານຍອດຂາຍ 30 ມື້</h2>
              <p>ການເຄື່ອນໄຫວຈາກຊ່ອງທາງຂາຍທັງໝົດ</p>
            </div>
            <div className="admin-v2-pill-tabs" aria-label="ເລືອກຊ່ວງເວລາ">
              <button className="is-active" type="button">30 ມື້</button>
              <button type="button">7 ມື້</button>
            </div>
          </div>
          <div className="admin-v2-line-chart" aria-label="Revenue line chart">
            <svg viewBox="0 0 760 260" role="img">
              <defs>
                <linearGradient id="adminRevenueFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#2f74ff" stopOpacity="0.24" />
                  <stop offset="100%" stopColor="#2f74ff" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path className="admin-v2-chart-fill" d="M20 200 C90 150 120 128 185 158 C250 188 280 86 345 106 C410 126 455 78 520 68 C590 58 635 128 740 94 L740 238 L20 238 Z" />
              <path className="admin-v2-chart-line" d="M20 200 C90 150 120 128 185 158 C250 188 280 86 345 106 C410 126 455 78 520 68 C590 58 635 128 740 94" />
              <path className="admin-v2-chart-line is-cost" d="M20 218 C110 204 150 176 220 198 C290 220 350 156 420 176 C500 198 560 152 640 170 C690 182 712 166 740 154" />
              {[20, 140, 260, 380, 500, 620, 740].map((x) => (
                <line className="admin-v2-chart-grid" key={x} x1={x} x2={x} y1="24" y2="238" />
              ))}
            </svg>
            <div className="admin-v2-chart-months">
              <span>1 ມື້</span>
              <span>5 ມື້</span>
              <span>10 ມື້</span>
              <span>15 ມື້</span>
              <span>20 ມື້</span>
              <span>25 ມື້</span>
              <span>30 ມື້</span>
            </div>
          </div>
        </article>

        <article className="admin-v2-card admin-v2-channel-card">
          <div className="admin-v2-card-head">
            <div>
              <h2>ຊ່ອງທາງຂາຍ</h2>
              <p>ເວັບ ແລະ ແຊັດ</p>
            </div>
          </div>
          <div className="admin-v2-donut" aria-label="Sales by channel">
            <div />
          </div>
          <div className="admin-v2-channel-list">
            <span><i /> Website <b>64%</b></span>
            <span><i className="is-chat" /> Chat Commerce <b>36%</b></span>
          </div>
        </article>

        <article className="admin-v2-card admin-v2-orders-card">
          <div className="admin-v2-card-head">
            <div>
              <h2>ອໍເດີຫຼ້າສຸດ</h2>
              <p>ລາຍການທີ່ຕ້ອງຕິດຕາມ</p>
            </div>
            <Link href="/admin/orders">ເບິ່ງທັງໝົດ</Link>
          </div>
          {latestOrders.length > 0 ? (
            <div className="admin-v2-order-table">
              <div className="admin-v2-order-row is-head">
                <span>ອໍເດີ</span>
                <span>ລູກຄ້າ</span>
                <span>ຍອດລວມ</span>
                <span>ສະຖານະ</span>
              </div>
              {latestOrders.map((order) => {
                const customer = firstRelation(order.customers);

                return (
                  <Link className="admin-v2-order-row" href="/admin/orders" key={order.order_no}>
                    <span>
                      <b>{order.order_no}</b>
                      <small>{order.source}</small>
                    </span>
                    <span>{customer?.name ?? "ລູກຄ້າໜ້າຮ້ານ"}</span>
                    <span>{formatLak(order.final_amount || order.total_amount || 0)}</span>
                    <span><em>{statusLabel(order.status)}</em><small>{statusLabel(order.shipping_status)}</small></span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="admin-v2-empty">
              <strong>ຍັງບໍ່ມີອໍເດີ</strong>
              <p>ອໍເດີຈາກ checkout ແລະແຊັດຈະມາຢູ່ບ່ອນນີ້.</p>
            </div>
          )}
        </article>

        <aside className="admin-v2-card admin-v2-action-card">
          <div className="admin-v2-card-head">
            <div>
              <h2>ສູນແຈ້ງເຕືອນ</h2>
              <p>{completedOrders} ອໍເດີຈ່າຍແລ້ວຢູ່ໃນລາຍການຫຼ້າສຸດ</p>
            </div>
          </div>
          <div className="admin-v2-action-list">
            {actionItems.map((item) => (
              <Link className={`admin-v2-action is-${item.tone}`} href={item.href} key={item.title}>
                <i aria-hidden="true">{item.icon}</i>
                <span>
                  <b>{item.title}</b>
                  <small>{item.description}</small>
                </span>
              </Link>
            ))}
          </div>
          <Link className="admin-v2-action-button" href="/admin/orders">ກວດວຽກທັງໝົດ</Link>
        </aside>
      </section>
    </main>
  );
}
