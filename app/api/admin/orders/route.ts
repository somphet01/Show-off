import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getAdminSession } from "../../../lib/admin/auth";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

type OrderLinePayload = {
  productId?: string;
  variantId?: string;
  quantity?: number;
};

type CreateOrderPayload = {
  source?: "chat" | "walk-in";
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  shippingAddress?: string;
  lines?: OrderLinePayload[];
  discountTotal?: number;
  shippingFee?: number;
  paymentMethod?: string;
  note?: string;
};

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function numberValue(value: unknown, fallback = 0) {
  const numeric = Number(value ?? fallback);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function makeOrderNo() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const time = now.toISOString().slice(11, 19).replace(/:/g, "");
  const suffix = Math.random().toString(16).slice(2, 6).toUpperCase();

  return `SO-${date}-${time}-${suffix}`;
}

function sourceToChannel(source: unknown, chatChannel?: unknown) {
  if (source === "chat") return chatChannel === "walk-in" ? "walk-in" : "chat";
  return "web";
}

function orderStatus(status: unknown) {
  if (status === "paid") return "paid";
  if (status === "cancelled") return "cancelled";
  if (status === "awaiting_confirmation") return "awaiting_confirmation";
  if (status === "awaiting_payment_slip") return "awaiting_payment_slip";
  return "pending";
}

function paymentStatus(status: unknown) {
  if (status === "paid" || status === "approved" || status === "verified") return "paid";
  if (status === "rejected") return "rejected";
  if (status === "cancelled") return "cancelled";
  if (status === "pending") return "pending_review";
  return "waiting_slip";
}

function shippingStatus(status: unknown) {
  if (status === "delivered") return "delivered";
  if (status === "shipping" || status === "shipped") return "shipping";
  return "not_shipped";
}

function imageForProduct(product: any) {
  const images = Array.isArray(product.product_images) ? product.product_images : [];
  const primary = [...images].sort((a, b) => numberValue(a.sort_order) - numberValue(b.sort_order))[0];
  return primary?.path || "";
}

function mapCreatedOrder(order: any, productImages: Map<string, string>, createdBy: string) {
  const customer = Array.isArray(order.customers) ? order.customers[0] : order.customers;
  const payment = Array.isArray(order.payments) ? order.payments[0] : order.payments;
  const shipment = Array.isArray(order.shipments) ? order.shipments[0] : order.shipments;
  const items = Array.isArray(order.order_items) ? order.order_items : [];
  const totalAmount = numberValue(order.final_amount || order.total_amount || payment?.amount);

  return {
    id: order.id,
    orderNumber: order.order_no,
    channel: sourceToChannel(order.source, order.chat_channel),
    status: orderStatus(order.status),
    paymentStatus: paymentStatus(payment?.status ?? order.payment_status ?? order.status),
    shippingStatus: shippingStatus(shipment?.status ?? order.shipping_status),
    customerName: customer?.name ?? "Walk-in Customer",
    customerPhone: customer?.phone ?? "-",
    customerEmail: customer?.email ?? undefined,
    shippingAddress: order.shipping_address ?? "-",
    items: items.map((item: any) => {
      const quantity = numberValue(item.quantity, 1);
      const unitPrice = numberValue(item.unit_price);
      return {
        id: item.id,
        productId: item.product_id,
        productName: item.product_name_snapshot ?? "SHOW OFF item",
        productImage: productImages.get(item.product_id) ?? "",
        sku: item.sku_snapshot ?? "-",
        variant: item.variant_label_snapshot ?? "-",
        quantity,
        unitPrice,
        discount: 0,
        lineTotal: numberValue(item.line_total, unitPrice * quantity),
      };
    }),
    subtotal: numberValue(order.subtotal, totalAmount),
    discount: numberValue(order.discount_total),
    shippingFee: numberValue(order.shipping_fee),
    totalAmount,
    paymentCurrency: order.payment_currency === "THB" ? "THB" : "LAK",
    exchangeRate: numberValue(order.exchange_rate, 1),
    paymentAmount: numberValue(order.payment_amount, totalAmount),
    paymentMethod: payment?.payment_method ?? order.payment_method ?? "bank_transfer",
    carrier: shipment?.carrier ?? undefined,
    trackingNumber: shipment?.tracking_number ?? undefined,
    shippingDocuments: Array.isArray(shipment?.document_images) ? shipment.document_images : [],
    createdAt: order.created_at ?? new Date().toISOString(),
    createdBy,
    timeline: [
      {
        id: `${order.id}-created`,
        event: "ສ້າງອໍເດີ",
        detail: "ສ້າງຈາກຫຼັງບ້ານ",
        createdAt: order.created_at ?? new Date().toISOString(),
        by: createdBy,
      },
    ],
  };
}

