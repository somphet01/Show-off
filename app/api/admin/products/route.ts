import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdminSession } from "../../../lib/admin/auth";
import { createSupabaseServerClient } from "../../../lib/supabase/server";
import { shopCategories } from "../../../lib/shop";

type ProductImagePayload = {
  id?: string;
  url?: string;
  altText?: string;
  isPrimary?: boolean;
};

type ProductVariantPayload = {
  id?: string;
  sku?: string;
  sizeLabel?: string;
  colorName?: string;
  colorHex?: string;
  optionLabel?: string;
  salePrice?: number;
  costPrice?: number;
  stock?: number;
  minimumStock?: number;
  status?: "active" | "inactive";
};

type ProductPayload = {
  id?: string;
  nameEn?: string;
  nameLo?: string;
  sku?: string;
  slug?: string;
  category?: string;
  status?: "active" | "hidden" | "archived";
  descriptionEn?: string;
  descriptionLo?: string;
  images?: ProductImagePayload[];
  variants?: ProductVariantPayload[];
};

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 90);
}

function numberValue(value: unknown, fallback = 0) {
  const numeric = Number(value ?? fallback);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function skuPart(value: unknown, fallback: string) {
  return (
    cleanText(value)
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 24) || fallback
  );
}

function normalizeSku(value: unknown) {
  return cleanText(value)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const STORE_SKU_PREFIX = "SO";

const STOREFRONT_CATEGORY_NAMES = shopCategories.flatMap((category) => category.items);

const CATEGORY_SKU_CODES: Record<string, string> = {
  "BASEBALL CAPS": "CAP",
  "BUCKET HAT": "BUCK",
  "CASUAL SHOES": "CAS",
  "CHEST BAGS": "BAG",
  CLOTHING: "CLO",
  "CLEAR FRAME": "CLF",
  ACCESSORIES: "ACC",
  BAGS: "BAG",
  BEANIE: "BEA",
  BELTS: "BELT",
  BOOTS: "BOOT",
  BRACELETS: "BRAC",
  "CROSSBODY BAGS": "BAG",
  "DAD HAT": "DAD",
  EARRINGS: "EAR",
  EYEWEAR: "EYE",
  FOOTWEAR: "FOOT",
  HATS: "HAT",
  "HATS & CAPS": "HAT",
  HOODIES: "HOOD",
  JACKETS: "JACK",
  JEANS: "JEAN",
  KEYCHAINS: "KEY",
  "LEATHER SHOES": "SHOE",
  "LONG SLEEVE": "LS",
  NECKLACES: "NECK",
  PANTS: "PANT",
  PENDANTS: "PEND",
  POLOS: "POLO",
  RINGS: "RING",
  SETS: "SET",
  SHIRTS: "SHIRT",
  SHORTS: "SHORT",
  "SLIDES & SANDALS": "SLIDE",
  SNAPBACK: "SNAP",
  SNEAKERS: "SNK",
  "SPORT GLASSES": "SPG",
  SUNGLASSES: "SUN",
  SWEATERS: "SWT",
  "T-SHIRTS": "TS",
  "TRUCKER CAP": "TRUCK",
  "WAIST BAGS": "BAG",
  WATCHES: "WATCH",
};

const COLOUR_SKU_CODES: Record<string, string> = {
  BEIGE: "BEI",
  BLACK: "BLK",
  BLUE: "BLU",
  BONE: "BON",
  BROWN: "BRN",
  COBALT: "COB",
  CREAM: "CRM",
  EARTH: "EAR",
  "ENGLISH ROSE": "ER",
  "FLAT WHITE": "FW",
  GOLD: "GLD",
  GRAY: "GRY",
  GREEN: "GRN",
  GREY: "GRY",
  "JET BLACK": "JB",
  MULTI: "MUL",
  MULTICOLOR: "MUL",
  NAVY: "NVY",
  ORANGE: "ORG",
  PINK: "PNK",
  "POWDER BLUE": "PB",
  PURPLE: "PUR",
  RED: "RE",
  SILVER: "SLV",
  SKY: "SKY",
  "SKY BLUE": "SB",
  WASHED: "WAS",
  "WASHED BLACK": "WB",
  "WASHED BLUE": "WBL",
  WHITE: "WH",
  YELLOW: "YEL",
};

const COLOUR_HEX_SKU_CODES: Record<string, string> = {
  "#000000": "BLK",
  "#111111": "BLK",
  "#1A1A1A": "BLK",
  "#737373": "GRY",
  "#808080": "GRY",
  "#FFFFFF": "WH",
  "#FF0000": "RE",
  "#DC2626": "RE",
  "#EF4444": "RE",
  "#2563EB": "BLU",
  "#0000FF": "BLU",
  "#16A34A": "GRN",
  "#008000": "GRN",
};

function initialsCode(value: unknown, fallback: string, maxLength = 5) {
  const words = cleanText(value)
    .toUpperCase()
    .replace(/[^A-Z0-9\s-]+/g, " ")
    .split(/[\s-]+/)
    .filter(Boolean);

  if (!words.length) return fallback;

  const initials = words
    .slice(0, maxLength)
    .map((word) => word[0])
    .join("");

  return initials || fallback;
}

function categorySkuCode(categoryName: string) {
  const normalized = cleanText(categoryName).toUpperCase();
  return CATEGORY_SKU_CODES[normalized] || skuPart(normalized, "CAT").slice(0, 5);
}

function storefrontCategoryName(value: unknown) {
  const normalized = cleanText(value).toLowerCase();
  return STOREFRONT_CATEGORY_NAMES.find((category) => category.toLowerCase() === normalized) ?? "";
}

function colourSkuCode(colourName: unknown) {
  const normalized = cleanText(colourName).toUpperCase();
  return COLOUR_SKU_CODES[normalized] || initialsCode(normalized, skuPart(normalized, "COL").slice(0, 3), 3);
}

function colourCodeFromHex(hex: unknown) {
  const normalized = cleanText(hex).toUpperCase();
  return COLOUR_HEX_SKU_CODES[normalized] || "";
}

function knownColourCodes() {
  return Array.from(new Set(Object.values(COLOUR_SKU_CODES))).sort((a, b) => b.length - a.length);
}

function colourCodeFromSkuHint(sku: unknown) {
  const normalized = normalizeSku(sku);
  if (!normalized) return "";

  const parts = normalized.split("-").filter(Boolean);
  const codes = knownColourCodes();

  const firstPart = parts[0];
  if (codes.includes(firstPart)) return firstPart;

  if (parts[0] === STORE_SKU_PREFIX && parts.length >= 6) {
    const colourPart = parts.at(-2) ?? "";
    if (codes.includes(colourPart)) return colourPart;
  }

  const matchedPart = parts.find((part) => codes.includes(part));
  return matchedPart ?? "";
}

function colourCodeForVariant(variant: ProductVariantPayload) {
  return colourCodeFromHex(variant.colorHex) || colourSkuCode(variant.colorName) || colourCodeFromSkuHint(variant.sku);
}

function generatedProductSkuPattern(sku: string) {
  return sku.match(/^SO-([A-Z0-9]+)-(\d{4})$/);
}

function skuSequenceForCategory(sku: unknown, categoryCode: string) {
  const normalized = normalizeSku(sku);
  const newPattern = new RegExp(`^${STORE_SKU_PREFIX}-${categoryCode}-(\\d{4})$`);
  const legacyPattern = new RegExp(`^${STORE_SKU_PREFIX}-[A-Z0-9]+-${categoryCode}-(\\d{4})$`);
  const match = normalized.match(newPattern) || normalized.match(legacyPattern);
  const sequence = Number(match?.[1]);

  return Number.isFinite(sequence) ? sequence : 0;
}

async function nextProductSequence(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  categoryCode: string,
  productId?: string,
) {
  const { data } = await supabase.from("products").select("id,sku");
  const maxSequence = (data ?? []).reduce((max, row) => {
    if (productId && row.id === productId) return max;
    return Math.max(max, skuSequenceForCategory(row.sku, categoryCode));
  }, 0);

  return String(maxSequence + 1).padStart(4, "0");
}

async function resolveProductSku(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  payload: ProductPayload,
  nameEn: string,
  categoryName: string,
  productId?: string,
) {
  const categoryCode = categorySkuCode(categoryName);
  const existingSku = normalizeSku(payload.sku);
  const existingGeneratedSku = generatedProductSkuPattern(existingSku);

  if (existingGeneratedSku?.[1] === categoryCode) {
    return existingSku;
  }

  const sequence = await nextProductSequence(supabase, categoryCode, productId);

  return `${STORE_SKU_PREFIX}-${categoryCode}-${sequence}`;
}

function variantSkuFor(productSku: string, variant: ProductVariantPayload, index: number) {
  const colour = colourCodeForVariant(variant);
  const size = skuPart(variant.sizeLabel || variant.optionLabel, `V${index + 1}`);
  return `${normalizeSku(productSku)}-${colour}-${size}`;
}

function isUuid(value: string | undefined) {
  return Boolean(value?.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i));
}

