import { unstable_noStore as noStore } from "next/cache";
import type { CollectionProduct } from "./shop";
import { createSupabaseServerClient } from "./supabase/server";

type Relation<T> = T | T[] | null | undefined;

function firstRelation<T>(value: Relation<T>): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

type StorefrontProductRow = {
  id?: string | null;
  sku?: string | null;
  name_en?: string | null;
  name_lo?: string | null;
  slug?: string | null;
  sale_price?: number | string | null;
  status?: string | null;
  categories?: Relation<{ name_en?: string | null }>;
  product_images?: Array<{
    id?: string | null;
    path?: string | null;
    alt_text?: string | null;
    sort_order?: number | null;
    is_primary?: boolean | null;
  }> | null;
  product_variants?: Array<{
    id?: string | null;
    size_label?: string | null;
    color_name?: string | null;
    color_hex?: string | null;
    option_label?: string | null;
    sale_price?: number | string | null;
    stock_qty?: number | string | null;
    status?: string | null;
    sort_order?: number | null;
  }> | null;
};

function numberValue(value: unknown, fallback = 0) {
  const numeric = Number(value ?? fallback);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function moneyFromLak(value: unknown) {
  const amount = numberValue(value);

  if (amount >= 1000) {
    return `₭${Math.round(amount / 1000).toLocaleString("en-US")}K`;
  }

  return `₭${amount.toLocaleString("en-US")}`;
}

const defaultThbToLakRate = 650;

function moneyFromStorefrontLak(value: unknown, thbToLakRate = defaultThbToLakRate) {
  const amount = numberValue(value);
  const rate = thbToLakRate > 0 ? thbToLakRate : defaultThbToLakRate;
  const thbAmount = amount / rate;

  return `฿${Math.round(thbAmount).toLocaleString("en-US")}`;
}

function colorClassFromHex(hex?: string | null) {
  const value = (hex ?? "").toLowerCase();

  if (value.includes("fff") || value.includes("f5") || value.includes("eee")) return "white";
  if (value.includes("ff0000") || value.includes("f00") || value.includes("c5") || value.includes("14") || value.includes("red")) return "red";
  if (value.includes("00f") || value.includes("navy") || value.includes("blue")) return "navy";
  if (value.includes("7") || value.includes("8") || value.includes("grey")) return "grey";

  return "black";
}

function parseImageMeta(altText?: string | null) {
  const value = altText ?? "";
  const match = value.match(/^\[(color|detail):?([^\]]*)\]\s*(.*)$/i);

  if (!match) {
    return { role: "color" as const, colorName: "", altText: value };
  }

  return {
    role: match[1].toLowerCase() === "detail" ? ("detail" as const) : ("color" as const),
    colorName: match[2]?.trim() ?? "",
    altText: match[3]?.trim() || value,
  };
}

function isRealStorefrontProduct(row: StorefrontProductRow) {
  return /^SO-[A-Z0-9]+-\d{4}$/.test((row.sku ?? "").trim().toUpperCase());
}

