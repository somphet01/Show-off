"use client";

import { useMemo, useState } from "react";
import { approvePaymentSlip, rejectPaymentSlip, updateOrderShipping } from "./actions";

type Relation<T> = T | T[] | null | undefined;

type AdminOrder = {
  id: string;
  order_no: string;
  source: string;
  status: string;
  shipping_status: string;
  payment_status?: string | null;
  fulfillment_status?: string | null;
  shipping_address?: string | null;
  final_amount: number;
  total_amount: number;
  created_at: string;
  customers?: Relation<{ name?: string | null; phone?: string | null; email?: string | null }>;
  payments?: Relation<{ id?: string; status?: string | null; amount?: number | null; payment_method?: string | null }>;
  shipments?: Relation<{ tracking_number?: string | null; carrier?: string | null; status?: string | null }>;
  order_items?: Array<{
    id: string;
    sku_snapshot: string;
    product_name_snapshot: string;
    variant_label_snapshot?: string | null;
    quantity: number;
    unit_price: number;
    line_total?: number | null;
  }>;
  payment_slips?: Array<{
    id: string;
    bucket: string;
    path: string;
    amount?: number | null;
    status: string;
    created_at: string;
    reject_reason?: string | null;
    signedUrl?: string | null;
  }>;
};

type ReviewState = "pending" | "approved" | "rejected";
type ReviewFilter = "all" | ReviewState;
type ShippingStatus = "not_shipped" | "shipping" | "delivered";

function firstRelation<T>(value: Relation<T>): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("lo-LA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatLak(value: number) {
  return `฿${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value)}`;
}

function getOrderTotal(order: AdminOrder) {
  const payment = firstRelation(order.payments);
  return order.final_amount || order.total_amount || payment?.amount || 0;
}

export function AdminOrdersMock({ orders }: { orders: AdminOrder[] }) {
  const [selectedOrderId, setSelectedOrderId] = useState(orders[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>("all");
  const stats = useMemo(() => {
    const pending = orders.filter((order) => getOrderReviewState(order) === "pending").length;
    const approved = orders.filter((order) => getOrderReviewState(order) === "approved").length;
    const rejected = orders.filter((order) => getOrderReviewState(order) === "rejected").length;
    const waitingShipping = orders.filter((order) => getOrderReviewState(order) === "approved" && (order.shipping_status ?? "not_shipped") !== "delivered").length;

    return { pending, approved, rejected, waitingShipping };
  }, [orders]);
  const filteredOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return orders.filter((order) => {
      const customer = firstRelation(order.customers);
      const reviewState = getOrderReviewState(order);
      const haystack = [
        order.order_no,
        customer?.name,
        customer?.phone,
        customer?.email,
        order.source,
        order.shipping_address,
        ...(order.order_items ?? []).flatMap((item) => [item.product_name_snapshot, item.sku_snapshot, item.variant_label_snapshot]),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (reviewFilter === "all" || reviewState === reviewFilter) && (!normalizedQuery || haystack.includes(normalizedQuery));
    });
  }, [orders, query, reviewFilter]);
  const selectedOrder = useMemo(() => filteredOrders.find((order) => order.id === selectedOrderId) ?? filteredOrders[0] ?? null, [filteredOrders, selectedOrderId]);

  if (orders.length === 0) {
    return (
      <div className="admin-empty-state">
        <strong>ຍັງບໍ່ມີອໍເດີ</strong>
        <p>ເມື່ອລູກຄ້າສັ່ງຊື້ ຫຼືອັບໂຫຼດສະລິບ ຂໍ້ມູນຈະມາສະແດງຢູ່ນີ້.</p>
      </div>
    );
  }

  return (
    <div className="admin-order-workspace">
      <div className="admin-order-toolbar">
        <div className="admin-order-search">
          <span aria-hidden="true" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ຄົ້ນຫາເລກອໍເດີ, ລູກຄ້າ, ເບີໂທ, ສິນຄ້າ" />
        </div>
        <div className="admin-order-filter" aria-label="ກອງສະຖານະສະລິບ">
          {[
            ["all", "ທັງໝົດ", orders.length],
            ["pending", "ລໍຖ້າກວດ", stats.pending],
            ["approved", "ອະນຸມັດ", stats.approved],
            ["rejected", "ປະຕິເສດ", stats.rejected],
          ].map(([value, label, count]) => (
            <button className={reviewFilter === value ? "is-active" : ""} key={value} type="button" onClick={() => setReviewFilter(value as ReviewFilter)}>
              {label}
              <strong>{count}</strong>
            </button>
          ))}
        </div>
        <div className="admin-order-kpis">
          <div>
            <span>ລໍຖ້າສົ່ງ</span>
            <strong>{stats.waitingShipping}</strong>
          </div>
          <div>
            <span>ສະແດງ</span>
            <strong>{filteredOrders.length}</strong>
          </div>
        </div>
      </div>

      <div className="admin-order-console">
        <div className="admin-order-list" aria-label="ຄິວອໍເດີ">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => {
              const customer = firstRelation(order.customers);
              const reviewState = getOrderReviewState(order);
              const isSelected = selectedOrder?.id === order.id;

              return (
                <button className={`admin-order-card${isSelected ? " is-selected" : ""}`} type="button" key={order.id} onClick={() => setSelectedOrderId(order.id)}>
                  <div>
                    <span>{order.order_no}</span>
                    <em className={`admin-review-pill is-${reviewState}`}>{reviewLabel(reviewState)}</em>
                  </div>
                  <strong>{customer?.name ?? "ລູກຄ້າໜ້າຮ້ານ"}</strong>
                  <small>{formatLak(getOrderTotal(order))}</small>
                </button>
              );
            })
          ) : (
            <div className="admin-order-no-results">
              <strong>ບໍ່ພົບອໍເດີ</strong>
              <p>ລອງປ່ຽນຄຳຄົ້ນຫາ ຫຼືສະຖານະການກວດ.</p>
            </div>
          )}
        </div>

        {selectedOrder ? <OrderReviewPanel order={selectedOrder} /> : null}
      </div>
    </div>
  );
}

