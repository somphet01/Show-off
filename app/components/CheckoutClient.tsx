"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent } from "react";
import type { Locale } from "../lib/i18n";
import { createSupabaseBrowserClient } from "../lib/supabase/client";

const cartStorageKey = "show-off-cart";
const customerStorageKey = "show-off-customer";
const orderRefsStorageKey = "show-off-order-refs";

type CartItem = {
  slug: string;
  name: string;
  color: string;
  size: string;
  price: string;
  image: string;
  quantity: number;
};

type CustomerProfile = {
  name: string;
  email: string;
  phone: string;
  address: string;
};

type SlipPreview = {
  name: string;
  url: string;
  file: File;
  uploadedPath?: string;
};

type StorefrontOrder = {
  order_id: string;
  order_no: string;
  payment_id: string;
  total_amount: number;
  item_count: number;
};

type AttachedSlipsResult = {
  order_id: string;
  payment_id: string;
  slip_count: number;
};

type StoredOrderRef = {
  id: string;
  orderNo: string;
  createdAt: string;
};

function rememberOrder(order: StorefrontOrder) {
  try {
    const stored = window.localStorage.getItem(orderRefsStorageKey);
    const current = stored ? (JSON.parse(stored) as StoredOrderRef[]) : [];
    const next = [
      { id: order.order_id, orderNo: order.order_no, createdAt: new Date().toISOString() },
      ...current.filter((item) => item.id !== order.order_id),
    ].slice(0, 50);

    window.localStorage.setItem(orderRefsStorageKey, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("showoff-orders-updated", { detail: next }));
  } catch {
    // Checkout still succeeds when browser storage is unavailable.
  }
}

function getOrderErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === "object") {
    const maybeError = error as { code?: string; message?: string; details?: string; hint?: string };
    if (maybeError.code === "PGRST202" && maybeError.message?.includes("create_storefront_order")) {
      return "Database checkout function is not installed yet. Apply migration 0005_storefront_checkout_order_rpc.sql in Supabase, then try again.";
    }

    if (maybeError.code === "PGRST202" && maybeError.message?.includes("attach_storefront_payment_slips")) {
      return "Payment slip function is not installed yet. Apply migration 0006_storefront_payment_slip_uploads.sql in Supabase, then try again.";
    }

    const parts = [maybeError.message, maybeError.details, maybeError.hint].filter(Boolean);

    if (parts.length > 0) {
      return maybeError.code ? `${maybeError.code}: ${parts.join(" ")}` : parts.join(" ");
    }
  }

  return "Could not create order. Please try again.";
}

function getSlipErrorMessage(error: unknown) {
  const message = getOrderErrorMessage(error);

  if (message.includes("row-level security") || message.includes("violates row-level security policy")) {
    return "Payment slip upload is blocked by Storage policy. Apply migration 0006_storefront_payment_slip_uploads.sql, then try again.";
  }

  return message;
}

