"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "../lib/admin/auth";
import { createSupabaseServerClient } from "../lib/supabase/server";

export type AdminLoginState = {
  error?: string;
};

const ordersPath = "/admin/orders";
const settingsPath = "/admin/settings";
const inventoryAdjustmentPath = "/admin/inventory/stock-adjustment";
const inventoryPath = "/admin/inventory";

type StockTarget = {
  productId: string;
  variantId: string | null;
};

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function readPositiveNumber(formData: FormData, key: string) {
  const value = Number(formData.get(key));
  return Number.isFinite(value) && value > 0 ? value : null;
}

function readNonNegativeNumber(formData: FormData, key: string) {
  const value = Number(formData.get(key));
  return Number.isFinite(value) && value >= 0 ? value : null;
}

function parseStockTarget(value: string): StockTarget | null {
  const [productId, variantId = ""] = value.split("|");

  if (!productId) {
    return null;
  }

  return {
    productId,
    variantId: variantId || null,
  };
}

function makeOrderNo() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const time = now.toISOString().slice(11, 19).replace(/:/g, "");
  const suffix = Math.random().toString(16).slice(2, 6).toUpperCase();

  return `SO-${date}-${time}-${suffix}`;
}

export async function updatePaymentSettings(formData: FormData) {
  const session = await requireAdminSession();

  if (session.role !== "owner") {
    redirect(`${settingsPath}?payment=forbidden`);
  }

  const thbToLakRate = Number(formData.get("thbToLakRate"));
  const qrThbUrl = String(formData.get("qrThbUrl") ?? "").trim();
  const qrLakUrl = String(formData.get("qrLakUrl") ?? "").trim();

  if (!Number.isFinite(thbToLakRate) || thbToLakRate <= 0) {
    redirect(`${settingsPath}?payment=invalid-rate`);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("storefront_payment_settings")
    .update({
      thb_to_lak_rate: thbToLakRate,
      qr_thb_url: qrThbUrl || null,
      qr_lak_url: qrLakUrl || null,
    })
    .eq("id", "main");

  if (error) {
    redirect(`${settingsPath}?payment=failed`);
  }

  revalidatePath(settingsPath);
  revalidatePath("/en");
  revalidatePath("/lo");
  revalidatePath("/en/collections/[slug]", "page");
  revalidatePath("/lo/collections/[slug]", "page");
  revalidatePath("/en/products/[slug]", "page");
  revalidatePath("/lo/products/[slug]", "page");
  revalidatePath("/en/checkout");
  revalidatePath("/lo/checkout");
  redirect(`${settingsPath}?payment=saved`);
}

export async function signInAdmin(_state: AdminLoginState, formData: FormData): Promise<AdminLoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "ກະລຸນາໃສ່ອີເມວ ແລະ ລະຫັດຜ່ານ." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "ເຂົ້າລະບົບບໍ່ສຳເລັດ. ກະລຸນາກວດອີເມວ ແລະ ລະຫັດຜ່ານອີກຄັ້ງ." };
  }

  redirect("/admin");
}

export async function signOutAdmin() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function approvePaymentSlip(formData: FormData) {
  await requireAdminSession();

  const orderId = String(formData.get("orderId") ?? "");
  const slipId = String(formData.get("slipId") ?? "");

  if (!orderId || !slipId) {
    throw new Error("Missing order or slip id.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("admin_approve_payment_slip", {
    target_order_id: orderId,
    target_slip_id: slipId,
  });

  if (error) {
    redirect(`${ordersPath}?review=already-reviewed`);
  }

  revalidatePath("/admin");
  revalidatePath(ordersPath);
  redirect(`${ordersPath}?review=approved`);
}