function reviewLabel(status: ReviewState) {
  if (status === "approved") {
    return "ອະນຸມັດ";
  }

  if (status === "rejected") {
    return "ປະຕິເສດ";
  }

  return "ລໍຖ້າ";
}

function statusLabel(status: string | null | undefined) {
  const labels: Record<string, string> = {
    paid: "ຈ່າຍແລ້ວ",
    pending: "ລໍຖ້າ",
    approved: "ອະນຸມັດ",
    rejected: "ປະຕິເສດ",
    verified: "ຢືນຢັນແລ້ວ",
    not_shipped: "ພ້ອມສົ່ງ",
    shipping: "ກຳລັງສົ່ງ",
    delivered: "ສົ່ງຮອດແລ້ວ",
    bank_transfer: "ໂອນຜ່ານທະນາຄານ",
  };

  return labels[status ?? ""] ?? status ?? "-";
}

function getOrderReviewState(order: AdminOrder): ReviewState {
  const slips = order.payment_slips ?? [];

  if (slips.some((slip) => slip.status === "approved")) {
    return "approved";
  }

  if (slips.length > 0 && slips.every((slip) => slip.status === "rejected")) {
    return "rejected";
  }

  return "pending";
}

function OrderReviewPanel({ order }: { order: AdminOrder }) {
  const customer = firstRelation(order.customers);
  const payment = firstRelation(order.payments);
  const shipment = firstRelation(order.shipments);
  const total = getOrderTotal(order);
  const slips = order.payment_slips ?? [];
  const pendingSlip = slips.find((slip) => slip.status === "pending") ?? null;
  const reviewState = getOrderReviewState(order);
  const canManageShipping = reviewState === "approved";
  const currentShippingStatus = (shipment?.status ?? order.shipping_status ?? "not_shipped") as ShippingStatus;
  const isPaid = reviewState === "approved";
  const isShipping = currentShippingStatus === "shipping" || currentShippingStatus === "delivered";
  const isDelivered = currentShippingStatus === "delivered";

  return (
    <article className="admin-order-review">
      <header className="admin-order-review-head">
        <div>
          <span>{formatDate(order.created_at)}</span>
          <h2>{order.order_no}</h2>
          <p>{customer?.name ?? "ລູກຄ້າໜ້າຮ້ານ"} / {customer?.phone ?? "ບໍ່ມີເບີໂທ"}</p>
        </div>
        <div className="admin-order-total">
          <span>ຍອດລວມ</span>
          <strong>{formatLak(total)}</strong>
        </div>
      </header>

      <section className="admin-order-steps" aria-label="ຂັ້ນຕອນອໍເດີ">
        <div className="is-done">
          <i />
          <strong>ຮັບອໍເດີ</strong>
          <span>{formatDate(order.created_at)}</span>
        </div>
        <div className={isPaid ? "is-done" : "is-current"}>
          <i />
          <strong>ກວດສະລິບ</strong>
          <span>{reviewLabel(reviewState)}</span>
        </div>
        <div className={isShipping ? "is-done" : isPaid ? "is-current" : ""}>
          <i />
          <strong>ຈັດສົ່ງ</strong>
          <span>{statusLabel(currentShippingStatus)}</span>
        </div>
        <div className={isDelivered ? "is-done" : ""}>
          <i />
          <strong>ສຳເລັດ</strong>
          <span>{isDelivered ? "ຮອດລູກຄ້າ" : "ລໍຖ້າ"}</span>
        </div>
      </section>

      {reviewState !== "pending" ? (
        <div className={`admin-mock-result is-${reviewState}`} role="status">
          <span>ບັນທຶກການກວດສະລິບ</span>
          <strong>{reviewState === "approved" ? "ສະລິບຖືກອະນຸມັດແລ້ວ" : "ສະລິບຖືກປະຕິເສດແລ້ວ"}</strong>
          <p>ລະບົບອັບເດດອໍເດີ, ການຈ່າຍເງິນ, ສະຕ໊ອກ ແລະການຈັດສົ່ງຕາມຜົນການກວດນີ້.</p>
        </div>
      ) : null}

      <section className="admin-review-grid">
        <div className="admin-review-block">
          <i className="admin-review-block-icon is-payment" aria-hidden="true" />
          <span>ການຈ່າຍເງິນ</span>
          <strong>{statusLabel(payment?.status ?? order.payment_status ?? order.status)}</strong>
          <p>{statusLabel(payment?.payment_method ?? "bank_transfer")} / {slips.length} ສະລິບ</p>
        </div>
        <div className="admin-review-block">
          <i className="admin-review-block-icon is-shipping" aria-hidden="true" />
          <span>ການຈັດສົ່ງ</span>
          <strong>{statusLabel(shipment?.status ?? order.shipping_status)}</strong>
          <p>{shipment?.tracking_number ? `${shipment.carrier ?? "ຂົນສົ່ງ"} / ${shipment.tracking_number}` : canManageShipping ? "ພ້ອມເພີ່ມການສົ່ງ" : "ລໍຖ້າກວດສະລິບ"}</p>
        </div>
        <div className="admin-review-block">
          <i className="admin-review-block-icon is-customer" aria-hidden="true" />
          <span>ທີ່ຢູ່ຈັດສົ່ງ</span>
          <strong>{customer?.phone ?? "-"}</strong>
          <p>{order.shipping_address ?? "ບໍ່ມີທີ່ຢູ່ຈັດສົ່ງ"}</p>
        </div>
      </section>

      <section className="admin-review-section">
        <div className="admin-panel-heading is-compact">
          <h2>ລາຍການສິນຄ້າ</h2>
          <span>{order.order_items?.length ?? 0} ລາຍການ</span>
        </div>
        <div className="admin-order-lines">
          {(order.order_items ?? []).map((item) => (
            <div key={item.id}>
              <div>
                <strong>{item.product_name_snapshot}</strong>
                <span>{item.sku_snapshot} / {item.variant_label_snapshot ?? "ຄ່າເລີ່ມຕົ້ນ"}</span>
              </div>
              <p>ຈຳນວນ {item.quantity}</p>
              <b>{formatLak(item.line_total || item.unit_price * item.quantity)}</b>
            </div>
          ))}
        </div>
      </section>

      <section className="admin-review-section">
        <div className="admin-panel-heading is-compact">
          <h2>ສະລິບໂອນເງິນ</h2>
          <span>{pendingSlip ? "ລໍຖ້າກວດ" : `${slips.length} ຮູບ`}</span>
        </div>
        {slips.length > 0 ? (
          <div className="admin-slip-grid">
            {slips.map((slip, index) => (
              <a href={slip.signedUrl ?? "#"} target="_blank" rel="noreferrer" key={slip.id}>
                {slip.signedUrl ? <img src={slip.signedUrl} alt={`ສະລິບ ${index + 1}`} /> : <div>ບໍ່ມີຮູບ</div>}
                <span>{statusLabel(slip.status)}</span>
              </a>
            ))}
          </div>
        ) : (
          <p className="admin-muted-note">ຍັງບໍ່ມີຮູບສະລິບ.</p>
        )}
        {pendingSlip ? (
          <div className="admin-slip-actions">
            <form action={rejectPaymentSlip}>
              <input type="hidden" name="orderId" value={order.id} />
              <input type="hidden" name="slipId" value={pendingSlip.id} />
              <input type="hidden" name="reason" value="Rejected from admin review" />
              <button className="admin-reject-button" type="submit">
                ປະຕິເສດສະລິບ
              </button>
            </form>
            <form action={approvePaymentSlip}>
              <input type="hidden" name="orderId" value={order.id} />
              <input type="hidden" name="slipId" value={pendingSlip.id} />
              <button className="admin-approve-button" type="submit">
                ອະນຸມັດສະລິບ
              </button>
            </form>
          </div>
        ) : null}
      </section>

      <section className="admin-review-section">
        <div className="admin-panel-heading is-compact">
          <h2>ການສົ່ງຂອງ</h2>
          <span>{canManageShipping ? "ອັບເດດໄດ້ທັນທີ" : "ອະນຸມັດສະລິບກ່ອນ"}</span>
        </div>
        <form className="admin-shipping-form" action={updateOrderShipping}>
          <input type="hidden" name="orderId" value={order.id} />
          <label>
            <span>ຂົນສົ່ງ</span>
            <input name="carrier" defaultValue={shipment?.carrier ?? ""} placeholder="ຊື່ຂົນສົ່ງ ຫຼືຄົນສົ່ງ" disabled={!canManageShipping} />
          </label>
          <label>
            <span>ເລກຕິດຕາມ</span>
            <input name="trackingNumber" defaultValue={shipment?.tracking_number ?? ""} placeholder="ເລກຕິດຕາມ ຫຼືເລກບິນ" disabled={!canManageShipping} />
          </label>
          <label>
            <span>ສະຖານະ</span>
            <select name="status" defaultValue={currentShippingStatus} disabled={!canManageShipping}>
              <option value="not_shipped">ພ້ອມສົ່ງ</option>
              <option value="shipping">ກຳລັງສົ່ງ</option>
              <option value="delivered">ສົ່ງຮອດແລ້ວ</option>
            </select>
          </label>
          <button type="submit" disabled={!canManageShipping}>
            ບັນທຶກການສົ່ງ
          </button>
        </form>
      </section>

      <footer className="admin-review-actions">
        <div>
          <span>ສະຖານະກວດສອບ</span>
          <strong>{reviewLabel(reviewState)}</strong>
        </div>
        <p className="admin-muted-note">{pendingSlip ? "ກວດສະລິບຢູ່ດ້ານເທິງ" : "ບໍ່ມີສະລິບທີ່ລໍຖ້າກວດ."}</p>
      </footer>
    </article>
  );
}
