"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Locale } from "../lib/i18n";
import { createSupabaseBrowserClient } from "../lib/supabase/client";

const orderRefsStorageKey = "show-off-order-refs";
const alertsSeenStorageKey = "show-off-alerts-seen-v1";

type AccountOrder = {
  id: string;
  order_no: string;
  final_amount: number;
  total_amount: number;
  created_at: string;
  payment_status: string | null;
  shipping_status: string | null;
  fulfillment_status: string | null;
  shipment_documents?: Array<{ url?: string; path?: string; name?: string }> | null;
  order_items: Array<{
    id: string;
    product_name_snapshot: string;
    variant_label_snapshot: string | null;
    quantity: number;
    unit_price: number;
    line_total: number;
  }>;
};

type StoreAlert = {
  id: string;
  title: string;
  body: string;
  meta: string;
  tone: "progress" | "success";
  orderNo: string;
  createdAt: string;
  statusLabel?: string;
  notice?: string;
  phase: "waiting" | "complete" | "rejected";
  documents: Array<{ url: string; name?: string }>;
};

function readOrderIds() {
  try {
    const stored = window.localStorage.getItem(orderRefsStorageKey);
    const refs = stored ? (JSON.parse(stored) as Array<{ id?: unknown }>) : [];
    return refs.flatMap((item) => (typeof item.id === "string" ? [item.id] : []));
  } catch {
    return [];
  }
}

function readSeenAlerts() {
  try {
    const stored = window.localStorage.getItem(alertsSeenStorageKey);
    return stored ? (JSON.parse(stored) as string[]) : [];
  } catch {
    return [];
  }
}

function writeSeenAlerts(ids: string[]) {
  window.localStorage.setItem(alertsSeenStorageKey, JSON.stringify(Array.from(new Set(ids))));
}

function formatAlertDate(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "lo" ? "lo-LA" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function buildOrderAlerts(orders: AccountOrder[], locale: Locale): StoreAlert[] {
  const rank = (order: AccountOrder) => {
    if (order.shipping_status === "delivered") return 0;
    if (order.shipping_status === "shipping") return 1;
    return 2;
  };

  return [...orders]
    .sort((left, right) => {
      const priorityGap = rank(left) - rank(right);
      if (priorityGap !== 0) return priorityGap;
      return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
    })
    .map((order) => {
      const status = order.shipping_status ?? "not_shipped";
      const fulfillment = order.fulfillment_status ?? "not_ready";
      const payment = order.payment_status ?? "waiting_slip";
      const documents = (Array.isArray(order.shipment_documents) ? order.shipment_documents : [])
        .map((document) => ({ url: String(document?.url ?? "").trim(), name: String(document?.name ?? "").trim() }))
        .filter((document) => document.url);
      let title = "Payment approved";
      let body = `Admin confirmed ${order.order_no}. We will post shipping progress here next.`;
      let tone: StoreAlert["tone"] = "progress";
      let phase: StoreAlert["phase"] = "waiting";

      if (payment === "rejected") {
        title = "Payment rejected";
        body = `${order.order_no} was rejected. Please check your payment slip and upload a new one.`;
        phase = "rejected";
      } else if (status === "delivered") {
        title = "Delivered";
        body = `${order.order_no} was marked as delivered.`;
        tone = "success";
        phase = "complete";
      } else if (documents.length > 0) {
        title = "Delivery bill ready";
        body = `${order.order_no} has been dispatched. The store attached the delivery bill below.`;
        tone = "success";
        phase = "complete";
      } else if (status === "shipping") {
        title = "Preparing shipment";
        body = `${order.order_no} is approved and our staff are preparing it for dispatch.`;
      } else if (fulfillment === "ready_to_ship") {
        title = "Preparing shipment";
        body = `${order.order_no} is approved and being prepared for dispatch.`;
      }

      return {
        id: `${order.id}:${payment === "rejected" ? "rejected" : documents.length > 0 ? `bill-${documents.length}` : `${status}-${fulfillment}`}`,
        title,
        body,
        meta: `Order ${order.order_no} · ${formatAlertDate(order.created_at, locale)}`,
        tone,
        orderNo: order.order_no,
        createdAt: order.created_at,
        statusLabel: payment === "rejected" ? "Rejected" : documents.length > 0 ? "Dispatched" : fulfillment === "ready_to_ship" ? "Approved" : undefined,
        notice:
          payment === "rejected"
            ? "Please upload a new payment slip so our staff can review your order again."
            : documents.length === 0 && (fulfillment === "ready_to_ship" || status === "shipping")
              ? "Please wait, our staff are packing your order for dispatch."
              : undefined,
        phase,
        documents,
      };
    });
}

function AlertStatusIcon({ phase }: { phase: StoreAlert["phase"] }) {
  if (phase === "complete") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="m5 12.5 4.3 4.2L19 7" />
      </svg>
    );
  }

  if (phase === "waiting") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M7 3.5h10M7 20.5h10" />
        <path d="M8.5 3.5c0 4 1.3 5.6 3.5 7.2 2.2-1.6 3.5-3.2 3.5-7.2M8.5 20.5c0-4 1.3-5.6 3.5-7.2 2.2 1.6 3.5 3.2 3.5 7.2" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M7 9.5h10" />
      <path d="M7 14.5h6" />
      <path d="M5.5 4.5h13v15h-13z" />
    </svg>
  );
}