export async function rejectPaymentSlip(formData: FormData) {
  await requireAdminSession();

  const orderId = String(formData.get("orderId") ?? "");
  const slipId = String(formData.get("slipId") ?? "");
  const reason = String(formData.get("reason") ?? "Rejected from admin review");

  if (!orderId || !slipId) {
    throw new Error("Missing order or slip id.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("admin_reject_payment_slip", {
    target_order_id: orderId,
    target_slip_id: slipId,
    reason,
  });

  if (error) {
    redirect(`${ordersPath}?review=already-reviewed`);
  }

  revalidatePath("/admin");
  revalidatePath(ordersPath);
  redirect(`${ordersPath}?review=rejected`);
}

export async function updateOrderShipping(formData: FormData) {
  await requireAdminSession();

  const orderId = String(formData.get("orderId") ?? "");
  const status = String(formData.get("status") ?? "");
  const carrier = String(formData.get("carrier") ?? "");
  const trackingNumber = String(formData.get("trackingNumber") ?? "");

  if (!orderId || !["not_shipped", "shipping", "delivered"].includes(status)) {
    throw new Error("Missing order id or invalid shipping status.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("admin_update_order_shipping", {
    target_order_id: orderId,
    next_status: status,
    next_carrier: carrier,
    next_tracking_number: trackingNumber,
  });

  if (error) {
    redirect(`${ordersPath}?shipping=failed`);
  }

  revalidatePath("/admin");
  revalidatePath(ordersPath);
  redirect(`${ordersPath}?shipping=updated`);
}

export async function adjustInventoryStock(formData: FormData) {
  const session = await requireAdminSession();
  const target = parseStockTarget(readText(formData, "stockTarget"));
  const adjustmentType = readText(formData, "adjustmentType");
  const quantity = readNonNegativeNumber(formData, "quantity");
  const note = readText(formData, "note");

  if (!target || quantity === null || !["increase", "decrease", "set"].includes(adjustmentType)) {
    redirect(`${inventoryAdjustmentPath}?stock=invalid`);
  }

  const supabase = await createSupabaseServerClient();
  const tableName = target.variantId ? "product_variants" : "products";
  const rowId = target.variantId ?? target.productId;

  const { data: stockRow, error: stockError } = await supabase
    .from(tableName)
    .select("stock_qty")
    .eq("id", rowId)
    .maybeSingle<{ stock_qty: number | null }>();

  if (stockError || !stockRow) {
    redirect(`${inventoryAdjustmentPath}?stock=missing`);
  }

  const currentStock = stockRow.stock_qty ?? 0;
  const nextStock =
    adjustmentType === "increase"
      ? currentStock + quantity
      : adjustmentType === "decrease"
        ? currentStock - quantity
        : quantity;

  if (nextStock < 0) {
    redirect(`${inventoryAdjustmentPath}?stock=negative`);
  }

  const { error: updateError } = await supabase.from(tableName).update({ stock_qty: nextStock, updated_at: new Date().toISOString() }).eq("id", rowId);

  if (updateError) {
    redirect(`${inventoryAdjustmentPath}?stock=failed`);
  }

  const { error: movementError } = await supabase.from("inventory_movements").insert({
    product_id: target.productId,
    product_variant_id: target.variantId,
    movement_type: "manual_adjustment",
    quantity_delta: nextStock - currentStock,
    stock_after: nextStock,
    reference_type: "manual",
    note: note || null,
    created_by: session.userId,
  });

  if (movementError) {
    redirect(`${inventoryAdjustmentPath}?stock=movement-failed`);
  }

  revalidatePath("/admin");
  revalidatePath(inventoryPath);
  revalidatePath(inventoryAdjustmentPath);
  redirect(`${inventoryAdjustmentPath}?stock=saved`);
}