export async function POST(request: Request) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json().catch(() => ({}))) as CreateOrderPayload;
  const customerName = cleanText(payload.customerName);
  const customerPhone = cleanText(payload.customerPhone);
  const customerEmail = cleanText(payload.customerEmail);
  const shippingAddress = cleanText(payload.shippingAddress);
  const orderChannel = payload.source === "walk-in" ? "walk-in" : "chat";
  const source = "chat";
  const discountTotal = Math.max(numberValue(payload.discountTotal), 0);
  const shippingFee = Math.max(numberValue(payload.shippingFee), 0);
  const paymentMethod = cleanText(payload.paymentMethod) || "bank_transfer";
  const note = cleanText(payload.note);
  const lines = (Array.isArray(payload.lines) ? payload.lines : [])
    .map((line) => ({
      productId: cleanText(line.productId),
      variantId: cleanText(line.variantId),
      quantity: Math.max(Math.trunc(numberValue(line.quantity, 1)), 1),
    }))
    .filter((line) => line.productId && line.variantId);

  if (!customerName || lines.length === 0) {
    return NextResponse.json({ error: "Please add customer name and at least one product." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const productIds = Array.from(new Set(lines.map((line) => line.productId)));
  const variantIds = Array.from(new Set(lines.map((line) => line.variantId)));

  const { data: products, error: productError } = await supabase
    .from("products")
    .select("id,sku,name_en,name_lo,sale_price,cost_price,product_images(path,sort_order,is_primary)")
    .in("id", productIds);

  if (productError) {
    return NextResponse.json({ error: productError.message || "Failed to read products." }, { status: 400 });
  }

  const { data: variants, error: variantError } = await supabase
    .from("product_variants")
    .select("id,product_id,sku,size_label,color_name,option_label,sale_price,cost_price,stock_qty,status")
    .in("id", variantIds);

  if (variantError) {
    return NextResponse.json({ error: variantError.message || "Failed to read variants." }, { status: 400 });
  }

  const productsById = new Map((products ?? []).map((product: any) => [product.id, product]));
  const variantsById = new Map((variants ?? []).map((variant: any) => [variant.id, variant]));
  const productImages = new Map((products ?? []).map((product: any) => [product.id, imageForProduct(product)]));

  try {
    const orderItems = lines.map((line) => {
      const product = productsById.get(line.productId);
      const variant = variantsById.get(line.variantId);

      if (!product || !variant || variant.product_id !== line.productId) {
        throw new Error("Product or variant not found.");
      }

      if (variant.status !== "active") {
        throw new Error(`Variant is inactive: ${variant.sku}`);
      }

      const stock = numberValue(variant.stock_qty);
      if (line.quantity > stock) {
        throw new Error(`Stock is not enough for ${variant.sku}. Available: ${stock}`);
      }

      const unitPrice = numberValue(variant.sale_price, numberValue(product.sale_price));
      if (unitPrice <= 0) {
        throw new Error(`Missing sale price for ${variant.sku}.`);
      }

      return {
        product,
        variant,
        quantity: line.quantity,
        unitPrice,
        unitCost: numberValue(variant.cost_price, numberValue(product.cost_price)),
        variantLabel: variant.option_label || [variant.color_name, variant.size_label].filter(Boolean).join(" / ") || null,
      };
    });

    const subtotal = orderItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const totalAmount = Math.max(subtotal - discountTotal + shippingFee, 0);

    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .insert({
        name: customerName,
        phone: customerPhone || null,
        email: customerEmail || null,
        default_address: shippingAddress || null,
        notes: "Created from admin manual order.",
      })
      .select("id")
      .single<{ id: string }>();

    if (customerError || !customer) {
      return NextResponse.json({ error: customerError?.message || "Failed to create customer." }, { status: 400 });
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_no: makeOrderNo(),
        source,
        chat_channel: orderChannel,
        customer_id: customer.id,
        created_by: session.userId,
        subtotal,
        shipping_fee: shippingFee,
        discount_total: discountTotal,
        total_amount: subtotal + shippingFee,
        final_amount: totalAmount,
        payment_amount: totalAmount,
        payment_currency: "LAK",
        exchange_rate: 1,
        payment_method: paymentMethod,
        payment_status: "paid",
        fulfillment_status: orderChannel === "walk-in" ? "delivered" : "ready_to_ship",
        status: "paid",
        shipping_status: "not_shipped",
        shipping_address: shippingAddress || null,
        notes: note || null,
      })
      .select("id")
      .single<{ id: string }>();

    if (orderError || !order) {
      return NextResponse.json({ error: orderError?.message || "Failed to create order." }, { status: 400 });
    }

    const itemRows = orderItems.map((item) => ({
      order_id: order.id,
      product_id: item.product.id,
      product_variant_id: item.variant.id,
      sku_snapshot: item.variant.sku,
      product_name_snapshot: item.product.name_lo || item.product.name_en || item.product.sku,
      variant_label_snapshot: item.variantLabel,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      unit_cost: item.unitCost,
    }));

    const { error: itemError } = await supabase.from("order_items").insert(itemRows);

    if (itemError) {
      return NextResponse.json({ error: itemError.message || "Failed to create order items." }, { status: 400 });
    }

    await supabase.from("payments").insert({
      order_id: order.id,
      amount: totalAmount,
      settlement_amount: totalAmount,
      currency: "LAK",
      exchange_rate: 1,
      payment_method: paymentMethod,
      status: "verified",
      verified_by: session.userId,
      verified_at: new Date().toISOString(),
      note: "Created with admin create order.",
    });

    await supabase.from("shipments").insert({
      order_id: order.id,
      status: "not_shipped",
      created_by: session.userId,
    });

    const { data: createdOrder, error: createdOrderError } = await supabase
      .from("orders")
      .select(
        "id,order_no,source,chat_channel,status,shipping_status,payment_status,fulfillment_status,shipping_address,subtotal,shipping_fee,discount_total,final_amount,total_amount,payment_currency,exchange_rate,payment_amount,payment_method,created_at,customers(name,phone,email),payments(id,status,amount,payment_method),shipments(tracking_number,carrier,status,document_images),order_items(id,product_id,sku_snapshot,product_name_snapshot,variant_label_snapshot,quantity,unit_price,line_total)",
      )
      .eq("id", order.id)
      .single<any>();

    if (createdOrderError || !createdOrder) {
      return NextResponse.json({ error: createdOrderError?.message || "Order created but failed to reload." }, { status: 400 });
    }

    revalidatePath("/admin");
    revalidatePath("/admin/orders");
    revalidatePath("/admin/inventory");
    revalidatePath("/en");
    revalidatePath("/lo");

    return NextResponse.json({
      order: mapCreatedOrder(createdOrder, productImages, session.displayName ?? session.email ?? "Admin"),
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to create order." }, { status: 400 });
  }
}