export function AlertsPageClient({ locale }: { locale: Locale }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<AccountOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [seenIds, setSeenIds] = useState<string[]>([]);
  const alerts = useMemo(() => buildOrderAlerts(orders, locale), [orders, locale]);
  const unreadCount = alerts.filter((alert) => !seenIds.includes(alert.id)).length;
  const selectedAlertId = searchParams.get("alert");
  const selectedAlert = alerts.find((alert) => alert.id === selectedAlertId) ?? alerts[0] ?? null;

  const markAlertAsSeen = (alertId: string) => {
    const nextIds = [...new Set([...readSeenAlerts(), alertId])];
    writeSeenAlerts(nextIds);
    setSeenIds(nextIds);
    window.dispatchEvent(new CustomEvent("showoff-alerts-seen-updated"));
    window.dispatchEvent(new StorageEvent("storage", { key: alertsSeenStorageKey }));
  };

  useEffect(() => {
    let active = true;

    const loadOrders = async () => {
      setLoading(true);
      setError("");

      const orderIds = readOrderIds();
      if (orderIds.length === 0) {
        if (active) {
          setOrders([]);
          setLoading(false);
        }
        return;
      }

      try {
        const supabase = createSupabaseBrowserClient();
        const { data, error: rpcError } = await supabase.rpc("get_storefront_order_history", { target_order_ids: orderIds });
        if (rpcError) throw rpcError;
        if (active) setOrders(Array.isArray(data) ? (data as AccountOrder[]) : []);
      } catch {
        if (active) {
          setOrders([]);
          setError("We could not load your notifications right now. Please try again.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    setSeenIds(readSeenAlerts());
    void loadOrders();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedAlertId || !selectedAlert?.id || seenIds.includes(selectedAlert.id)) return;
    markAlertAsSeen(selectedAlert.id);
  }, [selectedAlertId, selectedAlert?.id, seenIds]);

  return (
    <main className="alerts-page" aria-labelledby="alerts-page-title">
      <section className="alerts-hero">
        <a className="alerts-back-link" href={`/${locale}`}>
          ← Back to shop
        </a>
        <div className="alerts-hero-copy">
          <h1 id="alerts-page-title">Notifications</h1>
        </div>
      </section>

      <section className="alerts-inbox" aria-label="System notifications">
        <div className="alerts-inbox-head">
          <div>
            <h2>Order updates</h2>
            <p>{loading ? "Checking the latest updates..." : "Select a message to read the full update."}</p>
          </div>
          <span>{new Intl.DateTimeFormat(locale === "lo" ? "lo-LA" : "en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date())}</span>
        </div>

        {loading ? (
          <div className="alerts-skeleton" aria-live="polite">
            <span />
            <span />
            <span />
          </div>
        ) : error ? (
          <div className="alerts-state alerts-state-error">
            <strong>Could not load alerts</strong>
            <p>{error}</p>
          </div>
        ) : alerts.length > 0 && selectedAlert ? (
          <div className="alerts-message-shell">
            <div className="alerts-message-list" aria-label="Notification list">
              {alerts.map((alert) => {
                const isUnread = !seenIds.includes(alert.id);
                const isSelected = selectedAlert.id === alert.id;

                return (
                  <a
                    className={`alerts-message-card is-${alert.tone}${isUnread ? " is-unread" : ""}${isSelected ? " is-selected" : ""}`}
                    href={`/${locale}/alerts?alert=${encodeURIComponent(alert.id)}`}
                    key={alert.id}
                    onClick={(event) => {
                      event.preventDefault();
                      markAlertAsSeen(alert.id);
                      router.replace(`/${locale}/alerts?alert=${encodeURIComponent(alert.id)}`, { scroll: false });
                    }}
                  >
                    <div className="alerts-message-icon">
                      <AlertStatusIcon phase={alert.phase} />
                    </div>
                    <div className="alerts-message-copy">
                      <div>
                        <div className="alerts-message-title-row">
                          <strong>{alert.title}</strong>
                          {alert.statusLabel ? <span className={`alert-status-pill ${alert.statusLabel === "Rejected" ? "is-rejected" : "is-approved"}`}>{alert.statusLabel}</span> : null}
                        </div>
                        <time dateTime={alert.createdAt}>{alert.meta}</time>
                      </div>
                      <p>{alert.body}</p>
                    </div>
                  </a>
                );
              })}
            </div>

            <article className={`alerts-detail-card is-${selectedAlert.tone}`} aria-label="Notification detail">
              <div className="alerts-detail-top">
                <div className="alerts-detail-icon">
                  <AlertStatusIcon phase={selectedAlert.phase} />
                </div>
                <span>{selectedAlert.tone === "success" ? "Completed" : "System update"}</span>
              </div>
              <div className="alerts-detail-copy">
                <div className="alerts-detail-title-row">
                  <h2>{selectedAlert.title}</h2>
                  {selectedAlert.statusLabel ? <span className={`alert-status-pill ${selectedAlert.statusLabel === "Rejected" ? "is-rejected" : "is-approved"}`}>{selectedAlert.statusLabel}</span> : null}
                </div>
                <time dateTime={selectedAlert.createdAt}>{selectedAlert.meta}</time>
                <p>{selectedAlert.body}</p>
                {selectedAlert.notice ? <span className="alert-pack-note alerts-detail-note">{selectedAlert.notice}</span> : null}
                {selectedAlert.documents.length > 0 ? (
                  <div className="alerts-detail-images" aria-label="Delivery bill images">
                    {selectedAlert.documents.map((document, index) => (
                      <a href={document.url} key={`${document.url}-${index}`} target="_blank" rel="noreferrer">
                        <img src={document.url} alt={document.name || `Delivery bill ${index + 1}`} />
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="alerts-detail-foot">
                <span>Order number</span>
                <strong>{selectedAlert.orderNo}</strong>
              </div>
            </article>
          </div>
        ) : (
          <div className="alerts-state">
            <strong>No alerts yet</strong>
            <p>Your payment approvals, shipping progress, and delivery confirmations will appear here.</p>
          </div>
        )}
      </section>
    </main>
  );
}