function mapStorefrontProduct(row: StorefrontProductRow, index: number, thbToLakRate = defaultThbToLakRate): CollectionProduct {
  const variants = Array.isArray(row.product_variants) ? row.product_variants.filter((variant) => variant.status !== "inactive") : [];
  const sortedImages = (Array.isArray(row.product_images) ? row.product_images : []).sort((a, b) => numberValue(a.sort_order) - numberValue(b.sort_order));
  const colours = Array.from(new Set(variants.map((variant) => variant.color_name || "Default")));
  const baseColour = colours[0] ?? "Black";
  const colorImages = colours.reduce<Record<string, string[]>>((groups, colour) => {
    groups[colour] = [];
    return groups;
  }, {});
  const cardImages = colours.reduce<Record<string, string[]>>((groups, colour) => {
    groups[colour] = [];
    return groups;
  }, {});
  const detailImages: string[] = [];

  sortedImages.forEach((image) => {
    if (!image.path) return;
    const meta = parseImageMeta(image.alt_text);
    if (meta.role === "detail") {
      detailImages.push(image.path);
      return;
    }
    const targetColour = meta.colorName || baseColour;
    colorImages[targetColour] = colorImages[targetColour] ?? [];
    colorImages[targetColour].push(image.path);
    if (image.is_primary || image.path.toLowerCase().includes("-front.") || image.path.toLowerCase().includes("-card.")) {
      cardImages[targetColour] = cardImages[targetColour] ?? [];
      cardImages[targetColour].push(image.path);
    }
  });

  const fallbackGallery = sortedImages.map((image) => image.path).filter(Boolean) as string[];
  const colorOnlyFallback = fallbackGallery.filter((path) => !detailImages.includes(path));
  const baseGallery = colorImages[baseColour]?.length ? colorImages[baseColour] : colorOnlyFallback;
  const primaryImage = sortedImages.find((image) => image.is_primary)?.path ?? baseGallery[0] ?? fallbackGallery[0] ?? "/assets/products-grid.png";
  const variantSizes = variants.reduce<Record<string, string[]>>((groups, variant) => {
    const colour = variant.color_name || baseColour;
    const size = variant.size_label || variant.option_label || "OS";
    groups[colour] = groups[colour] ?? [];
    if (!groups[colour].includes(size)) {
      groups[colour].push(size);
    }
    return groups;
  }, {});
  const variantStockByColor = variants.reduce<Record<string, Record<string, number>>>((groups, variant) => {
    const colour = variant.color_name || baseColour;
    const size = variant.size_label || variant.option_label || "OS";
    groups[colour] = groups[colour] ?? {};
    groups[colour][size] = numberValue(variant.stock_qty);
    return groups;
  }, {});
  const swatches = variants.length
    ? colours.map((colour) => {
        const variant = variants.find((item) => (item.color_name || baseColour) === colour);
        return colorClassFromHex(variant?.color_hex);
      })
    : ["black"];
  const swatchHexes = variants.length
    ? colours.map((colour) => {
        const variant = variants.find((item) => (item.color_name || baseColour) === colour);
        return variant?.color_hex || "#111111";
      })
    : undefined;

  return {
    slug: row.slug || row.id || `product-${index + 1}`,
    name: row.name_en || row.name_lo || row.sku || "SHOW OFF product",
    category: firstRelation(row.categories)?.name_en ?? undefined,
    color: baseColour,
    price: moneyFromStorefrontLak(variants.find((variant) => numberValue(variant.sale_price) > 0)?.sale_price ?? row.sale_price, thbToLakRate),
    colors: Math.max(1, colours.length || 1),
    swatches,
    swatchHexes,
    swatchLabels: colours,
    image: primaryImage,
    cardImages: colours.length
      ? Object.fromEntries(
          colours.map((colour) => {
            const colourCardImages = cardImages[colour]?.length ? cardImages[colour] : colorImages[colour]?.[0] ? [colorImages[colour][0]] : [primaryImage];
            return [colour, colourCardImages];
          }),
        )
      : undefined,
    gallery: baseGallery.length ? baseGallery : [primaryImage],
    detailImages,
    colourImages: colours.length
      ? Object.fromEntries(
          colours.map((colour) => {
            const colourGallery = colorImages[colour]?.length ? colorImages[colour] : baseGallery.length ? baseGallery : [primaryImage];
            return [colour, colourGallery];
          }),
        )
      : undefined,
    variantSizes,
    variantStockByColor,
    badge: row.status === "active" ? undefined : "Hidden",
  };
}

export async function getStorefrontProducts() {
  noStore();

  try {
    const supabase = await createSupabaseServerClient();
    const [productsResult, settingsResult] = await Promise.all([
      supabase
        .from("products")
        .select("id,sku,name_en,name_lo,slug,sale_price,status,categories(name_en),product_images(id,path,alt_text,sort_order,is_primary),product_variants(id,size_label,color_name,color_hex,option_label,sale_price,stock_qty,status,sort_order)")
        .eq("status", "active")
        .ilike("sku", "SO-%")
        .order("created_at", { ascending: false })
        .limit(60),
      supabase
        .from("storefront_payment_settings")
        .select("thb_to_lak_rate")
        .eq("id", "main")
        .maybeSingle<{ thb_to_lak_rate: number | string | null }>(),
    ]);
    const { data, error } = productsResult;
    const thbToLakRate = numberValue(settingsResult.data?.thb_to_lak_rate, defaultThbToLakRate);

    if (error || !data?.length) {
      return [];
    }

    return (data as StorefrontProductRow[]).filter(isRealStorefrontProduct).map((row, index) => mapStorefrontProduct(row, index, thbToLakRate));
  } catch {
    return [];
  }
}

export async function getStorefrontProductFromSlug(slug: string) {
  const products = await getStorefrontProducts();
  return products.find((product) => product.slug === slug);
}