export async function createManualOrder(formData: FormData) {
  const session = await requireAdminSession();
  const customerName = readText(formData, "customerName");
  const customerPhone = readText(formData, "customerPhone");
  const shippingAddress = readText(formData, "shippingAddress");
  const target = parseStockTarget(readText(formData, "orderTarget"));
  const quantity = readPositiveNumber(formData, "quantity");
  const discountTotal = readNonNegativeNumber(formData, "discountTotal") ?? 0;
  const note = readText(formData, "note");

  if (!customerName || !target || !quantity) {
    redirect("/admin/orders/create?order=invalid");
  }

  const supabase = await createSupabaseServerClient();

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id,sku,name_en,name_lo,sale_price,cost_price")
    .eq("id", target.productId)
    .maybeSingle<{
      id: string;
      sku: string;
      name_en: string | null;
      name_lo: string | null;
      sale_price: number | string | null;
      cost_price: number | string | null;
    }>();

  if (productError || !product) {
    redirect("/admin/orders/create?order=missing-product");
  }

  let skuSnapshot = product.sku;
  let variantLabel: string | null = null;
  let unitPrice = Number(product.sale_price ?? 0);
  let unitCost = Number(product.cost_price ?? 0);

  if (target.variantId) {
    const { data: variant, error: variantError } = await supabase
      .from("product_variants")
      .select("sku,size_label,color_name,option_label,sale_price,cost_price")
      .eq("id", target.variantId)
      .eq("product_id", target.productId)
      .maybeSingle<{
        sku: string;
        size_label: string | null;
        color_name: string | null;
        option_label: string | null;
        sale_price: number | string | null;
        cost_price: number | string | null;
      }>();

    if (variantError || !variant) {
      redirect("/admin/orders/create?order=missing-variant");
    }

    skuSnapshot = variant.sku;
    variantLabel = variant.option_label || [variant.color_name, variant.size_label].filter(Boolean).join(" / ") || null;
    unitPrice = Number(variant.sale_price ?? unitPrice);
    unitCost = Number(variant.cost_price ?? unitCost);
  }

  if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
    redirect("/admin/orders/create?order=missing-price");
  }

  const subtotal = unitPrice * quantity;
  const totalAmount = Math.max(subtotal - discountTotal, 0);

  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .insert({
      name: customerName,
      phone: customerPhone || null,
      default_address: shippingAddress || null,
      notes: "Created from admin manual order.",
    })
    .select("id")
    .single<{ id: string }>();

  if (customerError || !customer) {
    redirect("/admin/orders/create?order=customer-failed");
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      order_no: makeOrderNo(),
      source: "chat",
      chat_channel: "admin",
      customer_id: customer.id,
      created_by: session.userId,
      subtotal,
      shipping_fee: 0,
      discount_total: discountTotal,
      total_amount: totalAmount,
      final_amount: totalAmount,
      payment_amount: totalAmount,
      payment_currency: "THB",
      exchange_rate: 1,
      payment_method: "bank_transfer",
      payment_status: "waiting_slip",
      fulfillment_status: "not_ready",
      status: "awaiting_payment_slip",
      shipping_status: "not_shipped",
      shipping_address: shippingAddress || null,
      notes: note || null,
    })
    .select("id")
    .single<{ id: string }>();

  if (orderError || !order) {
    redirect("/admin/orders/create?order=order-failed");
  }

  const { error: itemError } = await supabase.from("order_items").insert({
    order_id: order.id,
    product_id: target.productId,
    product_variant_id: target.variantId,
    sku_snapshot: skuSnapshot,
    product_name_snapshot: product.name_lo || product.name_en || skuSnapshot,
    variant_label_snapshot: variantLabel,
    quantity,
    unit_price: unitPrice,
    unit_cost: Number.isFinite(unitCost) ? unitCost : 0,
  });

  if (itemError) {
    redirect("/admin/orders/create?order=item-failed");
  }

  await supabase.from("payments").insert({
    order_id: order.id,
    amount: totalAmount,
    settlement_amount: totalAmount,
    currency: "THB",
    exchange_rate: 1,
    payment_method: "bank_transfer",
    status: "pending",
    note: "Created with manual admin order.",
  });

  await supabase.from("shipments").insert({
    order_id: order.id,
    status: "not_shipped",
    created_by: session.userId,
  });

  revalidatePath("/admin");
  revalidatePath(ordersPath);
  redirect(`${ordersPath}/${order.id}?order=created`);
}