function readCartItems() {
  try {
    const stored = window.localStorage.getItem(cartStorageKey);
    return stored ? (JSON.parse(stored) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function readCustomerProfile() {
  try {
    const stored = window.localStorage.getItem(customerStorageKey);
    return stored ? (JSON.parse(stored) as CustomerProfile) : null;
  } catch {
    return null;
  }
}

function saveCartItems(items: CartItem[]) {
  if (items.length === 0) {
    window.localStorage.removeItem(cartStorageKey);
  } else {
    window.localStorage.setItem(cartStorageKey, JSON.stringify(items));
  }

  window.dispatchEvent(new CustomEvent("showoff-cart-updated", { detail: items }));
}

function priceToNumber(price: string) {
  return Number(price.replace(/[^\d]/g, "")) || 0;
}

function formatLak(value: number) {
  return `฿${Math.round(value).toLocaleString("en-US")}`;
}

function cleanFileName(name: string) {
  const extension = name.includes(".") ? name.split(".").pop() : "jpg";
  const baseName = name.replace(/\.[^/.]+$/, "");
  const safeBase = baseName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);

  return `${safeBase || "payment-slip"}.${extension || "jpg"}`;
}

function buildOrderCode(index: number, item: CartItem) {
  return `RPS-${item.slug.slice(0, 4).toUpperCase()}-${item.size}-${String(index + 1).padStart(2, "0")}`;
}

function buildOrderMessage(items: CartItem[], customer: CustomerProfile | null, orderNo?: string) {
  const total = items.reduce((sum, item) => sum + priceToNumber(item.price) * item.quantity, 0);
  const lines = items.map((item, index) => {
    return `${buildOrderCode(index, item)} | ${item.name} | ${item.color} | Size ${item.size} | Qty ${item.quantity} | ${formatLak(priceToNumber(item.price) * item.quantity)}`;
  });

  return [
    "New order request",
    `Order no: ${orderNo || "Pending"}`,
    ...lines,
    `Total: ${formatLak(total)}`,
    `Name: ${customer?.name || "-"}`,
    `Phone: ${customer?.phone || "-"}`,
    `Address: ${customer?.address || "-"}`,
  ].join("\n");
}

function QrMark() {
  const cells = Array.from({ length: 81 }, (_, index) => {
    const row = Math.floor(index / 9);
    const column = index % 9;
    const active = row < 2 || column < 2 || row > 6 || column > 6 || (row + column) % 3 === 0 || (row === 4 && column > 2 && column < 7);

    return <i className={active ? "is-active" : ""} key={index} />;
  });

  return <div className="checkout-qr-mark">{cells}</div>;
}

function DownloadIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path d="M12 4v10" />
      <path d="m8 10 4 4 4-4" />
      <path d="M5 19h14" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 3.5a8.3 8.3 0 0 0-7.1 12.6L4 20.5l4.5-1.2A8.3 8.3 0 1 0 12 3.5Zm0 1.8a6.5 6.5 0 0 1 5.5 10 6.5 6.5 0 0 1-8.7 2.3l-.3-.2-2.2.6.5-2.1-.2-.3A6.5 6.5 0 0 1 12 5.3Zm-2.8 3.4c-.2 0-.5.1-.7.4-.3.3-.8.9-.8 2.1s.8 2.4 1 2.6c.1.2 1.7 2.7 4.2 3.6 2 .8 2.4.5 2.8.5.4-.1 1.3-.6 1.5-1.1.2-.5.2-1 .1-1.1-.1-.1-.2-.2-.5-.4l-1.6-.8c-.2-.1-.4-.1-.6.2l-.7.9c-.1.2-.3.2-.6.1-.3-.2-1.1-.4-2-1.2-.8-.7-1.3-1.6-1.4-1.8-.2-.3 0-.4.1-.6l.4-.4c.1-.2.2-.3.3-.5.1-.1 0-.3 0-.5l-.7-1.5c-.2-.4-.4-.5-.8-.5Z" />
    </svg>
  );
}

function MessengerIcon() {
  return (
    <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 3.5c-5 0-8.8 3.5-8.8 8.2 0 2.6 1.2 4.9 3.2 6.4v2.4l2.4-1.3c1 .3 2 .6 3.2.6 5 0 8.8-3.5 8.8-8.2S17 3.5 12 3.5Zm.8 10.8-2.2-2.4-4.2 2.4L11 9.4l2.2 2.4 4.1-2.4-4.5 4.9Z" />
    </svg>
  );
}

