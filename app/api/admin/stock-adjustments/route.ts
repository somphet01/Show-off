import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdminSession } from "../../../lib/admin/auth";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

type AdjustmentType = "increase" | "decrease" | "set";

type StockAdjustmentPayload = {
  productId?: string;
  variantId?: string;
  adjustmentType?: AdjustmentType;
  quantity?: number;
  reason?: string;
  note?: string;
};

function numberValue(value: unknown, fallback = 0) {
  const numeric = Number(value ?? fallback);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function movementLabel(type: AdjustmentType, reason: string) {
  const prefix = type === "increase" ? "ເພີ່ມ" : type === "decrease" ? "ຫຼຸດ" : "ຕັ້ງຄ່າ";
  return [prefix, reason].filter(Boolean).join(" · ");
}

export async function POST(request: Request) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json().catch(() => ({}))) as StockAdjustmentPayload;
  const productId = cleanText(payload.productId);
  const variantId = cleanText(payload.variantId);
  const adjustmentType = payload.adjustmentType;
  const quantity = numberValue(payload.quantity);
  const reason = cleanText(payload.reason);
  const note = cleanText(payload.note);

  if (!productId || !variantId || !adjustmentType || !["increase", "decrease", "set"].includes(adjustmentType) || quantity < 0) {
    return NextResponse.json({ error: "Invalid stock adjustment data." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: variant, error: variantError } = await supabase
    .from("product_variants")
    .select("id,product_id,sku,size_label,color_name,color_hex,option_label,sale_price,cost_price,stock_qty,min_stock_qty,status,products(id,sku,name_en,name_lo)")
    .eq("id", variantId)
    .eq("product_id", productId)
    .maybeSingle<any>();

  if (variantError || !variant) {
    return NextResponse.json({ error: "Variant not found." }, { status: 404 });
  }

  const currentStock = numberValue(variant.stock_qty);
  const nextStock =
    adjustmentType === "increase"
      ? currentStock + quantity
      : adjustmentType === "decrease"
        ? currentStock - quantity
        : quantity;

  if (nextStock < 0) {
    return NextResponse.json({ error: "Stock cannot be negative." }, { status: 400 });
  }

  const { error: updateError } = await supabase
    .from("product_variants")
    .update({ stock_qty: nextStock, updated_at: new Date().toISOString() })
    .eq("id", variantId)
    .eq("product_id", productId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message || "Failed to update stock." }, { status: 500 });
  }

  const { data: siblingVariants } = await supabase.from("product_variants").select("stock_qty").eq("product_id", productId).eq("status", "active");
  const productStock = (siblingVariants ?? []).reduce((sum, item) => sum + numberValue(item.stock_qty), 0);
  await supabase.from("products").update({ stock_qty: productStock, updated_at: new Date().toISOString() }).eq("id", productId);

  const movementInput = {
    product_id: productId,
    product_variant_id: variantId,
    movement_type: "manual_adjustment",
    quantity_delta: nextStock - currentStock,
    stock_after: nextStock,
    reference_type: "manual",
    note: note || movementLabel(adjustmentType, reason),
    created_by: session.userId,
  };

  const { data: movement, error: movementError } = await supabase
    .from("inventory_movements")
    .insert(movementInput)
    .select("id,movement_type,quantity_delta,stock_after,reference_type,reference_id,note,created_at")
    .single<any>();

  if (movementError) {
    return NextResponse.json({ error: movementError.message || "Stock was updated but movement history failed." }, { status: 500 });
  }

  revalidatePath("/admin");
  revalidatePath("/admin/inventory");
  revalidatePath("/en");
  revalidatePath("/lo");
  revalidatePath("/en/collections/[slug]", "page");
  revalidatePath("/lo/collections/[slug]", "page");
  revalidatePath("/en/products/[slug]", "page");
  revalidatePath("/lo/products/[slug]", "page");

  const product = Array.isArray(variant.products) ? variant.products[0] : variant.products;
  const variantLabel = [variant.color_name, variant.size_label].filter(Boolean).join(" / ") || variant.option_label || variant.sku || "-";

  return NextResponse.json({
    variant: {
      id: variant.id,
      sku: variant.sku,
      sizeLabel: variant.size_label ?? "-",
      colorName: variant.color_name ?? "-",
      colorHex: variant.color_hex ?? "#111111",
      optionLabel: variant.option_label ?? variantLabel,
      salePrice: numberValue(variant.sale_price),
      costPrice: numberValue(variant.cost_price),
      stock: nextStock,
      minimumStock: numberValue(variant.min_stock_qty, 5),
      status: variant.status === "active" ? "active" : "inactive",
    },
    productStock,
    movement: {
      id: movement.id,
      type: movement.movement_type,
      productName: product?.name_en ?? product?.name_lo ?? product?.sku ?? "SHOW OFF product",
      sku: variant.sku ?? product?.sku ?? "-",
      variant: variantLabel,
      quantityDelta: numberValue(movement.quantity_delta),
      stockAfter: numberValue(movement.stock_after),
      referenceType: movement.reference_type ?? "manual",
      referenceId: movement.reference_id ?? "MANUAL",
      note: movement.note ?? undefined,
      createdBy: session.displayName ?? session.email ?? "Admin",
      createdAt: movement.created_at ?? new Date().toISOString(),
    },
  });
}
