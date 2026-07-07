import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { unstable_noStore as noStore } from "next/cache";
import { getAdminCustomers, getAdminOrders, getAdminProducts } from "../lib/admin/data";
import { getAdminSession } from "../lib/admin/auth";
import { shopCategories } from "../lib/shop";
import styles from "./AdminStaticFrame.module.css";

type Relation<T> = T | T[] | null | undefined;

function firstRelation<T>(value: Relation<T>): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function numberValue(value: unknown, fallback = 0) {
  const numeric = Number(value ?? fallback);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function cleanScriptJson(value: unknown) {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}

function sourceToChannel(source: unknown, chatChannel?: unknown) {
  if (source === "chat") return chatChannel === "walk-in" ? "walk-in" : "chat";
  return "web";
}

function paymentStatus(status: unknown) {
  if (status === "paid" || status === "approved" || status === "verified") return "paid";
  if (status === "rejected") return "rejected";
  if (status === "cancelled") return "cancelled";
  if (status === "pending") return "pending_review";
  return "waiting_slip";
}

function mapOrders(rows: any[]) {
  return rows.map((order, index) => {
    const customer = firstRelation(order.customers);
    const payment = firstRelation(order.payments);
    const shipment = firstRelation(order.shipments);
    const items = Array.isArray(order.order_items) ? order.order_items : [];
    const totalAmount = numberValue(order.final_amount || order.total_amount || payment?.amount);

    return {
      id: order.id ?? `order-${index}`,
      orderNumber: order.order_no ?? `SO-${index + 1}`,
      channel: sourceToChannel(order.source, order.chat_channel),
      status: order.status ?? "pending",
      paymentStatus: paymentStatus(payment?.status ?? order.payment_status ?? order.status),
      shippingStatus: shipment?.status ?? order.shipping_status ?? "not_shipped",
      customerName: customer?.name ?? "Walk-in Customer",
      customerPhone: customer?.phone ?? "-",
      customerEmail: customer?.email ?? undefined,
      shippingAddress: order.shipping_address ?? "-",
      items: items.map((item: any, itemIndex: number) => {
        const quantity = numberValue(item.quantity, 1);
        const unitPrice = numberValue(item.unit_price);
        return {
          id: item.id ?? `${order.id}-item-${itemIndex}`,
          productId: item.product_id ?? item.id ?? `${order.id}-product-${itemIndex}`,
          productName: item.product_name_snapshot ?? "SHOW OFF item",
          productImage: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=80",
          sku: item.sku_snapshot ?? "-",
          variant: item.variant_label_snapshot ?? "-",
          quantity,
          unitPrice,
          discount: 0,
          lineTotal: numberValue(item.line_total, unitPrice * quantity),
        };
      }),
      subtotal: totalAmount,
      discount: 0,
      shippingFee: 0,
      totalAmount,
      paymentCurrency: "LAK",
      paymentMethod: payment?.payment_method ?? "bank_transfer",
      carrier: shipment?.carrier ?? undefined,
      trackingNumber: shipment?.tracking_number ?? undefined,
      shippingDocuments: Array.isArray(shipment?.document_images) ? shipment.document_images : [],
      createdAt: order.created_at ?? new Date().toISOString(),
      createdBy: order.source === "chat" ? "admin" : "web",
      timeline: [
        {
          id: `${order.id}-created`,
          event: "ສ້າງອໍເດີ",
          createdAt: order.created_at ?? new Date().toISOString(),
          by: customer?.name ?? "ລະບົບ",
        },
      ],
    };
  });
}

function mapProducts(rows: any[]) {
  return rows.map((product, index) => {
    const variants = Array.isArray(product.product_variants) ? product.product_variants : [];
    const images = Array.isArray(product.product_images) ? product.product_images : [];
    const stock = numberValue(product.stock_qty, variants.reduce((sum: number, item: any) => sum + numberValue(item.stock_qty), 0));
    const salePrice = numberValue(product.sale_price);
    const costPrice = numberValue(product.cost_price);
    const sortedImages = [...images].sort((a, b) => numberValue(a.sort_order) - numberValue(b.sort_order));
    const mappedImages = sortedImages.map((image: any, imageIndex: number) => ({
      id: image.id ?? `${product.id ?? index}-image-${imageIndex}`,
      url: image.path || "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400",
      isPrimary: Boolean(image.is_primary) || imageIndex === 0,
      altText: image.alt_text ?? product.name_en ?? product.sku ?? "SHOW OFF product",
    }));

    return {
      id: product.id ?? `product-${index}`,
      nameTh: product.name_lo ?? product.name_en ?? product.sku ?? "SHOW OFF product",
      nameEn: product.name_en ?? product.name_lo ?? product.sku ?? "SHOW OFF product",
      nameLo: product.name_lo ?? undefined,
      sku: product.sku ?? `SKU-${index + 1}`,
      slug: product.slug ?? product.id ?? `product-${index}`,
      category: firstRelation(product.categories)?.name_en ?? "SHOW OFF",
      status: product.status === "active" ? "active" : "hidden",
      descriptionEn: product.description_en ?? "",
      descriptionLo: product.description_lo ?? "",
      images: mappedImages.length
        ? mappedImages
        : [
            {
              id: `${product.id ?? index}-image`,
              url: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400",
              isPrimary: true,
              altText: product.name_en ?? product.sku ?? "SHOW OFF product",
            },
          ],
      variants: variants.map((variant: any, variantIndex: number) => ({
        id: variant.id ?? `${product.id}-variant-${variantIndex}`,
        sku: variant.sku ?? product.sku ?? "-",
        sizeLabel: variant.size_label ?? "-",
        colorName: variant.color_name ?? "-",
        colorHex: variant.color_hex ?? "#111111",
        optionLabel: variant.option_label ?? ([variant.color_name, variant.size_label].filter(Boolean).join(" / ") || variant.sku || "-"),
        salePrice: numberValue(variant.sale_price, salePrice),
        costPrice: numberValue(variant.cost_price, costPrice),
        stock: numberValue(variant.stock_qty),
        minimumStock: numberValue(variant.min_stock_qty, 5),
        status: variant.status === "active" ? "active" : "inactive",
      })),
      salePrice,
      costPrice,
      stock,
      minimumStock: numberValue(product.min_stock_qty, 5),
      createdAt: product.created_at ?? new Date().toISOString(),
    };
  });
}

function mapCustomers(rows: any[]) {
  return rows.map((customer, index) => {
    const orders = Array.isArray(customer.orders) ? customer.orders : [];
    const totalSpent = orders.reduce((sum: number, order: any) => sum + numberValue(order.final_amount || order.total_amount), 0);

    return {
      id: customer.id ?? `customer-${index}`,
      name: customer.name ?? "SHOW OFF Customer",
      phone: customer.phone ?? "-",
      email: customer.email ?? undefined,
      type: customer.customer_type ?? "retail",
      isVip: Boolean(customer.is_vip_manual || customer.vip_flag),
      totalOrders: orders.length,
      totalSpent,
      lastOrderDate: orders[0]?.created_at ?? undefined,
      addresses: [
        {
          id: `${customer.id ?? index}-address`,
          label: "Default",
          address: customer.default_address ?? "-",
          isDefault: true,
        },
      ],
      notes: "",
      createdAt: customer.created_at ?? new Date().toISOString(),
    };
  });
}

const storefrontCategories = shopCategories.flatMap((category) => category.items);

type AdminStaticFrameProps = {
  initialPage?: string;
  initialSelectedId?: string;
};

function adminStaticSrc(props: AdminStaticFrameProps) {
  const params = new URLSearchParams();
  params.set("initialPage", props.initialPage ?? "dashboard");

  if (props.initialSelectedId) {
    params.set("initialSelectedId", props.initialSelectedId);
  }

  return `/admin-static/index.html?${params.toString()}`;
}

async function buildInlineAdminData(props: AdminStaticFrameProps = {}) {
  const [session, ordersResult, productsResult, customersResult] = await Promise.all([
    getAdminSession(),
    getAdminOrders(),
    getAdminProducts(),
    getAdminCustomers(),
  ]);
  const currentUser = {
    id: session?.userId ?? "admin",
    name: session?.displayName ?? "SHOW OFF Admin",
    email: session?.email ?? "admin@showoff.la",
    role: session?.role ?? "owner",
    status: "active",
    lastLogin: new Date().toISOString(),
  };

  return {
    currentUser,
    adminUsers: [currentUser],
    orders: mapOrders(ordersResult.orders),
    products: mapProducts(productsResult.products),
    customers: mapCustomers(customersResult.customers),
    expenses: [],
    storefrontCategories,
    initialPage: props.initialPage ?? "dashboard",
    initialSelectedId: props.initialSelectedId ?? null,
  };
}

async function adminHtml(props: AdminStaticFrameProps = {}) {
  const indexPath = join(process.cwd(), "public", "admin-static", "index.html");
  const [html, data] = await Promise.all([
    readFile(indexPath, "utf8"),
    buildInlineAdminData(props).catch((error) => {
      console.error("Admin reference inline data failed", error);
      return {
        initialPage: props.initialPage ?? "dashboard",
        initialSelectedId: props.initialSelectedId ?? null,
      };
    }),
  ]);
  const dataScript = `<script>window.__SHOW_OFF_ADMIN_DATA__=${cleanScriptJson(data)};</script>`;
  const baseTag = '<base href="/" />';

  return html
    .replace(/<script src="\/api\/admin\/reference-data"><\/script>\s*/g, "")
    .replace("<head>", `<head>${baseTag}`)
    .replace(/(<script type="module"[^>]+><\/script>)/, `${dataScript}\n      $1`);
}

export async function AdminStaticFrame(props: AdminStaticFrameProps) {
  noStore();
  const src = adminStaticSrc(props);

  return (
    <main className={styles.screen}>
      <iframe
        className={styles.frame}
        key={src}
        src={src}
        title="SHOW OFF Admin"
      />
    </main>
  );
}