export function CheckoutClient({ locale }: { locale: Locale }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [paymentMode, setPaymentMode] = useState<"pay" | "contact">("pay");
  const [slips, setSlips] = useState<SlipPreview[]>([]);
  const [slipError, setSlipError] = useState(false);
  const [orderResult, setOrderResult] = useState<StorefrontOrder | null>(null);
  const [orderError, setOrderError] = useState("");
  const [proofResult, setProofResult] = useState<AttachedSlipsResult | null>(null);
  const [proofError, setProofError] = useState("");
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const slipsRef = useRef<SlipPreview[]>([]);
  const total = useMemo(() => items.reduce((sum, item) => sum + priceToNumber(item.price) * item.quantity, 0), [items]);
  const orderMessage = useMemo(() => buildOrderMessage(items, customer, orderResult?.order_no), [items, customer, orderResult?.order_no]);
  const encodedMessage = encodeURIComponent(orderMessage);
  const canOrder = items.length > 0 && Boolean(customer);
  const canSendOrder = canOrder && slips.length > 0;

  useEffect(() => {
    setItems(readCartItems());
    setCustomer(readCustomerProfile());

    const onStorage = () => setItems(readCartItems());
    const onCartUpdated = () => setItems(readCartItems());
    const onAccountUpdated = () => setCustomer(readCustomerProfile());

    window.addEventListener("storage", onStorage);
    window.addEventListener("showoff-cart-updated", onCartUpdated);
    window.addEventListener("showoff-account-updated", onAccountUpdated);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("showoff-cart-updated", onCartUpdated);
      window.removeEventListener("showoff-account-updated", onAccountUpdated);
    };
  }, []);

  useEffect(() => {
    slipsRef.current = slips;
  }, [slips]);

  useEffect(() => {
    setOrderResult(null);
    setOrderError("");
    setProofResult(null);
    setProofError("");
  }, [items, customer]);

  useEffect(() => {
    return () => {
      slipsRef.current.forEach((slip) => URL.revokeObjectURL(slip.url));
    };
  }, []);

  const updateCartQuantity = (targetItem: CartItem, nextQuantity: number) => {
    const safeQuantity = Number.isFinite(nextQuantity) ? Math.max(0, Math.min(99, Math.floor(nextQuantity))) : targetItem.quantity;
    const nextItems =
      safeQuantity === 0
        ? items.filter((item) => !(item.slug === targetItem.slug && item.size === targetItem.size && item.color === targetItem.color))
        : items.map((item) => (item.slug === targetItem.slug && item.size === targetItem.size && item.color === targetItem.color ? { ...item, quantity: safeQuantity } : item));

    setItems(nextItems);
    saveCartItems(nextItems);
  };

  const openAccount = () => {
    window.dispatchEvent(new CustomEvent("showoff-account-open"));
  };

  const addSlips = (fileList: FileList | null) => {
    if (!fileList) {
      return;
    }

    const nextSlips = Array.from(fileList)
      .filter((file) => file.type.startsWith("image/"))
      .map((file) => ({ name: file.name, url: URL.createObjectURL(file), file }));

    setSlips((currentSlips) => [...currentSlips, ...nextSlips]);
    setSlipError(false);
    setProofError("");
    setProofResult(null);
  };

  const createOrder = async () => {
    if (!canOrder) {
      openAccount();
      return null;
    }

    if (orderResult) {
      return orderResult;
    }

    setIsCreatingOrder(true);
    setOrderError("");

    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.rpc("create_storefront_order", {
        order_payload: {
          customer,
          items: items.map((item) => ({
            slug: item.slug,
            name: item.name,
            color: item.color,
            size: item.size,
            quantity: item.quantity,
            unit_price: priceToNumber(item.price),
            image: item.image,
          })),
        },
      });

      if (error) {
        throw error;
      }

      const nextOrder = data as StorefrontOrder;
      setOrderResult(nextOrder);
      rememberOrder(nextOrder);
      return nextOrder;
    } catch (error) {
      setOrderError(getOrderErrorMessage(error));
      return null;
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const uploadPaymentProof = async (createdOrder: StorefrontOrder) => {
    setIsUploadingProof(true);
    setProofError("");

    try {
      const supabase = createSupabaseBrowserClient();
      const uploadedSlips = [];

      for (const [index, slip] of slips.entries()) {
        if (slip.uploadedPath) {
          uploadedSlips.push({
            path: slip.uploadedPath,
            name: slip.name,
            mime_type: slip.file.type,
            size: slip.file.size,
          });
          continue;
        }

        const path = `storefront/${createdOrder.order_no}/${Date.now()}-${index + 1}-${cleanFileName(slip.name)}`;
        const { error: uploadError } = await supabase.storage.from("payment-slips").upload(path, slip.file, {
          cacheControl: "3600",
          contentType: slip.file.type,
          upsert: false,
        });

        if (uploadError) {
          throw uploadError;
        }

        uploadedSlips.push({
          path,
          name: slip.name,
          mime_type: slip.file.type,
          size: slip.file.size,
        });

        setSlips((currentSlips) => currentSlips.map((currentSlip) => (currentSlip.url === slip.url ? { ...currentSlip, uploadedPath: path } : currentSlip)));
      }

      const { data, error } = await supabase.rpc("attach_storefront_payment_slips", {
        target_order_id: createdOrder.order_id,
        target_payment_id: createdOrder.payment_id,
        slip_payload: uploadedSlips,
      });

      if (error) {
        throw error;
      }

      const nextProofResult = data as AttachedSlipsResult;
      setProofResult(nextProofResult);
      return nextProofResult;
    } catch (error) {
      setProofError(getSlipErrorMessage(error));
      return null;
    } finally {
      setIsUploadingProof(false);
    }
  };

  const sendPaymentProof = async () => {
    if (!canOrder) {
      openAccount();
      return;
    }

    if (slips.length === 0) {
      setSlipError(true);
      return;
    }

    const createdOrder = await createOrder();

    if (!createdOrder) {
      return;
    }

    const attachedProof = await uploadPaymentProof(createdOrder);

    if (!attachedProof) {
      return;
    }

    window.dispatchEvent(new CustomEvent("showoff-checkout-ready", { detail: { items, customer, order: createdOrder, proof: attachedProof, slips: slips.map((slip) => slip.name), total: formatLak(total) } }));
  };

  const requireSlipBeforeContact = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!canSendOrder) {
      event.preventDefault();
      if (!canOrder) {
        openAccount();
      } else {
        setSlipError(true);
      }
    }
  };

  const saveQr = () => {
    if (!canOrder) {
      openAccount();
      return;
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="520" height="520" viewBox="0 0 520 520"><rect width="520" height="520" fill="white"/><text x="260" y="62" text-anchor="middle" font-family="Arial" font-size="24" font-weight="700">REPRESENT PAYMENT</text><rect x="92" y="92" width="336" height="336" fill="none" stroke="black" stroke-width="18"/><path d="M128 128h72v72h-72zM320 128h72v72h-72zM128 320h72v72h-72zM236 128h36v36h-36zM272 200h36v36h-36zM236 272h108v36H236zM308 344h36v36h-36z" fill="black"/><text x="260" y="470" text-anchor="middle" font-family="Arial" font-size="20">${formatLak(total)}</text></svg>`;
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "represent-payment-qr.svg";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="checkout-page">
      <section className="checkout-hero" aria-labelledby="checkout-title">
        <p>Checkout</p>
        <h1 id="checkout-title">Confirm your order</h1>
        <span>{items.length > 0 ? `${items.length} style${items.length === 1 ? "" : "s"} ready` : "Your cart is empty"}</span>
      </section>

      <section className="checkout-layout">
        <div className="checkout-order">
          <div className="checkout-section-title">
            <h2>Order pieces</h2>
            <strong>{formatLak(total)}</strong>
          </div>

          {items.length > 0 ? (
            <div className="checkout-items">
              {items.map((item, index) => (
                <article className="checkout-item" key={`${item.slug}-${item.size}`}>
                  <img src={item.image} alt={item.name} />
                  <div>
                    <span>{buildOrderCode(index, item)}</span>
                    <h3>{item.name}</h3>
                    <p>
                      {item.color} / Size {item.size}
                    </p>
                    <div className="cart-quantity checkout-quantity" aria-label={`Quantity for ${item.name}`}>
                      <button type="button" aria-label={`Remove one ${item.name}`} onClick={() => updateCartQuantity(item, item.quantity - 1)}>
                        -
                      </button>
                      <input aria-label={`Quantity for ${item.name}`} inputMode="numeric" min="1" max="99" type="number" value={item.quantity} onChange={(event) => updateCartQuantity(item, Number(event.target.value))} />
                      <button type="button" aria-label={`Add one ${item.name}`} onClick={() => updateCartQuantity(item, item.quantity + 1)}>
                        +
                      </button>
                    </div>
                  </div>
                  <div className="checkout-item-side">
                    <strong>{formatLak(priceToNumber(item.price) * item.quantity)}</strong>
                    <button type="button" aria-label={`Remove ${item.name}`} onClick={() => updateCartQuantity(item, 0)} />
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="checkout-empty">
              <h2>No pieces in cart</h2>
              <a href={`/${locale}/collections/t-shirts`}>Shop T-Shirts</a>
            </div>
          )}

          {customer ? (
            <div className="checkout-customer">
              <span>Delivery profile</span>
              <strong>{customer.name}</strong>
              <p>{customer.phone}</p>
              <p>{customer.address}</p>
            </div>
          ) : (
            <div className="checkout-account-lock">
              <h2>Sign in before ordering</h2>
              <p>Create an account with your phone number and delivery address before payment.</p>
              <button type="button" onClick={openAccount}>
                Create account
              </button>
            </div>
          )}
        </div>

        <aside className="checkout-payment" aria-label="Payment options">
          <div className="checkout-tabs">
            <button className={paymentMode === "pay" ? "is-active" : ""} type="button" onClick={() => setPaymentMode("pay")}>
              Pay now
            </button>
            <button className={paymentMode === "contact" ? "is-active" : ""} type="button" onClick={() => setPaymentMode("contact")}>
              Contact store
            </button>
          </div>

          {paymentMode === "pay" ? (
            <div className="checkout-pay-panel">
              {orderResult || orderError ? (
                <div className={`checkout-order-state${orderResult ? " is-ready" : " is-error"}`} role="status">
                  <span>{orderResult ? "Order saved" : "Order not saved"}</span>
                  <strong>{orderResult ? orderResult.order_no : orderError}</strong>
                </div>
              ) : null}
              {proofResult || proofError ? (
                <div className={`checkout-order-state${proofResult ? " is-ready" : " is-error"}`} role="status">
                  <span>{proofResult ? "Payment proof uploaded" : "Payment proof not uploaded"}</span>
                  <strong>{proofResult ? `${proofResult.slip_count} slip image${proofResult.slip_count === 1 ? "" : "s"} sent to admin review` : proofError}</strong>
                </div>
              ) : null}
              <div className="checkout-qr">
                <QrMark />
                <div>
                  <span>Store QR</span>
                  <strong>{formatLak(total)}</strong>
                </div>
                <button className="qr-download-button" type="button" onClick={saveQr} aria-label="Save QR code">
                  <DownloadIcon />
                </button>
              </div>
              <label className="slip-upload">
                Upload transfer slip
                <input type="file" accept="image/*" capture="environment" multiple disabled={!canOrder} onChange={(event) => addSlips(event.target.files)} />
                <span>{slips.length > 0 ? "Add more slip images" : "Take photo or choose images"}</span>
              </label>
              {slips.length > 0 ? (
                <div className="slip-preview-grid" aria-label="Uploaded transfer slips">
                  {slips.map((slip, index) => (
                    <a href={slip.url} target="_blank" rel="noreferrer" key={`${slip.name}-${index}`}>
                      <img src={slip.url} alt={`Transfer slip ${index + 1}`} />
                      <span>{slip.name}</span>
                    </a>
                  ))}
                </div>
              ) : null}
              {slipError ? <p className="slip-error">Attach at least one transfer slip before sending.</p> : null}
              <button className="checkout-send-button" type="button" onClick={sendPaymentProof} disabled={!canSendOrder || isCreatingOrder || isUploadingProof || Boolean(proofResult)}>
                {isCreatingOrder ? "Creating order..." : isUploadingProof ? "Uploading proof..." : proofResult ? "Payment proof sent" : orderResult ? "Send payment proof again" : "Send payment proof"}
              </button>
              <p>{customer ? "Sending proof creates a real order and uploads the slip for admin review." : "Create an account before uploading payment proof."}</p>
            </div>
          ) : (
            <div className="checkout-contact-panel">
              {orderResult || orderError ? (
                <div className={`checkout-order-state${orderResult ? " is-ready" : " is-error"}`} role="status">
                  <span>{orderResult ? "Order saved" : "Order not saved"}</span>
                  <strong>{orderResult ? orderResult.order_no : orderError}</strong>
                </div>
              ) : null}
              {proofResult || proofError ? (
                <div className={`checkout-order-state${proofResult ? " is-ready" : " is-error"}`} role="status">
                  <span>{proofResult ? "Payment proof uploaded" : "Payment proof not uploaded"}</span>
                  <strong>{proofResult ? `${proofResult.slip_count} slip image${proofResult.slip_count === 1 ? "" : "s"} sent to admin review` : proofError}</strong>
                </div>
              ) : null}
              <p>The message includes product codes, quantity, total, delivery details, and slip names.</p>
              {slipError ? <p className="slip-error">Attach at least one transfer slip before sending.</p> : null}
              <a className={`contact-app-button contact-whatsapp${!canSendOrder ? " is-disabled" : ""}`} href={canSendOrder ? `https://wa.me/8562099999999?text=${encodedMessage}` : "#slip"} target={canSendOrder ? "_blank" : undefined} rel={canSendOrder ? "noreferrer" : undefined} onClick={requireSlipBeforeContact}>
                <WhatsAppIcon />
                Contact on WhatsApp
              </a>
              <a className={`contact-app-button contact-messenger${!canSendOrder ? " is-disabled" : ""}`} href={canSendOrder ? `https://m.me/representlao?ref=${encodedMessage}` : "#slip"} target={canSendOrder ? "_blank" : undefined} rel={canSendOrder ? "noreferrer" : undefined} onClick={requireSlipBeforeContact}>
                <MessengerIcon />
                Contact on Messenger
              </a>
              <textarea readOnly value={orderMessage} rows={9} aria-label="Order message preview" />
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}
