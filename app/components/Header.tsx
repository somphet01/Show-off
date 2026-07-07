"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { playFeedbackTone } from "../lib/feedback-tone";
import type { Dictionary, Locale } from "../lib/i18n";
import { silenceIntroAudio } from "../lib/intro-audio";
import { shopCategories, slugify } from "../lib/shop";
import { createSupabaseBrowserClient } from "../lib/supabase/client";
import type { SavedItem } from "./SaveProductButton";

type MenuItemStyle = CSSProperties & { "--item-index": number };
const cartStorageKey = "show-off-cart";
const savedStorageKey = "show-off-saved";
const customerStorageKey = "show-off-customer";
const accountProfileStorageKey = "show-off-account-profile";
const accountPasswordStorageKey = "show-off-account-password";
const orderRefsStorageKey = "show-off-order-refs";
const alertsSeenStorageKey = "show-off-alerts-seen-v1";

type CartItem = {
  slug: string;
  name: string;
  color: string;
  size: string;
  price: string;
  image: string;
  quantity: number;
  stock?: number;
};

type CustomerProfile = {
  name: string;
  email: string;
  phone: string;
  address: string;
};

type AccountMode = "login" | "register" | "forgot" | "profile";

type AccountNotice = {
  type: "success" | "error";
  title: string;
  message: string;
  field?: string;
};

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
    product_id?: string | null;
    product_slug?: string | null;
    product_image?: string | null;
    sku_snapshot?: string | null;
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
  statusLabel?: string;
  notice?: string;
  phase: "waiting" | "complete" | "rejected";
  documents: Array<{ url: string; name?: string }>;
};

function formatStoredThbPrice(price: string) {
  if (!/LAK/i.test(price)) return price;
  const amount = Number(price.replace(/[^\d]/g, "")) || 0;
  return `฿${Math.round(amount / 650).toLocaleString("en-US")}`;
}

function formatCartLinePrice(item: CartItem) {
  const unitPrice = /LAK/i.test(item.price)
    ? (Number(item.price.replace(/[^\d]/g, "")) || 0) / 650
    : Number(item.price.replace(/[^\d]/g, "")) || 0;

  return `฿${Math.round(unitPrice * item.quantity).toLocaleString("en-US")}`;
}

function BellIcon() {
  return (
    <svg aria-hidden="true" className="bell-icon" fill="none" viewBox="0 0 24 24">
      <path d="M18 16.5H6c1.2-1.2 1.5-2.8 1.5-5.1 0-2.8 1.8-5.1 4.5-5.1s4.5 2.3 4.5 5.1c0 2.3.3 3.9 1.5 5.1Z" />
      <path d="M10 19c.4.6 1.1 1 2 1s1.6-.4 2-1" />
      <path d="M12 4.5V3.4" />
    </svg>
  );
}

function BookmarkIcon() {
  return (
    <svg aria-hidden="true" className="bookmark-icon" fill="none" viewBox="0 0 24 24">
      <path d="M7.5 4.5h9v15L12 16.75 7.5 19.5v-15Z" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path d="m4.5 16.8-.7 3.4 3.4-.7L18.7 8 16 5.3 4.5 16.8Z" />
      <path d="m14.5 6.8 2.7 2.7" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path d="M12 21s6-5.1 6-11a6 6 0 1 0-12 0c0 5.9 6 11 6 11Z" />
      <circle cx="12" cy="10" r="2.1" />
    </svg>
  );
}

function OrderIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path d="M7 4.5h10l2 3.5v11.5H5V8l2-3.5Z" />
      <path d="M5.5 8h13M9 11.5h6" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path d="M10 5H5.5v14H10" />
      <path d="M13 8.5 16.5 12 13 15.5" />
      <path d="M8.5 12h8" />
    </svg>
  );
}

function ClearCartIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path d="M6.5 7.5h11" />
      <path d="M9 7.5V5h6v2.5" />
      <path d="M8.3 10.5 9 19h6l.7-8.5" />
      <path d="M10.5 11.2 13.5 16" />
      <path d="M13.5 11.2 10.5 16" />
    </svg>
  );
}

