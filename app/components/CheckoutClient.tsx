"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { playFeedbackTone } from "../lib/feedback-tone";
import type { Locale } from "../lib/i18n";
import { createSupabaseBrowserClient } from "../lib/supabase/client";

const cartStorageKey = "show-off-cart";
const customerStorageKey = "show-off-customer";
const orderRefsStorageKey = "show-off-order-refs";
const defaultThbQrUrl = "/assets/qr-thb.png";
const defaultLakQrUrl = "/assets/qr-lak.png";

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
  base_currency: "THB";
  payment_currency: Currency;
  exchange_rate: number;
  payment_amount: number;
};

type Currency = "THB" | "LAK";

type PaymentSettings = {
  thb_to_lak_rate: number;
  qr_thb_url: string | null;
  qr_lak_url: string | null;
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

type CheckoutFeedback = {
  type: "success" | "error";
  title: string;
  message: string;
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
    if (maybeError.code === "PGRST202" && maybeError.message?.includes("create_storefront_order_v2")) {
      return "Currency checkout is not installed yet. Apply the currency payment settings migration, then try again.";
    }

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

function priceToThb(price: string, thbToLakRate = 650) {
  const numericPrice = Number(price.replace(/[^\d]/g, "")) || 0;
  return /LAK/i.test(price) ? numericPrice / Math.max(thbToLakRate, 1) : numericPrice;
}

function formatCurrency(value: number, currency: Currency) {
  const amount = Math.round(value).toLocaleString("en-US");
  return currency === "THB" ? `฿${amount}` : `${amount} LAK`;
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

function buildOrderMessage(items: CartItem[], customer: CustomerProfile | null, currency: Currency, rate: number, orderNo?: string) {
  const multiplier = currency === "LAK" ? rate : 1;
  const total = items.reduce((sum, item) => sum + priceToThb(item.price, rate) * item.quantity, 0) * multiplier;
  const lines = items.map((item, index) => {
    return `${buildOrderCode(index, item)} | ${item.name} | ${item.color} | Size ${item.size} | Qty ${item.quantity} | ${formatCurrency(priceToThb(item.price, rate) * item.quantity * multiplier, currency)}`;
  });

  return [
    "New order request",
    `Order no: ${orderNo || "Pending"}`,
    ...lines,
    `Total: ${formatCurrency(total, currency)}`,
    ...(currency === "LAK" ? [`Exchange rate: 1 THB = ${rate.toLocaleString("en-US")} LAK`] : []),
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

function InboxPayIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path d="M5 7.5h14v9H8.8L5 19.5v-12Z" />
      <path d="M8 10.2h8" />
      <path d="M8 13.2h5.8" />
    </svg>
  );
}

function CreditCardIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <rect x="3.5" y="6" width="17" height="12" rx="1.8" />
      <path d="M3.5 10h17" />
      <path d="M7 14.2h3.2" />
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
  const [isStorageReady, setIsStorageReady] = useState(false);
  const [items, setItems] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [sheetMode, setSheetMode] = useState<"pay" | "inbox" | null>(null);
  const [feedback, setFeedback] = useState<CheckoutFeedback | null>(null);
  const [slips, setSlips] = useState<SlipPreview[]>([]);
  const [slipError, setSlipError] = useState(false);
  const [orderResult, setOrderResult] = useState<StorefrontOrder | null>(null);
  const [orderError, setOrderError] = useState("");
  const [proofResult, setProofResult] = useState<AttachedSlipsResult | null>(null);
  const [proofError, setProofError] = useState("");
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [currency, setCurrency] = useState<Currency>("THB");
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    thb_to_lak_rate: 650,
    qr_thb_url: defaultThbQrUrl,
    qr_lak_url: defaultLakQrUrl,
  });
  const slipsRef = useRef<SlipPreview[]>([]);
  const total = useMemo(
    () => items.reduce((sum, item) => sum + priceToThb(item.price, paymentSettings.thb_to_lak_rate) * item.quantity, 0),
    [items, paymentSettings.thb_to_lak_rate],
  );
  const exchangeRate = currency === "LAK" ? paymentSettings.thb_to_lak_rate : 1;
  const paymentTotal = Math.round(total * exchangeRate);
  const selectedQrUrl = currency === "LAK" ? paymentSettings.qr_lak_url : paymentSettings.qr_thb_url;
  const orderMessage = useMemo(
    () => buildOrderMessage(items, customer, currency, paymentSettings.thb_to_lak_rate, orderResult?.order_no),
    [items, customer, currency, paymentSettings.thb_to_lak_rate, orderResult?.order_no],
  );
  const encodedMessage = encodeURIComponent(orderMessage);
  const canOrder = items.length > 0 && Boolean(customer);
  const canSendOrder = canOrder && slips.length > 0;
  const itemQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  const showFeedback = (nextFeedback: CheckoutFeedback) => {
    setFeedback(nextFeedback);
    playFeedbackTone(nextFeedback.type);
  };

  useEffect(() => {
    setItems(readCartItems());
    setCustomer(readCustomerProfile());
    setIsStorageReady(true);

    const onStorage = () => {
      setItems(readCartItems());
      setCustomer(readCustomerProfile());
    };
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
    let active = true;

    const loadPaymentSettings = async () => {
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase
        .from("storefront_payment_settings")
        .select("thb_to_lak_rate, qr_thb_url, qr_lak_url")
        .eq("id", "main")
        .maybeSingle();

      if (!active || !data) return;

      const rate = Number(data.thb_to_lak_rate);
      setPaymentSettings({
        thb_to_lak_rate: Number.isFinite(rate) && rate > 0 ? rate : 650,
        qr_thb_url: data.qr_thb_url || defaultThbQrUrl,
        qr_lak_url: data.qr_lak_url || defaultLakQrUrl,
      });
    };

    void loadPaymentSettings();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    slipsRef.current = slips;
  }, [slips]);

  useEffect(() => {
    document.body.classList.toggle("checkout-sheet-open", Boolean(sheetMode));
    return () => document.body.classList.remove("checkout-sheet-open");
  }, [sheetMode]);

  useEffect(() => {
    if (!feedback) return;

    const timeout = window.setTimeout(() => setFeedback(null), 4200);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  useEffect(() => {
    setOrderResult(null);
    setOrderError("");
    setProofResult(null);
    setProofError("");
  }, [items, customer, currency]);

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

  const removeSlip = (targetIndex: number) => {
    setSlips((currentSlips) => {
      const target = currentSlips[targetIndex];
      if (target) URL.revokeObjectURL(target.url);
      return currentSlips.filter((_, index) => index !== targetIndex);
    });
    setProofResult(null);
    setSlipError(false);
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
      const { data, error } = await supabase.rpc("create_storefront_order_v2", {
        order_payload: {
          customer,
          payment_currency: currency,
          items: items.map((item) => ({
            slug: item.slug,
            name: item.name,
            color: item.color,
            size: item.size,
            quantity: item.quantity,
            unit_price: priceToThb(item.price, paymentSettings.thb_to_lak_rate),
            image: item.image,
          })),
        },
      });

      if (error) {
        throw error;
      }

      const nextOrder = data as StorefrontOrder;
      if (nextOrder.payment_currency === "LAK" && Number(nextOrder.exchange_rate) > 0) {
        setPaymentSettings((current) => ({ ...current, thb_to_lak_rate: Number(nextOrder.exchange_rate) }));
      }
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
      showFeedback({ type: "error", title: "Slip required", message: "Attach at least one transfer slip before saving." });
      return;
    }

    const createdOrder = await createOrder();

    if (!createdOrder) {
      showFeedback({ type: "error", title: "Order not saved", message: "Please check your connection and try again." });
      return;
    }

    const attachedProof = await uploadPaymentProof(createdOrder);

    if (!attachedProof) {
      showFeedback({ type: "error", title: "Upload failed", message: "Your order was saved, but the slip could not be uploaded." });
      return;
    }

    window.dispatchEvent(new CustomEvent("showoff-checkout-ready", { detail: { items, customer, order: createdOrder, proof: attachedProof, slips: slips.map((slip) => slip.name), total: formatCurrency(createdOrder.payment_amount, createdOrder.payment_currency) } }));
    setSheetMode(null);
    showFeedback({ type: "success", title: "Payment proof sent", message: `${attachedProof.slip_count} slip image${attachedProof.slip_count === 1 ? "" : "s"} sent for review.` });
  };

  const saveQr = () => {
    if (!canOrder) {
      openAccount();
      return;
    }

    if (selectedQrUrl) {
      const link = document.createElement("a");
      link.href = selectedQrUrl;
      link.download = `show-off-${currency.toLowerCase()}-payment-qr`;
      link.target = "_blank";
      link.click();
      return;
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="520" height="520" viewBox="0 0 520 520"><rect width="520" height="520" fill="white"/><text x="260" y="62" text-anchor="middle" font-family="Arial" font-size="24" font-weight="700">SHOW OFF ${currency} PAYMENT</text><rect x="92" y="92" width="336" height="336" fill="none" stroke="black" stroke-width="18"/><path d="M128 128h72v72h-72zM320 128h72v72h-72zM128 320h72v72h-72zM236 128h36v36h-36zM272 200h36v36h-36zM236 272h108v36H236zM308 344h36v36h-36z" fill="black"/><text x="260" y="470" text-anchor="middle" font-family="Arial" font-size="20">${formatCurrency(paymentTotal, currency)}</text></svg>`;
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `show-off-${currency.toLowerCase()}-payment-qr.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const openSheet = (mode: "pay" | "inbox") => {
    if (!canOrder) {
      openAccount();
      return;
    }
    setSheetMode(mode);
  };

  return (
    <main className="checkout-page" aria-busy={!isStorageReady}>
      <section className="checkout-hero" aria-labelledby="checkout-title">
        <p>Checkout</p>
        <h1 id="checkout-title">Order summary</h1>
        {isStorageReady ? <span>{items.length > 0 ? `${itemQuantity} items ready` : "Your cart is empty"}</span> : null}
      </section>

      <section className="checkout-layout">
        <div className="checkout-order">
          {!isStorageReady ? (
            <div className="checkout-loading" aria-hidden="true" />
          ) : items.length > 0 ? (
            <div className="checkout-items">
              {items.map((item) => (
                <article className="checkout-item" key={`${item.slug}-${item.size}-${item.color}`}>
                  <div className="checkout-item-image">
                    <img src={item.image} alt={item.name} />
                    <span>{item.quantity}</span>
                  </div>
                  <div className="checkout-item-copy">
                    <h3>{item.name}</h3>
                    <p>Size {item.size} / {item.color}</p>
                    <div className="cart-quantity checkout-quantity" aria-label={`Quantity for ${item.name}`}>
                      <button type="button" aria-label={`Remove one ${item.name}`} onClick={() => updateCartQuantity(item, item.quantity - 1)}>-</button>
                      <input aria-label={`Quantity for ${item.name}`} inputMode="numeric" min="1" max="99" type="number" value={item.quantity} onChange={(event) => updateCartQuantity(item, Number(event.target.value))} />
                      <button type="button" aria-label={`Add one ${item.name}`} onClick={() => updateCartQuantity(item, item.quantity + 1)}>+</button>
                    </div>
                  </div>
                  <div className="checkout-item-side">
                    <strong>{formatCurrency(priceToThb(item.price, paymentSettings.thb_to_lak_rate) * item.quantity * exchangeRate, currency)}</strong>
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

          {isStorageReady && items.length > 0 ? (
            <div className="checkout-totals">
              <div className="checkout-currency-switch">
                <span>Pay in</span>
                <div className="checkout-currency-options" role="group" aria-label="Payment currency">
                  <button className={currency === "THB" ? "is-active" : ""} type="button" aria-pressed={currency === "THB"} onClick={() => setCurrency("THB")}>THB</button>
                  <button className={currency === "LAK" ? "is-active" : ""} type="button" aria-pressed={currency === "LAK"} onClick={() => setCurrency("LAK")}>LAK</button>
                </div>
              </div>
              {currency === "LAK" ? <p className="checkout-rate-note">1 THB = {paymentSettings.thb_to_lak_rate.toLocaleString("en-US")} LAK</p> : null}
              <div><span>Subtotal</span><strong>{formatCurrency(paymentTotal, currency)}</strong></div>
              <div><span>Delivery</span><strong>Confirmed by store</strong></div>
              <div className="checkout-grand-total"><span>Total</span><strong>{formatCurrency(paymentTotal, currency)}</strong></div>
            </div>
          ) : null}

          {!isStorageReady ? null : customer ? (
            <div className="checkout-customer">
              <span>Deliver to</span>
              <strong>{customer.name}</strong>
              <p>{customer.phone} / {customer.address}</p>
            </div>
          ) : (
            <div className="checkout-account-lock">
              <h2>Sign in before ordering</h2>
              <p>Add your phone number and delivery address before payment.</p>
              <button type="button" onClick={openAccount}>Create account</button>
            </div>
          )}

          {isStorageReady ? (
            <div className="checkout-primary-actions" aria-label="Payment options">
              <button className="checkout-pay-action" type="button" disabled={items.length === 0} onClick={() => openSheet("pay")}><CreditCardIcon />PAY NOW</button>
              <button className="checkout-inbox-action" type="button" disabled={items.length === 0} onClick={() => openSheet("inbox")}><InboxPayIcon />Pay by inbox</button>
            </div>
          ) : null}
        </div>
      </section>

      <div className={`checkout-sheet-scrim${sheetMode ? " is-open" : ""}`} aria-hidden="true" onClick={() => setSheetMode(null)} />
      <section className={`checkout-bottom-sheet${sheetMode ? " is-open" : ""}`} role="dialog" aria-modal="true" aria-hidden={!sheetMode} aria-labelledby="checkout-sheet-title">
        <div className="checkout-sheet-handle" />
        <header className="checkout-sheet-header">
          <div>
            <span>{sheetMode === "inbox" ? "Store assistance" : "Bank transfer"}</span>
            <h2 id="checkout-sheet-title">{sheetMode === "inbox" ? "Pay by inbox" : "Pay now"}</h2>
          </div>
          <button type="button" aria-label="Close payment panel" onClick={() => setSheetMode(null)}>×</button>
        </header>

        {sheetMode === "pay" ? (
          <div className="checkout-pay-panel">
            <div className="checkout-qr">
              {selectedQrUrl ? <img className="checkout-bank-qr" src={selectedQrUrl} alt={`${currency} payment QR code`} /> : <QrMark />}
              <div><span>Amount to transfer</span><strong>{formatCurrency(paymentTotal, currency)}</strong><small>SHOW OFF {currency} account</small></div>
              <button className="qr-download-button" type="button" onClick={saveQr} aria-label="Save QR code"><DownloadIcon /></button>
            </div>

            <label className={`checkout-slip-dropzone${slipError ? " has-error" : ""}`}>
              <input type="file" accept="image/*" capture="environment" multiple disabled={!canOrder} onChange={(event) => addSlips(event.target.files)} />
              <span className="checkout-slip-plus">+</span>
              <strong>{slips.length > 0 ? "Add more slips" : "Attach transfer slips"}</strong>
              <small>JPG or PNG, multiple images allowed</small>
            </label>

            {slips.length > 0 ? (
              <div className="slip-preview-grid" aria-label="Uploaded transfer slips">
                {slips.map((slip, index) => (
                  <figure key={`${slip.name}-${index}`}>
                    <a href={slip.url} target="_blank" rel="noreferrer"><img src={slip.url} alt={`Transfer slip ${index + 1}`} /></a>
                    <figcaption>{slip.name}</figcaption>
                    <button type="button" aria-label={`Remove transfer slip ${index + 1}`} onClick={() => removeSlip(index)}>×</button>
                  </figure>
                ))}
              </div>
            ) : null}

            {orderError || proofError ? <p className="slip-error">{proofError || orderError}</p> : null}
            <button className="checkout-send-button" type="button" onClick={sendPaymentProof} disabled={!canSendOrder || isCreatingOrder || isUploadingProof || Boolean(proofResult)}>
              {isCreatingOrder ? "Creating order..." : isUploadingProof ? "Uploading slips..." : proofResult ? "Payment proof sent" : "Save payment proof"}
            </button>
          </div>
        ) : (
          <div className="checkout-contact-panel">
            <p>Send your order details directly to SHOW OFF. The message includes every item, size, total, and delivery address.</p>
            <a className="contact-app-button contact-whatsapp" href={`https://wa.me/8562056320988?text=${encodedMessage}`} target="_blank" rel="noreferrer"><WhatsAppIcon />Continue with WhatsApp</a>
            <a className="contact-app-button contact-messenger" href="https://www.facebook.com/profile.php?id=100089116444087" target="_blank" rel="noreferrer"><MessengerIcon />Continue with Messenger</a>
            <div className="checkout-message-preview"><span>Message preview</span><pre>{orderMessage}</pre></div>
          </div>
        )}
      </section>

      {feedback ? (
        <div className={`checkout-feedback is-${feedback.type}`} role="status" aria-live="polite">
          <i aria-hidden="true">{feedback.type === "success" ? "✓" : "×"}</i>
          <div><strong>{feedback.title}</strong><span>{feedback.message}</span></div>
          <button type="button" aria-label="Dismiss notification" onClick={() => setFeedback(null)}>×</button>
        </div>
      ) : null}
    </main>
  );
}