function uniqueImagePath(path: string, productId: string, index: number) {
  if (!path) return path;
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}so_product=${productId}&so_image=${index}`;
}

async function getOrCreateCategoryId(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, categoryName: string) {
  const name = categoryName || "Uncategorized";
  const slug = slugify(name) || "uncategorized";

  const { data: existing } = await supabase.from("categories").select("id").or(`slug.eq.${slug},name_en.eq.${name}`).limit(1).maybeSingle<{ id: string }>();

  if (existing?.id) {
    return existing.id;
  }

  const { data, error } = await supabase
    .from("categories")
    .insert({
      name_en: name,
      slug,
      is_active: true,
    })
    .select("id")
    .single<{ id: string }>();

  if (error || !data) {
    throw new Error(error?.message || "Failed to create category.");
  }

  return data.id;
}

async function resolveProductSlug(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, value: string, productId?: string) {
  if (productId) {
    const { data: existingProduct } = await supabase.from("products").select("slug").eq("id", productId).maybeSingle<{ slug: string | null }>();

    if (existingProduct?.slug) {
      return existingProduct.slug;
    }
  }

  const baseSlug = slugify(value) || "show-off-product";

  for (let index = 1; index <= 100; index += 1) {
    const candidate = index === 1 ? baseSlug : `${baseSlug}-${index}`;
    const { data: existing } = await supabase.from("products").select("id").eq("slug", candidate).maybeSingle<{ id: string }>();

    if (!existing?.id || existing.id === productId) {
      return candidate;
    }
  }

  return `${baseSlug}-${Date.now()}`;
}

export async function POST(request: Request) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json()) as ProductPayload;
  const nameEn = cleanText(payload.nameEn || payload.nameLo || payload.sku);
  const rawSku = cleanText(payload.sku);
  const variants = Array.isArray(payload.variants) ? payload.variants : [];
  const images = Array.isArray(payload.images) ? payload.images : [];

  if (!nameEn) {
    return NextResponse.json({ error: "Missing product name." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const categoryName = storefrontCategoryName(payload.category);

  if (!categoryName) {
    return NextResponse.json({ error: "Invalid product category. Please choose a storefront category from the list." }, { status: 400 });
  }

  const categoryId = await getOrCreateCategoryId(supabase, categoryName);
  const salePrices = variants.map((variant) => numberValue(variant.salePrice)).filter((value) => value > 0);
  const costPrices = variants.map((variant) => numberValue(variant.costPrice)).filter((value) => value > 0);
  const stockQty = variants.reduce((sum, variant) => sum + numberValue(variant.stock), 0);
  const minStockQty = variants.reduce((sum, variant) => sum + numberValue(variant.minimumStock), 0) || 5;
  const productId = isUuid(payload.id) ? payload.id : undefined;
  const sku = await resolveProductSku(supabase, payload, nameEn, categoryName, productId);
  const slug = await resolveProductSlug(supabase, nameEn || rawSku || sku, productId);
  const resolvedVariants = variants.map((variant, index) => ({
    ...variant,
    resolvedSku: variantSkuFor(sku, variant, index),
  }));
  const duplicateVariant = resolvedVariants.find((variant, index) => resolvedVariants.findIndex((item) => item.resolvedSku === variant.resolvedSku) !== index);

  if (duplicateVariant) {
    const duplicateRows = resolvedVariants
      .map((variant, index) => ({ variant, index }))
      .filter((item) => item.variant.resolvedSku === duplicateVariant.resolvedSku)
      .map((item) => {
        const colour = cleanText(item.variant.colorName) || cleanText(item.variant.colorHex) || "-";
        const size = cleanText(item.variant.sizeLabel) || cleanText(item.variant.optionLabel) || "-";
        return `row ${item.index + 1} (${colour} / ${size})`;
      })
      .join(", ");

    return NextResponse.json(
      { error: `Variant SKU is duplicated in this form: ${duplicateVariant.resolvedSku}. Duplicate rows: ${duplicateRows}. Please keep only one row for each colour/size.` },
      { status: 400 },
    );
  }

  const resolvedSkus = resolvedVariants.map((variant) => variant.resolvedSku).filter(Boolean);

  if (resolvedSkus.length > 0) {
    const { data: skuMatches, error: skuCheckError } = await supabase.from("product_variants").select("id,sku,product_id").in("sku", resolvedSkus);

    if (skuCheckError) {
      return NextResponse.json({ error: skuCheckError.message || "Failed to check variant SKU." }, { status: 400 });
    }

    const conflictingSku = (skuMatches ?? []).find((match) => {
      const belongsToThisProduct = productId && match.product_id === productId;
      const isSameVariant = resolvedVariants.some((variant) => isUuid(variant.id) && variant.id === match.id);
      return !belongsToThisProduct && !isSameVariant;
    })?.sku;

    if (conflictingSku) {
      return NextResponse.json({ error: `Variant SKU already exists: ${conflictingSku}. Please use a new SKU for this colour/size.` }, { status: 400 });
    }
  }

  const productInput = {
    sku,
    name_en: nameEn,
    name_lo: cleanText(payload.nameLo) || null,
    slug,
    category_id: categoryId,
    description_en: cleanText(payload.descriptionEn) || null,
    description_lo: cleanText(payload.descriptionLo) || null,
    sale_price: salePrices.length ? Math.min(...salePrices) : 0,
    cost_price: costPrices.length ? Math.min(...costPrices) : 0,
    stock_qty: stockQty,
    min_stock_qty: minStockQty,
    status: payload.status ?? "active",
  };

  const productQuery = productId
    ? supabase.from("products").update(productInput).eq("id", productId).select("id,created_at").single<{ id: string; created_at: string }>()
    : supabase.from("products").insert(productInput).select("id,created_at").single<{ id: string; created_at: string }>();

  const { data: productRow, error: productError } = await productQuery;

  if (productError || !productRow) {
    return NextResponse.json({ error: productError?.message || "Failed to save product." }, { status: 400 });
  }

  const savedProductId = productRow.id;

  const { data: existingVariants } = await supabase.from("product_variants").select("id,sku").eq("product_id", savedProductId);
  const keptVariantIds: string[] = [];

  for (let index = 0; index < resolvedVariants.length; index += 1) {
    const variant = resolvedVariants[index];
    const variantSku = variant.resolvedSku;
    const optionLabel = cleanText(variant.optionLabel) || [variant.colorName, variant.sizeLabel].map(cleanText).filter(Boolean).join(" / ") || `Variant ${index + 1}`;
    const variantInput = {
      product_id: savedProductId,
      sku: variantSku,
      size_label: cleanText(variant.sizeLabel) || null,
      color_name: cleanText(variant.colorName) || null,
      color_hex: cleanText(variant.colorHex) || null,
      option_label: optionLabel,
      sale_price: numberValue(variant.salePrice),
      cost_price: numberValue(variant.costPrice),
      stock_qty: numberValue(variant.stock),
      min_stock_qty: numberValue(variant.minimumStock, 5),
      status: variant.status ?? "active",
      sort_order: index,
    };

    const existingVariantId = isUuid(variant.id) ? variant.id : (existingVariants ?? []).find((item) => item.sku === variantSku)?.id;
    const variantQuery = existingVariantId
      ? supabase.from("product_variants").update(variantInput).eq("id", existingVariantId).eq("product_id", savedProductId).select("id").single<{ id: string }>()
      : supabase.from("product_variants").insert(variantInput).select("id").single<{ id: string }>();

    const { data: variantRow, error: variantError } = await variantQuery;

    if (variantError || !variantRow) {
      return NextResponse.json({ error: variantError?.message || `Failed to save variant ${variantSku}.` }, { status: 400 });
    }

    keptVariantIds.push(variantRow.id);
  }

  const staleVariantIds = (existingVariants ?? []).map((variant) => variant.id).filter((id) => !keptVariantIds.includes(id));

  if (staleVariantIds.length > 0) {
    await supabase.from("product_variants").update({ status: "inactive" }).in("id", staleVariantIds);
  }

  await supabase.from("product_images").delete().eq("product_id", savedProductId);

  const imageRows = images
    .map((image, index) => ({
      product_id: savedProductId,
      bucket: "product-images",
      path: uniqueImagePath(cleanText(image.url), savedProductId, index),
      alt_text: cleanText(image.altText) || nameEn,
      sort_order: index,
      is_primary: Boolean(image.isPrimary) || index === 0,
    }))
    .filter((image) => image.path);

  if (imageRows.length > 0) {
    const { error: imageError } = await supabase.from("product_images").insert(imageRows);

    if (imageError) {
      return NextResponse.json({ error: imageError.message || "Failed to save product images." }, { status: 400 });
    }
  }

  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath("/en");
  revalidatePath("/lo");

  return NextResponse.json({
    product: {
      id: savedProductId,
      nameTh: cleanText(payload.nameLo) || nameEn,
      nameEn,
      nameLo: cleanText(payload.nameLo) || undefined,
      sku,
      slug,
      category: categoryName,
      status: payload.status ?? "active",
      descriptionEn: cleanText(payload.descriptionEn) || undefined,
      descriptionLo: cleanText(payload.descriptionLo) || undefined,
      images: imageRows.map((image, index) => ({
        id: `${savedProductId}-image-${index}`,
        url: image.path,
        altText: image.alt_text,
        isPrimary: image.is_primary,
      })),
      variants: resolvedVariants.map((variant, index) => ({
        id: keptVariantIds[index],
        sku: variant.resolvedSku,
        sizeLabel: cleanText(variant.sizeLabel),
        colorName: cleanText(variant.colorName),
        colorHex: cleanText(variant.colorHex) || "#737373",
        optionLabel: cleanText(variant.optionLabel) || [variant.colorName, variant.sizeLabel].map(cleanText).filter(Boolean).join(" / "),
        salePrice: numberValue(variant.salePrice),
        costPrice: numberValue(variant.costPrice),
        stock: numberValue(variant.stock),
        minimumStock: numberValue(variant.minimumStock, 5),
        status: variant.status ?? "active",
      })),
      salePrice: productInput.sale_price,
      costPrice: productInput.cost_price,
      stock: productInput.stock_qty,
      minimumStock: productInput.min_stock_qty,
      createdAt: productRow.created_at,
    },
  });
}

export async function DELETE(request: Request) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const productId = new URL(request.url).searchParams.get("id") ?? "";

  if (!isUuid(productId)) {
    return NextResponse.json({ error: "Invalid product id." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  await supabase.from("product_images").delete().eq("product_id", productId);
  await supabase.from("product_variants").delete().eq("product_id", productId);

  const { error } = await supabase.from("products").delete().eq("id", productId);

  if (error) {
    return NextResponse.json({ error: error.message || "Failed to delete product." }, { status: 400 });
  }

  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath("/en");
  revalidatePath("/lo");

  return NextResponse.json({ ok: true });
}