function readCartItems() {
  try {
    const stored = window.localStorage.getItem(cartStorageKey);
    return stored ? (JSON.parse(stored) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function cartStockKey(item: Pick<CartItem, "slug" | "color" | "size">) {
  return [item.slug, item.color, item.size].map((part) => part.trim().toLowerCase()).join("|");
}

function readSavedItems() {
  try {
    const stored = window.localStorage.getItem(savedStorageKey);
    return stored ? (JSON.parse(stored) as SavedItem[]) : [];
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

function readAccountProfile() {
  try {
    const stored = window.localStorage.getItem(accountProfileStorageKey);
    return stored ? (JSON.parse(stored) as CustomerProfile) : readCustomerProfile();
  } catch {
    return readCustomerProfile();
  }
}

function readAccountPassword() {
  try {
    return window.localStorage.getItem(accountPasswordStorageKey) ?? "";
  } catch {
    return "";
  }
}

function normalizeContact(value: string) {
  return value.trim().toLowerCase();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isValidPhone(value: string) {
  return value.replace(/\D/g, "").length >= 6;
}

function isValidContact(value: string) {
  return isValidEmail(value) || isValidPhone(value);
}

function isValidPassword(value: string) {
  return value.trim().length >= 6;
}

function matchesCustomerContact(profile: CustomerProfile, contact: string) {
  const target = normalizeContact(contact);
  return normalizeContact(profile.email) === target || normalizeContact(profile.phone) === target;
}

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

function formatAccountPrice(value: number) {
  return `฿${Math.round(value).toLocaleString("en-US")}`;
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

function orderItemProductSlug(item: AccountOrder["order_items"][number]) {
  const existingSlug = item.product_slug?.trim();
  if (existingSlug) return existingSlug;

  const fallback = item.product_name_snapshot
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return fallback || slugify(item.product_name_snapshot);
}

type HistoryProductImageRow = {
  product_id: string | null;
  path: string | null;
  alt_text: string | null;
  sort_order: number | null;
  is_primary: boolean | null;
};

type HistoryProductVariantRow = {
  product_id: string | null;
  sku: string | null;
  color_name: string | null;
};

type HistoryProductRow = {
  id: string | null;
  sku: string | null;
  name_en: string | null;
  slug: string | null;
};

function historyImageColor(altText?: string | null) {
  const match = (altText ?? "").match(/^\[color:?([^\]]*)\]/i);
  return match?.[1]?.trim().toLowerCase() ?? "";
}

function historyItemVariant(item: AccountOrder["order_items"][number], variants: HistoryProductVariantRow[]) {
  const sku = item.sku_snapshot?.trim().toUpperCase();
  if (!sku) return null;

  return variants.find((variant) => variant.sku?.trim().toUpperCase() === sku) ?? null;
}

function isGeneratedHistoryProductSku(sku?: string | null) {
  return /^SO-[A-Z0-9]+-\d{4}$/.test((sku ?? "").trim().toUpperCase());
}

function isDemoHistoryImage(path?: string | null) {
  const value = path ?? "";
  return value.startsWith("/assets/") || value.startsWith("/test.");
}

function historyItemProduct(
  item: AccountOrder["order_items"][number],
  products: HistoryProductRow[],
  variants: HistoryProductVariantRow[],
  images: HistoryProductImageRow[],
) {
  const variantProductId = historyItemVariant(item, variants)?.product_id;
  const itemName = item.product_name_snapshot.trim().toLowerCase();
  const candidates = products.filter((product) => {
    return product.id === variantProductId || product.id === item.product_id || product.name_en?.trim().toLowerCase() === itemName;
  });

  return candidates.sort((a, b) => {
    const aHasRealImage = images.some((image) => image.product_id === a.id && image.path && !isDemoHistoryImage(image.path));
    const bHasRealImage = images.some((image) => image.product_id === b.id && image.path && !isDemoHistoryImage(image.path));
    if (aHasRealImage !== bHasRealImage) return aHasRealImage ? -1 : 1;

    const aGenerated = isGeneratedHistoryProductSku(a.sku);
    const bGenerated = isGeneratedHistoryProductSku(b.sku);
    if (aGenerated !== bGenerated) return aGenerated ? -1 : 1;

    if (a.id === variantProductId) return -1;
    if (b.id === variantProductId) return 1;
    if (a.id === item.product_id) return -1;
    if (b.id === item.product_id) return 1;

    return 0;
  })[0] ?? null;
}

function historyItemProductId(
  item: AccountOrder["order_items"][number],
  products: HistoryProductRow[],
  variants: HistoryProductVariantRow[],
  images: HistoryProductImageRow[],
) {
  return historyItemProduct(item, products, variants, images)?.id ?? historyItemVariant(item, variants)?.product_id ?? item.product_id ?? null;
}

function historyItemColour(item: AccountOrder["order_items"][number], variants: HistoryProductVariantRow[]) {
  const variantColour = historyItemVariant(item, variants)?.color_name;

  if (variantColour?.trim()) {
    return variantColour.trim().toLowerCase();
  }

  return (item.variant_label_snapshot ?? "")
    .split("/")
    .at(0)
    ?.trim()
    .toLowerCase() ?? "";
}

function pickHistoryItemImage(item: AccountOrder["order_items"][number], images: HistoryProductImageRow[], variants: HistoryProductVariantRow[], products: HistoryProductRow[]) {
  const productId = historyItemProductId(item, products, variants, images);
  const productImages = images
    .filter((image) => image.product_id === productId && image.path)
    .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0));

  if (!productImages.length) {
    return item.product_image ?? null;
  }

  const colour = historyItemColour(item, variants);
  const colourImage = colour
    ? productImages.find((image) => {
        const imageColour = historyImageColor(image.alt_text);
        return imageColour === colour;
      })
    : null;
  const primaryImage = productImages.find((image) => image.is_primary && !isDemoHistoryImage(image.path)) ?? productImages.find((image) => !isDemoHistoryImage(image.path)) ?? productImages.find((image) => image.is_primary) ?? productImages[0];

  return colourImage?.path ?? primaryImage?.path ?? item.product_image ?? null;
}

async function hydrateOrderHistoryImages(orders: AccountOrder[], supabase: ReturnType<typeof createSupabaseBrowserClient>) {
  const orderProductIds = Array.from(
    new Set(
      orders
        .flatMap((order) => order.order_items)
        .map((item) => item.product_id)
        .filter((id): id is string => Boolean(id)),
    ),
  );
  const orderSkus = Array.from(
    new Set(
      orders
        .flatMap((order) => order.order_items)
        .map((item) => item.sku_snapshot?.trim())
        .filter((sku): sku is string => Boolean(sku)),
    ),
  );
  const orderProductNames = Array.from(
    new Set(
      orders
        .flatMap((order) => order.order_items)
        .map((item) => item.product_name_snapshot?.trim())
        .filter((name): name is string => Boolean(name)),
    ),
  );

  if (!orderProductIds.length && !orderSkus.length && !orderProductNames.length) {
    return orders;
  }

  const variantQueries = [];
  if (orderProductIds.length) {
    variantQueries.push(
      supabase
        .from("product_variants")
        .select("product_id,sku,color_name")
        .in("product_id", orderProductIds)
        .returns<HistoryProductVariantRow[]>(),
    );
  }
  if (orderSkus.length) {
    variantQueries.push(
      supabase
      .from("product_variants")
      .select("product_id,sku,color_name")
        .in("sku", orderSkus)
      .returns<HistoryProductVariantRow[]>(),
    );
  }

  const productQueries = [];
  if (orderProductIds.length) {
    productQueries.push(
      supabase
        .from("products")
        .select("id,sku,name_en,slug")
        .in("id", orderProductIds)
        .returns<HistoryProductRow[]>(),
    );
  }
  if (orderProductNames.length) {
    productQueries.push(
      supabase
        .from("products")
        .select("id,sku,name_en,slug")
        .in("name_en", orderProductNames)
        .returns<HistoryProductRow[]>(),
    );
  }

  const [variantResults, productResults] = await Promise.all([Promise.all(variantQueries), Promise.all(productQueries)]);
  const variants = variantResults.flatMap((result) => result.data ?? []);
  const seedProducts = productResults.flatMap((result) => result.data ?? []);
  const productIds = Array.from(
    new Set([
      ...orderProductIds,
      ...variants.map((variant) => variant.product_id).filter((id): id is string => Boolean(id)),
      ...seedProducts.map((product) => product.id).filter((id): id is string => Boolean(id)),
    ]),
  );

  if (!productIds.length) {
    return orders;
  }

  const [imagesResult, productsResult] = await Promise.all([
    supabase
      .from("product_images")
      .select("product_id,path,alt_text,sort_order,is_primary")
      .in("product_id", productIds)
      .returns<HistoryProductImageRow[]>(),
    supabase
      .from("products")
      .select("id,sku,name_en,slug")
      .in("id", productIds)
      .returns<HistoryProductRow[]>(),
  ]);

  const images = imagesResult.data ?? [];
  const products = [...seedProducts, ...(productsResult.data ?? [])].filter((product, index, list) => {
    return product.id && list.findIndex((item) => item.id === product.id) === index;
  });

  return orders.map((order) => ({
    ...order,
    order_items: order.order_items.map((item) => {
      const product = historyItemProduct(item, products, variants, images);
      const productId = product?.id ?? historyItemProductId(item, products, variants, images);

      return {
        ...item,
        product_id: productId ?? item.product_id ?? null,
        product_slug: product?.slug ?? item.product_slug ?? null,
        product_image: pickHistoryItemImage(item, images, variants, products) ?? item.product_image ?? null,
      };
    }),
  }));
}

export function Header({ dictionary, locale, tone = "overlay" }: { dictionary: Dictionary; locale: Locale; tone?: "overlay" | "solid" | "clear" }) {
  const router = useRouter();
  const lastYRef = useRef(0);
  const tickingRef = useRef(false);
  const transitionRef = useRef<number | null>(null);
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<"account" | "alerts" | "cart" | "saved" | null>(null);
  const [accountMode, setAccountMode] = useState<AccountMode>("login");
  const [openCategory, setOpenCategory] = useState("");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [accountDraft, setAccountDraft] = useState<CustomerProfile>({ name: "", email: "", phone: "", address: "" });
  const [accountPassword, setAccountPassword] = useState("");
  const [accountTouched, setAccountTouched] = useState<Record<string, boolean>>({});
  const [accountNotice, setAccountNotice] = useState<AccountNotice | null>(null);
  const [profileEditing, setProfileEditing] = useState(false);
  const [orderHistoryOpen, setOrderHistoryOpen] = useState(true);
  const [accountOrders, setAccountOrders] = useState<AccountOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [seenAlertIds, setSeenAlertIds] = useState<string[]>([]);
  const nextLocale = locale === "en" ? "lo" : "en";
  const overlayOpen = menuOpen || activePanel !== null;
  const cartQuantity = cartItems.reduce((total, item) => total + item.quantity, 0);
  const savedQuantity = savedItems.length;
  const orderAlerts = useMemo(() => buildOrderAlerts(accountOrders, locale), [accountOrders, locale]);
  const unreadOrderAlerts = useMemo(() => {
    const seen = new Set(seenAlertIds);
    return orderAlerts.filter((alert) => !seen.has(alert.id));
  }, [orderAlerts, seenAlertIds]);
  const unreadAlertCount = useMemo(() => {
    return unreadOrderAlerts.length;
  }, [unreadOrderAlerts]);
  const successProfileNotice = accountNotice?.type === "success" && (accountNotice.title === "Signed in" || accountNotice.title === "Account created");
  const activeAccountCustomer = customer ?? (successProfileNotice ? accountDraft : null);
  const showAccountProfile = Boolean(activeAccountCustomer && (accountMode === "profile" || successProfileNotice));

  useEffect(() => {
    lastYRef.current = window.scrollY;

    const updateHeader = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastYRef.current;

      if (currentY < 24) {
        setHidden(false);
      } else if (delta > 8) {
        setHidden(true);
      } else if (delta < -8) {
        setHidden(false);
      }

      lastYRef.current = currentY;
      tickingRef.current = false;
    };

    const onScroll = () => {
      if (!tickingRef.current) {
        window.requestAnimationFrame(updateHeader);
        tickingRef.current = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("menu-lock", overlayOpen);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setActivePanel(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.classList.remove("menu-lock");
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [overlayOpen]);

  useEffect(() => {
    document.body.classList.remove("route-exit");

    return () => {
      if (transitionRef.current) {
        window.clearTimeout(transitionRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setCartItems(readCartItems());

    const onCartUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<CartItem[]>;
      setCartItems(Array.isArray(customEvent.detail) ? customEvent.detail : readCartItems());
    };

    const onCartOpen = () => {
      setMenuOpen(false);
      setActivePanel("cart");
    };

    const onStorage = () => setCartItems(readCartItems());

    window.addEventListener("showoff-cart-updated", onCartUpdated);
    window.addEventListener("showoff-cart-open", onCartOpen);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("showoff-cart-updated", onCartUpdated);
      window.removeEventListener("showoff-cart-open", onCartOpen);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    hydrateCartStock(cartItems);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartItems.length]);

  useEffect(() => {
    const syncCustomer = () => {
      const profile = readCustomerProfile();
      setCustomer(profile);
      if (profile) {
        setAccountDraft(profile);
        setAccountMode("profile");
        setProfileEditing(false);
      }
    };

    const openAccount = () => {
      const profile = readCustomerProfile();

      setMenuOpen(false);
      setAccountTouched({});
      setAccountNotice(null);
      setAccountPassword("");

      if (profile) {
        setCustomer(profile);
        setAccountDraft(profile);
        setAccountMode("profile");
        setProfileEditing(false);
      } else {
        setAccountMode("register");
      }

      setActivePanel("account");
    };

    syncCustomer();
    window.addEventListener("showoff-account-updated", syncCustomer);
    window.addEventListener("showoff-account-open", openAccount);
    window.addEventListener("storage", syncCustomer);

    return () => {
      window.removeEventListener("showoff-account-updated", syncCustomer);
      window.removeEventListener("showoff-account-open", openAccount);
      window.removeEventListener("storage", syncCustomer);
    };
  }, []);

  useEffect(() => {
    setSavedItems(readSavedItems());

    const onSavedUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<SavedItem[]>;
      setSavedItems(Array.isArray(customEvent.detail) ? customEvent.detail : readSavedItems());
    };

    const onSavedOpen = () => {
      setMenuOpen(false);
      setActivePanel("saved");
    };

    const onStorage = () => setSavedItems(readSavedItems());

    window.addEventListener("showoff-saved-updated", onSavedUpdated);
    window.addEventListener("showoff-saved-open", onSavedOpen);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("showoff-saved-updated", onSavedUpdated);
      window.removeEventListener("showoff-saved-open", onSavedOpen);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    let active = true;
    const shouldShowLoading = activePanel === "alerts" || (activePanel === "account" && accountMode === "profile");

    const loadOrders = async () => {
      const orderIds = readOrderIds();
      if (orderIds.length === 0) {
        setAccountOrders([]);
        setOrdersLoading(false);
        return;
      }

      if (shouldShowLoading) {
        setOrdersLoading(true);
      }

      try {
        const supabase = createSupabaseBrowserClient();
        const { data, error } = await supabase.rpc("get_storefront_order_history", { target_order_ids: orderIds });
        if (error) {
          throw error;
        }
        if (active) {
          const orders = Array.isArray(data) ? (data as AccountOrder[]) : [];
          const hydratedOrders = await hydrateOrderHistoryImages(orders, supabase);
          setAccountOrders(hydratedOrders);
        }
      } catch {
        if (active) {
          setAccountOrders([]);
        }
      } finally {
        if (active && shouldShowLoading) {
          setOrdersLoading(false);
        }
      }
    };

    const refreshOrders = () => {
      void loadOrders();
    };
    const refreshVisibleOrders = () => {
      if (!document.hidden) {
        void loadOrders();
      }
    };

    refreshOrders();
    window.addEventListener("showoff-orders-updated", refreshOrders);
    window.addEventListener("focus", refreshOrders);
    document.addEventListener("visibilitychange", refreshVisibleOrders);
    const refreshTimer = window.setInterval(refreshOrders, 30000);

    return () => {
      active = false;
      window.removeEventListener("showoff-orders-updated", refreshOrders);
      window.removeEventListener("focus", refreshOrders);
      document.removeEventListener("visibilitychange", refreshVisibleOrders);
      window.clearInterval(refreshTimer);
    };
  }, [accountMode, activePanel, customer]);

  useEffect(() => {
    setSeenAlertIds(readSeenAlerts());

    const syncSeenAlerts = () => setSeenAlertIds(readSeenAlerts());
    window.addEventListener("storage", syncSeenAlerts);
    window.addEventListener("showoff-alerts-seen-updated", syncSeenAlerts);

    return () => {
      window.removeEventListener("storage", syncSeenAlerts);
      window.removeEventListener("showoff-alerts-seen-updated", syncSeenAlerts);
    };
  }, []);

  const markAlertsAsSeen = (alertIds: string[] = orderAlerts.map((alert) => alert.id)) => {
    const nextIds = [...new Set([...readSeenAlerts(), ...alertIds])];
    writeSeenAlerts(nextIds);
    setSeenAlertIds(nextIds);
    window.dispatchEvent(new CustomEvent("showoff-alerts-seen-updated"));
  };

  useEffect(() => {
    if (!accountNotice) return;

    const noticeTimer = window.setTimeout(
      () => setAccountNotice(null),
      accountNotice.type === "success" ? 800 : 1200,
    );

    return () => window.clearTimeout(noticeTimer);
  }, [accountNotice]);

  const markAccountField = (field: string) => {
    setAccountTouched((current) => ({ ...current, [field]: true }));
  };

  const showAccountNotice = (notice: AccountNotice) => {
    setAccountNotice(notice);
    playFeedbackTone(notice.type);
  };

  const resetAccountFeedback = () => {
    setAccountTouched({});
    setAccountNotice(null);
    setAccountPassword("");
  };

  const changeAccountMode = (mode: AccountMode) => {
    resetAccountFeedback();
    setAccountMode(mode);
  };

  const accountFieldClass = (field: string, valid: boolean) => {
    const shouldShow = Boolean(accountTouched[field] || accountNotice?.field === field || accountNotice?.type === "success");
    if (!shouldShow) return "account-field";
    const forcedError = accountNotice?.type === "error" && accountNotice.field === field;
    return `account-field ${valid && !forcedError ? "is-valid" : "is-invalid"}`;
  };

  const updateAccountDraft = (nextDraft: CustomerProfile) => {
    setAccountDraft(nextDraft);
    setAccountNotice(null);
  };

  const visitCollection = (href: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    silenceIntroAudio();
    setMenuOpen(false);
    document.body.classList.remove("menu-lock");
    document.body.classList.add("route-exit");

    transitionRef.current = window.setTimeout(() => {
      window.location.href = href;
    }, 520);
  };

  const openAlertDetail = (href: string, alertId: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    markAlertsAsSeen([alertId]);
    setMenuOpen(false);
    setActivePanel(null);
    document.body.classList.remove("menu-lock");
    router.push(href, { scroll: false });
  };

  const openAlertsInbox = (href: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    silenceIntroAudio();
    setMenuOpen(false);
    setActivePanel(null);
    document.body.classList.remove("menu-lock");
    router.push(href, { scroll: false });
  };

  const openPanel = (panel: "account" | "alerts" | "cart" | "saved") => {
    setMenuOpen(false);
    if (panel === "account") {
      changeAccountMode(customer ? "profile" : "login");
    }
    setActivePanel(panel);
  };

  const goToCheckout = () => {
    if (!customer) {
      setMenuOpen(false);
      changeAccountMode("register");
      setActivePanel("account");
      return;
    }

    silenceIntroAudio();
    setActivePanel(null);
    document.body.classList.remove("menu-lock");
    document.body.classList.add("route-exit");

    transitionRef.current = window.setTimeout(() => {
      window.location.href = `/${locale}/checkout`;
    }, 520);
  };

  const closeOverlays = () => {
    setMenuOpen(false);
    setActivePanel(null);
  };

  const saveCartItems = (items: CartItem[]) => {
    if (items.length === 0) {
      window.localStorage.removeItem(cartStorageKey);
    } else {
      window.localStorage.setItem(cartStorageKey, JSON.stringify(items));
    }

    setCartItems(items);
  };

  async function hydrateCartStock(items: CartItem[]) {
    if (items.length === 0) return;

    try {
      const response = await fetch("/api/storefront/cart-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: items.map(({ slug, color, size }) => ({ slug, color, size })) }),
      });
      if (!response.ok) return;
      const payload = (await response.json()) as { stocks?: Record<string, number> };
      const stocks = payload.stocks ?? {};
      let changed = false;
      const nextItems = items
        .map((item) => {
          const stock = stocks[cartStockKey(item)];
          if (typeof stock !== "number") return item;
          const quantity = Math.min(item.quantity, Math.max(0, stock));
          if (item.stock !== stock || item.quantity !== quantity) changed = true;
          return { ...item, stock, quantity };
        })
        .filter((item) => item.quantity > 0);

      if (changed || nextItems.length !== items.length) {
        saveCartItems(nextItems);
      }
    } catch {
      // Keep the cart usable when the stock endpoint is temporarily unavailable.
    }
  }

  const updateCartQuantity = (targetItem: CartItem, nextQuantity: number) => {
    const stockLimit = typeof targetItem.stock === "number" ? Math.max(0, targetItem.stock) : 99;
    const safeQuantity = Number.isFinite(nextQuantity) ? Math.max(0, Math.min(stockLimit, Math.floor(nextQuantity))) : targetItem.quantity;
    const nextItems =
      safeQuantity === 0
        ? cartItems.filter((item) => !(item.slug === targetItem.slug && item.size === targetItem.size && item.color === targetItem.color))
        : cartItems.map((item) => (item.slug === targetItem.slug && item.size === targetItem.size && item.color === targetItem.color ? { ...item, quantity: safeQuantity, stock: stockLimit } : item));

    saveCartItems(nextItems);
  };

  const removeCartItem = (targetItem: CartItem) => {
    saveCartItems(cartItems.filter((item) => !(item.slug === targetItem.slug && item.size === targetItem.size && item.color === targetItem.color)));
  };

  const clearCart = () => {
    saveCartItems([]);
  };

  const saveCustomerProfile = () => {
    const nextProfile = {
      name: accountDraft.name.trim(),
      email: accountDraft.email.trim(),
      phone: accountDraft.phone.trim(),
      address: accountDraft.address.trim(),
    };

    if (!nextProfile.name || !nextProfile.phone || !nextProfile.address) {
      showAccountNotice({
        type: "error",
        title: "Check your details",
        message: "Phone number and delivery address are required before saving.",
      });
      return;
    }

    window.localStorage.setItem(customerStorageKey, JSON.stringify(nextProfile));
    window.localStorage.setItem(accountProfileStorageKey, JSON.stringify(nextProfile));
    setCustomer(nextProfile);
    setAccountMode("profile");
    setProfileEditing(false);
    showAccountNotice({
      type: "success",
      title: "Saved",
      message: "Your delivery details are ready for checkout.",
    });
    window.dispatchEvent(new CustomEvent("showoff-account-updated", { detail: nextProfile }));
  };

  const handleLogin = () => {
    const contact = accountDraft.email.trim();
    const password = accountPassword.trim();
    const storedProfile = readAccountProfile();
    const storedPassword = readAccountPassword();

    setAccountTouched({ "login-contact": true, "login-password": true });

    if (!isValidContact(contact)) {
      showAccountNotice({
        type: "error",
        title: "Check email or phone",
        message: "Enter the same email or phone number used on your account.",
        field: "login-contact",
      });
      return;
    }

    if (!isValidPassword(password)) {
      showAccountNotice({
        type: "error",
        title: "Check password",
        message: "Password must be at least 6 characters.",
        field: "login-password",
      });
      return;
    }

    if (!storedProfile || !matchesCustomerContact(storedProfile, contact)) {
      showAccountNotice({
        type: "error",
        title: "Account not found",
        message: "Create an account first, or use the contact saved on this device.",
        field: "login-contact",
      });
      return;
    }

    if (storedPassword && storedPassword !== password) {
      showAccountNotice({
        type: "error",
        title: "Wrong password",
        message: "The password does not match this account.",
        field: "login-password",
      });
      return;
    }

    if (!storedPassword) {
      window.localStorage.setItem(accountPasswordStorageKey, password);
    }

    window.localStorage.setItem(customerStorageKey, JSON.stringify(storedProfile));
    setCustomer(storedProfile);
    setAccountDraft(storedProfile);
    setAccountMode("profile");
    setProfileEditing(false);
    showAccountNotice({
      type: "success",
      title: "Signed in",
      message: "Your account is ready for orders and checkout.",
    });
    window.dispatchEvent(new CustomEvent("showoff-account-updated", { detail: storedProfile }));
  };

  const handleRegister = () => {
    const nextProfile = {
      name: accountDraft.name.trim(),
      email: accountDraft.email.trim(),
      phone: accountDraft.phone.trim(),
      address: accountDraft.address.trim(),
    };
    const password = accountPassword.trim();

    setAccountTouched({
      "register-name": true,
      "register-email": true,
      "register-password": true,
      "register-phone": true,
      "register-address": true,
    });

    if (!nextProfile.name) {
      showAccountNotice({ type: "error", title: "Add your name", message: "Full name is required for your account.", field: "register-name" });
      return;
    }

    if (!isValidEmail(nextProfile.email)) {
      showAccountNotice({ type: "error", title: "Check email", message: "Use a valid email address for order updates.", field: "register-email" });
      return;
    }

    if (!isValidPassword(password)) {
      showAccountNotice({ type: "error", title: "Check password", message: "Password must be at least 6 characters.", field: "register-password" });
      return;
    }

    if (!isValidPhone(nextProfile.phone)) {
      showAccountNotice({ type: "error", title: "Check phone number", message: "Phone number must include at least 6 digits.", field: "register-phone" });
      return;
    }

    if (!nextProfile.address) {
      showAccountNotice({ type: "error", title: "Add delivery address", message: "Delivery address is required before checkout.", field: "register-address" });
      return;
    }

    window.localStorage.setItem(customerStorageKey, JSON.stringify(nextProfile));
    window.localStorage.setItem(accountProfileStorageKey, JSON.stringify(nextProfile));
    window.localStorage.setItem(accountPasswordStorageKey, password);
    setCustomer(nextProfile);
    setAccountDraft(nextProfile);
    setAccountMode("profile");
    setProfileEditing(false);
    showAccountNotice({
      type: "success",
      title: "Account created",
      message: "Your details passed and are saved for checkout.",
    });
    window.dispatchEvent(new CustomEvent("showoff-account-updated", { detail: nextProfile }));
  };

  const handleForgotPassword = () => {
    const contact = accountDraft.email.trim();
    const storedProfile = readAccountProfile();

    setAccountTouched({ "forgot-contact": true });

    if (!isValidContact(contact)) {
      showAccountNotice({
        type: "error",
        title: "Check email or phone",
        message: "Enter the email or phone number saved on your account.",
        field: "forgot-contact",
      });
      return;
    }

    if (!storedProfile || !matchesCustomerContact(storedProfile, contact)) {
      showAccountNotice({
        type: "error",
        title: "Account not found",
        message: "No saved account matches that email or phone number.",
        field: "forgot-contact",
      });
      return;
    }

    showAccountNotice({
      type: "success",
      title: "Account found",
      message: "This contact matches your saved SHOW OFF account.",
      field: "forgot-contact",
    });
  };

  const logoutCustomer = () => {
    window.localStorage.removeItem(customerStorageKey);
    setCustomer(null);
    setAccountDraft({ name: "", email: "", phone: "", address: "" });
    changeAccountMode("login");
    setProfileEditing(false);
    window.dispatchEvent(new CustomEvent("showoff-account-updated", { detail: null }));
  };

  const switchLanguage = () => {
    silenceIntroAudio();
    document.body.classList.remove("menu-lock");
    document.body.classList.add("route-exit");

    transitionRef.current = window.setTimeout(() => {
      const nextPath = window.location.pathname.replace(/^\/(en|lo)(?=\/|$)/, `/${nextLocale}`);
      window.location.href = nextPath + window.location.search + window.location.hash;
    }, 520);
  };

  const saveSavedItems = (items: SavedItem[]) => {
    if (items.length === 0) {
      window.localStorage.removeItem(savedStorageKey);
    } else {
      window.localStorage.setItem(savedStorageKey, JSON.stringify(items));
    }

    setSavedItems(items);
    window.dispatchEvent(new CustomEvent("showoff-saved-updated", { detail: items }));
  };

  const removeSavedItem = (targetItem: SavedItem) => {
    saveSavedItems(savedItems.filter((item) => item.slug !== targetItem.slug));
  };

  return (
    <>
      <header className={`topbar topbar-${tone}${hidden && !overlayOpen ? " is-hidden" : ""}`}>
        <div className="navline">
          <div className="nav-left">
            <button className="hamburger" type="button" aria-label="Open menu" aria-expanded={menuOpen} aria-controls="site-menu" onClick={() => setMenuOpen(true)}>
              <span className="hamburger-line hamburger-line-top" />
              <span className="hamburger-line hamburger-line-bottom" />
              {savedQuantity > 0 ? <b className="menu-count">{savedQuantity}</b> : null}
            </button>
            <button
              className={`icon-link alerts nav-alerts${unreadAlertCount > 0 ? " has-unread" : ""}`}
              type="button"
              aria-label={unreadAlertCount > 0 ? `Open alerts, ${unreadAlertCount} unread` : "Open alerts"}
              aria-expanded={activePanel === "alerts"}
              onClick={() => openPanel("alerts")}
            >
              <BellIcon />
              {unreadAlertCount > 0 ? <span className="alerts-count">{unreadAlertCount > 9 ? "9+" : unreadAlertCount}</span> : null}
            </button>
          </div>
          <a className="logo logo-mark" href={`/${locale}`} aria-label="SHOW OFF home" onClick={visitCollection(`/${locale}`)}>
            <span className="show-off-logo-stack" aria-hidden="true">
              <img className="show-off-logo show-off-logo-symbol show-off-logo-light" src="/assets/show-off-symbol-white.png" alt="" />
              <img className="show-off-logo show-off-logo-symbol show-off-logo-dark" src="/assets/show-off-symbol-black.png" alt="" />
              <img className="show-off-logo show-off-logo-wordmark show-off-logo-light" src="/assets/show-off-wordmark-white.png" alt="" />
              <img className="show-off-logo show-off-logo-wordmark show-off-logo-dark" src="/assets/show-off-wordmark-black.png" alt="" />
            </span>
          </a>
          <div className="header-actions" aria-label="Shop actions">
            <button className="icon-link account" type="button" aria-label="Open account" aria-expanded={activePanel === "account"} onClick={() => openPanel("account")} />
            <button className="icon-link bag" type="button" aria-label="Open cart" aria-expanded={activePanel === "cart"} onClick={() => openPanel("cart")}>
              {cartQuantity > 0 ? <span className="cart-count">{cartQuantity}</span> : null}
            </button>
          </div>
        </div>
      </header>

      <div className={`menu-scrim${overlayOpen ? " is-open" : ""}`} onClick={closeOverlays} aria-hidden="true" />
      <aside className={`site-menu${menuOpen ? " is-open" : ""}`} id="site-menu" aria-hidden={!menuOpen} aria-label="Shop menu">
        <div className="menu-shell">
          <div className="menu-top">
            <button className="menu-close" type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu">
              <span aria-hidden="true">{"<-"}</span>
              Close
            </button>
            <div className="menu-icons" aria-label="Menu shortcuts">
              <button className="icon-link bookmark" type="button" aria-label="Open saved items" onClick={() => openPanel("saved")}>
                <BookmarkIcon />
                {savedQuantity > 0 ? <span className="saved-count">{savedQuantity}</span> : null}
              </button>
            </div>
          </div>

          <label className="menu-search">
            <span aria-hidden="true" />
            <input type="search" placeholder="Search for..." />
          </label>

          <div className="menu-categories">
            <p>Shop Categories</p>
            {shopCategories.map((category, index) => {
              const isOpen = openCategory === category.title;

              return (
                <section className={`category-group${isOpen ? " is-open" : ""}`} key={category.title} style={{ "--item-index": index } as MenuItemStyle}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`category-${category.title.replaceAll(" ", "-").toLowerCase()}`}
                    onClick={() => setOpenCategory(isOpen ? "" : category.title)}
                  >
                    <span>{category.title}</span>
                    <i aria-hidden="true" />
                  </button>
                  <div className="category-panel" id={`category-${category.title.replaceAll(" ", "-").toLowerCase()}`}>
                    <a href={`/${locale}/collections/${slugify(category.title)}`} onClick={visitCollection(`/${locale}/collections/${slugify(category.title)}`)}>
                      View All
                    </a>
                    {category.items.map((item) => (
                      <a href={`/${locale}/collections/${slugify(item)}`} key={item} onClick={visitCollection(`/${locale}/collections/${slugify(item)}`)}>
                        {item}
                      </a>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </aside>

      <aside className={`action-panel alerts-panel${activePanel === "alerts" ? " is-open" : ""}`} aria-hidden={activePanel !== "alerts"} aria-label="Order alerts">
        <div className="action-panel-top">
          <p>Alerts</p>
          <button type="button" onClick={() => setActivePanel(null)}>
            Close
          </button>
        </div>
        <div className="alerts-panel-body">
          {unreadOrderAlerts.length > 0 ? (
            <>
              <div className="cart-summary">
                <h2>Order updates</h2>
                <p>{unreadAlertCount > 0 ? `${unreadAlertCount} new update${unreadAlertCount === 1 ? "" : "s"} from the back office.` : "Your latest shipping and delivery updates are here."}</p>
              </div>
              <div className="alerts-list" aria-label="Order notifications">
                {unreadOrderAlerts.map((alert) => {
                  const href = `/${locale}/alerts?alert=${encodeURIComponent(alert.id)}`;

                  return (
                    <a className={`alert-line-item is-${alert.tone} is-${alert.phase} is-unread`} href={href} key={alert.id} onClick={openAlertDetail(href, alert.id)}>
                      <div className="alert-line-marker" aria-hidden="true" />
                      <div className="alert-line-copy">
                        <div>
                          <div className="alert-line-title-row">
                            <strong>{alert.title}</strong>
                            {alert.statusLabel ? <span className={`alert-status-pill ${alert.statusLabel === "Rejected" ? "is-rejected" : "is-approved"}`}>{alert.statusLabel}</span> : null}
                          </div>
                          <small>{alert.meta}</small>
                        </div>
                        <p>{alert.body}</p>
                        {alert.notice ? <span className="alert-pack-note">{alert.notice}</span> : null}
                        {alert.documents.length > 0 ? (
                          <div className="alert-line-images" aria-label="Delivery bill images">
                            {alert.documents.slice(0, 3).map((document, index) => (
                              <img src={document.url} alt={document.name || `Delivery bill ${index + 1}`} key={`${document.url}-${index}`} />
                            ))}
                          </div>
                        ) : null}
                      </div>
                      <span className="alert-line-arrow" aria-hidden="true">›</span>
                    </a>
                  );
                })}
              </div>
              <a className="alerts-inbox-link" href={`/${locale}/alerts`} onClick={openAlertsInbox(`/${locale}/alerts`)}>
                View notification inbox
                <span aria-hidden="true">›</span>
              </a>
            </>
          ) : (
            <>
              <div className="alerts-empty">
                <strong>{orderAlerts.length > 0 ? "No new alerts" : "No alerts yet"}</strong>
                <p>{orderAlerts.length > 0 ? "Everything here has already been read. New order updates will appear here first." : "Your payment approvals, shipping updates, and delivery confirmations will show here once an order moves in the back office."}</p>
              </div>
              <a className="alerts-inbox-link" href={`/${locale}/alerts`} onClick={openAlertsInbox(`/${locale}/alerts`)}>
                View notification inbox
                <span aria-hidden="true">›</span>
              </a>
            </>
          )}
        </div>
      </aside>

      <aside className={`action-panel${activePanel === "account" ? " is-open" : ""}`} aria-hidden={activePanel !== "account"} aria-label="Account">
        <div className="action-panel-top">
          <p>Account</p>
          <button type="button" onClick={() => setActivePanel(null)}>
            Close
          </button>
        </div>
        <div className="account-panel-body">
          {accountNotice ? (
            <div className={`account-status-note is-${accountNotice.type}`} role="status" aria-live="polite">
              <i aria-hidden="true">{accountNotice.type === "success" ? "✓" : "×"}</i>
              <div>
                <strong>{accountNotice.title}</strong>
                <span>{accountNotice.message}</span>
              </div>
            </div>
          ) : null}
          {activeAccountCustomer && showAccountProfile ? (
            <>
              <div className="profile-head">
                <div>
                  <span>Signed in</span>
                </div>
                <h2>{activeAccountCustomer.name || "SHOW OFF Member"}</h2>
                <p>{activeAccountCustomer.email || activeAccountCustomer.phone}</p>
              </div>

              <div className="profile-actions" hidden>
                <button type="button" onClick={switchLanguage}>
                  <span>Language</span>
                  <strong>{`${locale === "en" ? "English" : "ລາວ"} -> ${nextLocale === "en" ? "English" : "ລາວ"}`}</strong>
                </button>
                <button type="button" onClick={() => setActivePanel("saved")}>
                  <span>Saved pieces</span>
                  <strong>{savedQuantity} item{savedQuantity === 1 ? "" : "s"}</strong>
                </button>
              </div>

              <div className="profile-summary" aria-label="Profile details" hidden>
                <dl>
                  <div>
                    <dt>Full name</dt>
                    <dd>{activeAccountCustomer.name || "Not set"}</dd>
                  </div>
                  <div>
                    <dt>Email</dt>
                    <dd>{activeAccountCustomer.email || "Not set"}</dd>
                  </div>
                  <div>
                    <dt>Phone number</dt>
                    <dd>{activeAccountCustomer.phone || "Add phone number"}</dd>
                  </div>
                  <div>
                    <dt>Delivery address</dt>
                    <dd>{activeAccountCustomer.address || "Add delivery address"}</dd>
                  </div>
                </dl>
              </div>

              <form className="account-form profile-form" hidden>
                <label>
                  Phone number
                  <input type="tel" autoComplete="tel" placeholder="020..." value={accountDraft.phone} onChange={(event) => updateAccountDraft({ ...accountDraft, phone: event.target.value })} />
                </label>
                <label>
                  Delivery address
                  <input type="text" autoComplete="street-address" placeholder="Village, district, province" value={accountDraft.address} onChange={(event) => updateAccountDraft({ ...accountDraft, address: event.target.value })} />
                </label>
                <button type="button" onClick={saveCustomerProfile}>
                  Save delivery profile
                </button>
              </form>

              <section className="account-profile-section account-address-section" aria-labelledby="delivery-address-title">
                <div className="account-profile-section-head">
                  <span className="account-profile-section-icon"><LocationIcon /></span>
                  <div>
                    <h3 id="delivery-address-title">Delivery address</h3>
                    <p>Used for every checkout</p>
                  </div>
                  <button className="profile-edit-button" type="button" aria-expanded={profileEditing} onClick={() => setProfileEditing((editing) => !editing)}>
                    <EditIcon />
                    {profileEditing ? "Cancel" : "Edit"}
                  </button>
                </div>

                <form className={`account-form profile-form${profileEditing ? " is-open" : ""}`} aria-hidden={!profileEditing}>
                  <label>
                    Phone number
                    <input type="tel" autoComplete="tel" placeholder="020..." value={accountDraft.phone} onChange={(event) => updateAccountDraft({ ...accountDraft, phone: event.target.value })} />
                  </label>
                  <label>
                    Delivery address
                    <textarea autoComplete="street-address" placeholder="Village, district, province" rows={3} value={accountDraft.address} onChange={(event) => updateAccountDraft({ ...accountDraft, address: event.target.value })} />
                  </label>
                  <button type="button" onClick={saveCustomerProfile}>Save address</button>
                </form>
              </section>

              <section className={`account-profile-section account-orders-section${orderHistoryOpen ? " is-open" : " is-collapsed"}`} aria-labelledby="order-history-title">
                <button className="account-profile-section-head account-orders-toggle" type="button" aria-expanded={orderHistoryOpen} onClick={() => setOrderHistoryOpen((open) => !open)}>
                  <span className="account-profile-section-icon"><OrderIcon /></span>
                  <div>
                    <h3 id="order-history-title">Order history</h3>
                    <p>Approved payments only</p>
                  </div>
                  <span className="account-orders-count">{accountOrders.length}</span>
                </button>

                {orderHistoryOpen && ordersLoading ? (
                  <div className="account-orders-loading" aria-live="polite"><span /><span /></div>
                ) : orderHistoryOpen && accountOrders.length > 0 ? (
                  <div className="account-order-list">
                    {accountOrders.map((order) => (
                      <article className="account-order-item" key={order.id}>
                        <div className="account-order-meta">
                          <div>
                            <strong>{order.order_no}</strong>
                            <time dateTime={order.created_at}>{new Intl.DateTimeFormat(locale === "lo" ? "lo-LA" : "en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(order.created_at))}</time>
                          </div>
                          <span>Approved</span>
                        </div>
                        <ul>
                          {order.order_items.map((item) => {
                            const productHref = `/${locale}/products/${orderItemProductSlug(item)}`;

                            return (
                              <li key={item.id}>
                                <a className="account-order-product-thumb" href={productHref} onClick={visitCollection(productHref)} aria-label={`View ${item.product_name_snapshot}`}>
                                  <img src={item.product_image || "/assets/products-grid.png"} alt={item.product_name_snapshot} />
                                </a>
                                <div>
                                  <a className="account-order-product-link" href={productHref} onClick={visitCollection(productHref)}>
                                    <strong>{item.product_name_snapshot}</strong>
                                    <small>View product</small>
                                  </a>
                                  <span>{item.variant_label_snapshot || item.sku_snapshot || "Standard"}</span>
                                </div>
                                <span>Qty {item.quantity}</span>
                              </li>
                            );
                          })}
                        </ul>
                        <div className="account-order-total"><span>Total</span><strong>{formatAccountPrice(order.final_amount || order.total_amount)}</strong></div>
                      </article>
                    ))}
                  </div>
                ) : orderHistoryOpen ? (
                  <div className="account-orders-empty">
                    <strong>No approved orders yet</strong>
                    <p>Orders appear here after the store approves your payment slip.</p>
                  </div>
                ) : null}
              </section>

              <div className="profile-foot">
                <button className="profile-logout-button" type="button" onClick={logoutCustomer}>
                  <LogoutIcon />
                  Log out
                </button>
              </div>
            </>
          ) : accountMode === "login" ? (
            <>
              <h2>Sign in</h2>
              <p>Access orders, saved pieces, and private drops with your email or phone number.</p>
              <form className="account-form">
                <label className={accountFieldClass("login-contact", isValidContact(accountDraft.email))}>
                  Email or phone number
                  <input type="text" autoComplete="username" placeholder="name@email.com" value={accountDraft.email} onBlur={() => markAccountField("login-contact")} onChange={(event) => updateAccountDraft({ ...accountDraft, email: event.target.value })} />
                  <span className="account-field-icon" aria-hidden="true">{accountFieldClass("login-contact", isValidContact(accountDraft.email)).includes("is-valid") ? "✓" : "×"}</span>
                </label>
                <label className={accountFieldClass("login-password", isValidPassword(accountPassword))}>
                  Password
                  <input type="password" autoComplete="current-password" placeholder="Password" value={accountPassword} onBlur={() => markAccountField("login-password")} onChange={(event) => { setAccountPassword(event.target.value); setAccountNotice(null); }} />
                  <span className="account-field-icon" aria-hidden="true">{accountFieldClass("login-password", isValidPassword(accountPassword)).includes("is-valid") ? "✓" : "×"}</span>
                </label>
                <button type="button" onClick={handleLogin}>
                  Sign in
                </button>
              </form>
              <div className="account-switch">
                <button type="button" onClick={() => changeAccountMode("forgot")}>Forgot password?</button>
                <button type="button" onClick={() => changeAccountMode("register")}>
                  Create account
                </button>
              </div>
            </>
          ) : accountMode === "forgot" ? (
            <>
              <h2>Forgot password</h2>
              <p>Check the email or phone number saved on your SHOW OFF account.</p>
              <form className="account-form">
                <label className={accountFieldClass("forgot-contact", isValidContact(accountDraft.email))}>
                  Email or phone number
                  <input type="text" autoComplete="username" placeholder="name@email.com" value={accountDraft.email} onBlur={() => markAccountField("forgot-contact")} onChange={(event) => updateAccountDraft({ ...accountDraft, email: event.target.value })} />
                  <span className="account-field-icon" aria-hidden="true">{accountFieldClass("forgot-contact", isValidContact(accountDraft.email)).includes("is-valid") ? "✓" : "×"}</span>
                </label>
                <button type="button" onClick={handleForgotPassword}>
                  Check account
                </button>
              </form>
              <div className="account-switch">
                <button type="button" onClick={() => changeAccountMode("login")}>Back to sign in</button>
                <button type="button" onClick={() => changeAccountMode("register")}>Create account</button>
              </div>
            </>
          ) : (
            <>
              <h2>Create account</h2>
              <p>Start with the essentials. Shipping details can be added when you checkout.</p>
              <form className="account-form">
                <label className={accountFieldClass("register-name", accountDraft.name.trim().length > 0)}>
                  Full name
                  <input type="text" autoComplete="name" placeholder="Your name" value={accountDraft.name} onBlur={() => markAccountField("register-name")} onChange={(event) => updateAccountDraft({ ...accountDraft, name: event.target.value })} />
                  <span className="account-field-icon" aria-hidden="true">{accountFieldClass("register-name", accountDraft.name.trim().length > 0).includes("is-valid") ? "✓" : "×"}</span>
                </label>
                <label className={accountFieldClass("register-email", isValidEmail(accountDraft.email))}>
                  Email
                  <input type="email" autoComplete="email" placeholder="name@email.com" value={accountDraft.email} onBlur={() => markAccountField("register-email")} onChange={(event) => updateAccountDraft({ ...accountDraft, email: event.target.value })} />
                  <span className="account-field-icon" aria-hidden="true">{accountFieldClass("register-email", isValidEmail(accountDraft.email)).includes("is-valid") ? "✓" : "×"}</span>
                </label>
                <label className={accountFieldClass("register-password", isValidPassword(accountPassword))}>
                  Password
                  <input type="password" autoComplete="new-password" placeholder="Create password" value={accountPassword} onBlur={() => markAccountField("register-password")} onChange={(event) => { setAccountPassword(event.target.value); setAccountNotice(null); }} />
                  <span className="account-field-icon" aria-hidden="true">{accountFieldClass("register-password", isValidPassword(accountPassword)).includes("is-valid") ? "✓" : "×"}</span>
                </label>
                <label className={accountFieldClass("register-phone", isValidPhone(accountDraft.phone))}>
                  Phone number
                  <input type="tel" autoComplete="tel" placeholder="020..." value={accountDraft.phone} onBlur={() => markAccountField("register-phone")} onChange={(event) => updateAccountDraft({ ...accountDraft, phone: event.target.value })} />
                  <span className="account-field-icon" aria-hidden="true">{accountFieldClass("register-phone", isValidPhone(accountDraft.phone)).includes("is-valid") ? "✓" : "×"}</span>
                </label>
                <label className={accountFieldClass("register-address", accountDraft.address.trim().length > 0)}>
                  Delivery address
                  <input type="text" autoComplete="street-address" placeholder="Village, district, province" value={accountDraft.address} onBlur={() => markAccountField("register-address")} onChange={(event) => updateAccountDraft({ ...accountDraft, address: event.target.value })} />
                  <span className="account-field-icon" aria-hidden="true">{accountFieldClass("register-address", accountDraft.address.trim().length > 0).includes("is-valid") ? "✓" : "×"}</span>
                </label>
                <button type="button" onClick={handleRegister}>
                  Create account
                </button>
              </form>
              <div className="account-switch">
                <span>Already have an account?</span>
                <button type="button" onClick={() => changeAccountMode("login")}>
                  Sign in
                </button>
              </div>
            </>
          )}
        </div>
      </aside>

      <aside className={`action-panel cart-panel${activePanel === "cart" ? " is-open" : ""}`} aria-hidden={activePanel !== "cart"} aria-label="Shopping cart">
        <div className="action-panel-top">
          <p>Cart</p>
          <button type="button" onClick={() => setActivePanel(null)}>
            Close
          </button>
        </div>
        <div className="cart-panel-body">
          {cartItems.length > 0 ? (
            <>
              <div className="cart-summary">
                <h2>Your cart</h2>
                <p>{cartQuantity} item{cartQuantity === 1 ? "" : "s"} ready for checkout.</p>
              </div>
              <div className="cart-items" aria-label="Cart items">
                {cartItems.map((item) => (
                  <div className="cart-line-item" key={`${item.slug}-${item.size}-${item.color}`}>
                    <img src={item.image} alt={item.name} />
                    <div className="cart-line-copy">
                      <strong>{item.name}</strong>
                      <span>
                        {item.size} / {item.color}
                      </span>
                      <div className="cart-quantity" aria-label={`Quantity for ${item.name}`}>
                        <button type="button" aria-label={`Remove one ${item.name}`} onClick={() => updateCartQuantity(item, item.quantity - 1)}>
                          -
                        </button>
                        <input
                          aria-label={`Quantity for ${item.name}`}
                          inputMode="numeric"
                          min="1"
                          max={typeof item.stock === "number" ? Math.max(1, item.stock) : 99}
                          type="number"
                          value={item.quantity}
                          onChange={(event) => updateCartQuantity(item, Number(event.target.value))}
                        />
                        <button type="button" aria-label={`Add one ${item.name}`} disabled={typeof item.stock === "number" && item.quantity >= item.stock} onClick={() => updateCartQuantity(item, item.quantity + 1)}>
                          +
                        </button>
                      </div>
                    </div>
                    <div className="cart-line-side">
                      <em>{formatCartLinePrice(item)}</em>
                      <div className="cart-line-actions" aria-label={`Actions for ${item.name}`}>
                        <button className="cart-remove" type="button" aria-label={`Remove ${item.name}`} onClick={() => removeCartItem(item)} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="cart-actions">
                <button className="cart-checkout-action" type="button" aria-label="Go to checkout" onClick={goToCheckout}>
                  <span>Express checkout</span>
                </button>
                <button className="cart-clear-action" type="button" aria-label="Clear cart" onClick={clearCart}>
                  <ClearCartIcon />
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="cart-empty-mark" aria-hidden="true">
                <span />
              </div>
              <h2>Your cart is empty</h2>
              <p>Add a piece from the latest collection and it will wait here.</p>
              <a href={`/${locale}/collections/hoodies`} onClick={visitCollection(`/${locale}/collections/hoodies`)}>
                Shop hoodies
              </a>
            </>
          )}
        </div>
      </aside>

      <aside className={`action-panel saved-panel${activePanel === "saved" ? " is-open" : ""}`} aria-hidden={activePanel !== "saved"} aria-label="Saved items">
        <div className="action-panel-top">
          <p>Saved</p>
          <button type="button" onClick={() => setActivePanel(null)}>
            Close
          </button>
        </div>
        <div className="saved-panel-body">
          {savedItems.length > 0 ? (
            <>
              <div className="cart-summary">
                <h2>Saved pieces</h2>
                <p>{savedItems.length} item{savedItems.length === 1 ? "" : "s"} kept for later.</p>
              </div>
              <div className="saved-items" aria-label="Saved items">
                {savedItems.map((item) => (
                  <div className="saved-line-item" key={item.slug}>
                    <a href={`/${locale}/products/${item.slug}`} onClick={visitCollection(`/${locale}/products/${item.slug}`)}>
                      <img src={item.image} alt={item.name} />
                      <span>
                        <strong>{item.name}</strong>
                        <small>{item.color}</small>
                      </span>
                    </a>
                    <em>{formatStoredThbPrice(item.price)}</em>
                    <button type="button" aria-label={`Remove ${item.name} from saved items`} onClick={() => removeSavedItem(item)} />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <h2>No saved pieces</h2>
              <p>Tap the bookmark on a product and it will wait here.</p>
              <a className="saved-empty-link" href={`/${locale}/collections/t-shirts`} onClick={visitCollection(`/${locale}/collections/t-shirts`)}>
                Shop T-Shirts
              </a>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
