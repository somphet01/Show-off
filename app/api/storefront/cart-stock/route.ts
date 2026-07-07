import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

type CartStockRequestItem = {
  slug?: string;
  color?: string;
  size?: string;
};

function cartStockKey(item: CartStockRequestItem) {
  return [item.slug ?? "", item.color ?? "", item.size ?? ""].map((part) => part.trim().toLowerCase()).join("|");
}

function cleanItems(payload: unknown) {
  const items = Array.isArray((payload as { items?: unknown })?.items) ? ((payload as { items: unknown[] }).items as CartStockRequestItem[]) : [];

  return items
    .map((item) => ({
      slug: typeof item.slug === "string" ? item.slug.trim() : "",
      color: typeof item.color === "string" ? item.color.trim() : "",
      size: typeof item.size === "string" ? item.size.trim() : "",
    }))
    .filter((item) => item.slug && item.color && item.size);
}

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ stocks: {} });
  }

  const items = cleanItems(payload);
  if (items.length === 0) {
    return NextResponse.json({ stocks: {} });
  }

  const slugs = Array.from(new Set(items.map((item) => item.slug)));
  const supabase = await createSupabaseServerClient();
  const { data: products, error: productError } = await supabase
    .from("products")
    .select("id,slug")
    .in("slug", slugs)
    .eq("status", "active");

  if (productError) {
    return NextResponse.json({ error: productError.message }, { status: 500 });
  }

  const productIds = (products ?? []).map((product) => product.id).filter(Boolean);
  if (productIds.length === 0) {
    return NextResponse.json({ stocks: {} });
  }

  const { data: variants, error: variantError } = await supabase
    .from("product_variants")
    .select("product_id,color_name,size_label,stock_qty")
    .in("product_id", productIds)
    .eq("status", "active");

  if (variantError) {
    return NextResponse.json({ error: variantError.message }, { status: 500 });
  }

  const slugByProductId = new Map((products ?? []).map((product) => [String(product.id), String(product.slug)]));
  const availableStocks = new Map<string, number>();

  for (const variant of variants ?? []) {
    const slug = slugByProductId.get(String(variant.product_id));
    if (!slug) continue;

    availableStocks.set(
      cartStockKey({
        slug,
        color: String(variant.color_name ?? ""),
        size: String(variant.size_label ?? ""),
      }),
      Math.max(0, Number(variant.stock_qty ?? 0)),
    );
  }

  const stocks = Object.fromEntries(items.map((item) => [cartStockKey(item), availableStocks.get(cartStockKey(item)) ?? 0]));

  return NextResponse.json({ stocks });
}
