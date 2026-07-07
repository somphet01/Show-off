import { useMemo, useRef, useState } from "react";
import { ArrowLeft, CheckCircle, GripVertical, Info, PackageCheck, Plus, Ruler, Save, Trash2, UploadCloud } from "lucide-react";
import { useApp } from "../../context";
import { useAdminFeedback } from "../ui/AdminFeedback";
import { liveValue } from "../../liveData";
import type { Product } from "../../types";

const inputClass =
  "w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-neutral-900 outline-none transition focus:border-transparent focus:ring-2 focus:ring-neutral-400";

type ImageDraft = {
  id: string;
  url: string;
  altText: string;
};

type SizeDraft = {
  id: string;
  sku: string;
  sizeLabel: string;
  stock: number;
  minimumStock: number;
};

type ColorGroupDraft = {
  id: string;
  colorName: string;
  colorHex: string;
  salePrice: number;
  costPrice: number;
  images: ImageDraft[];
  sizes: SizeDraft[];
};

type DraggedImage =
  | { type: "color"; colorId: string; imageId: string }
  | { type: "detail"; imageId: string };

const websiteCategories = [
  "T-Shirts",
  "Oversized T-Shirts",
  "Shirts",
  "Polos",
  "Long Sleeve",
  "Hoodies",
  "Sweaters",
  "Jackets",
  "Jeans",
  "Pants",
  "Shorts",
  "Sets",
  "Sneakers",
  "Slides & Sandals",
  "Leather Shoes",
  "Boots",
  "Casual Shoes",
  "Sunglasses",
  "Fashion Glasses",
  "Clear Frame",
  "Sport Glasses",
  "Baseball Caps",
  "Dad Hat",
  "Snapback",
  "Trucker Cap",
  "Bucket Hat",
  "Beanie",
  "Necklaces",
  "Pendants",
  "Rings",
  "Earrings",
  "Bracelets",
  "Watches",
  "Belts",
  "Keychains",
  "Crossbody Bags",
  "Chest Bags",
  "Waist Bags",
];

const storefrontCategories = liveValue<string[]>("storefrontCategories", websiteCategories);

function fieldLabel(text: string) {
  return (
    <span className="mb-1.5 block text-neutral-500" style={{ fontSize: "12.5px", fontWeight: 650 }}>
      {text}
    </span>
  );
}

function money(value: number) {
  return value > 0 ? Math.round(value).toLocaleString("en-US") : "ຍັງບໍ່ໄດ້ໃສ່";
}

function parsePriceInput(value: string) {
  return Number(value.replace(/[^\d]/g, "")) || 0;
}

const STORE_SKU_PREFIX = "SO";

const categorySkuCodes: Record<string, string> = {
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

const colourSkuCodes: Record<string, string> = {
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
  "ICE BLUE": "IB",
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

const colourHexSkuCodes: Record<string, string> = {
  "#000000": "BLK",
  "#111111": "BLK",
  "#1A1A1A": "BLK",
  "#617480": "IB",
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

function skuPart(value: string, fallback: string) {
  return (value || fallback)
    .toUpperCase()
    .trim()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || fallback;
}

function initialsCode(value: string, fallback: string, maxLength = 5) {
  const words = value
    .toUpperCase()
    .replace(/[^A-Z0-9\s-]+/g, " ")
    .split(/[\s-]+/)
    .filter(Boolean);

  return words.length ? words.slice(0, maxLength).map((word) => word[0]).join("") : fallback;
}

function categorySkuCode(categoryName: string) {
  const normalized = categoryName.toUpperCase().trim();
  return categorySkuCodes[normalized] || skuPart(normalized, "CAT").slice(0, 5);
}

function colourSkuCode(colorName: string, colorHex: string) {
  const hexCode = colourHexSkuCodes[colorHex.toUpperCase().trim()];
  if (hexCode) return hexCode;

  const normalized = colorName.toUpperCase().trim();
  return colourSkuCodes[normalized] || initialsCode(normalized, skuPart(normalized, "COL").slice(0, 3), 3);
}

function skuSequenceForCategory(sku: string | undefined, categoryCode: string) {
  const normalized = skuPart(sku ?? "", "");
  const currentPattern = new RegExp(`^${STORE_SKU_PREFIX}-${categoryCode}-(\\d{4})$`);
  const legacyPattern = new RegExp(`^${STORE_SKU_PREFIX}-[A-Z0-9]+-${categoryCode}-(\\d{4})$`);
  const match = normalized.match(currentPattern) || normalized.match(legacyPattern);
  const sequence = Number(match?.[1]);

  return Number.isFinite(sequence) ? sequence : 0;
}

function generatedProductSku(categoryName: string, products: Product[], existingProductId?: string) {
  const categoryCode = categorySkuCode(categoryName);
  const maxSequence = products.reduce((max, product) => {
    if (existingProductId && product.id === existingProductId) return max;
    return Math.max(max, skuSequenceForCategory(product.sku, categoryCode));
  }, 0);

  return `${STORE_SKU_PREFIX}-${categoryCode}-${String(maxSequence + 1).padStart(4, "0")}`;
}

function generatedVariantSku(productSku: string, group: ColorGroupDraft, size: SizeDraft, index: number) {
  const colour = colourSkuCode(group.colorName, group.colorHex);
  const sizeCode = skuPart(size.sizeLabel || `V${index + 1}`, `V${index + 1}`);
  return `${skuPart(productSku, STORE_SKU_PREFIX)}-${colour}-${sizeCode}`;
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseImageMeta(altText: string) {
  const match = altText.match(/^\[(color|detail):?([^\]]*)\]\s*(.*)$/i);

  if (!match) {
    return { role: "color" as const, colorName: "", altText };
  }

  return {
    role: match[1].toLowerCase() === "detail" ? ("detail" as const) : ("color" as const),
    colorName: match[2]?.trim() ?? "",
    altText: match[3]?.trim() || altText,
  };
}

function cleanAlt(text: string, fallback: string) {
  return text.trim() || fallback;
}

function newBlankSize(seedSku = "", index = 1): SizeDraft {
  return {
    id: makeId("size"),
    sku: "",
    sizeLabel: "",
    stock: 0,
    minimumStock: 2,
  };
}

function newBlankColor(seedSku = ""): ColorGroupDraft {
  return {
    id: makeId("color"),
    colorName: "",
    colorHex: "#737373",
    salePrice: 0,
    costPrice: 0,
    images: [],
    sizes: [newBlankSize(seedSku)],
  };
}

function buildInitialColors(existing: Product | null): { colors: ColorGroupDraft[]; details: ImageDraft[] } {
  if (!existing) {
    return { colors: [newBlankColor()], details: [] };
  }

  const colorNames = Array.from(new Set(existing.variants.map((variant) => variant.colorName || "Default")));
  const colors = colorNames.length
    ? colorNames.map((colorName) => {
        const variants = existing.variants.filter((variant) => (variant.colorName || "Default") === colorName);
        const first = variants[0];

        return {
          id: makeId("color"),
          colorName,
          colorHex: first?.colorHex || "#737373",
          salePrice: first?.salePrice || 0,
          costPrice: first?.costPrice || 0,
          images: [] as ImageDraft[],
          sizes: variants.length
            ? variants.map((variant) => ({
                id: variant.id,
                sku: variant.sku,
                sizeLabel: variant.sizeLabel,
                stock: variant.stock,
                minimumStock: variant.minimumStock,
              }))
            : [newBlankSize(existing.sku)],
        };
      })
    : [newBlankColor(existing.sku)];

  const details: ImageDraft[] = [];

  existing.images.forEach((image) => {
    const meta = parseImageMeta(image.altText);
    const draft = {
      id: image.id,
      url: image.url,
      altText: meta.altText,
    };

    if (meta.role === "detail") {
      details.push(draft);
      return;
    }

    const targetColor = meta.colorName || colors[0]?.colorName || "Default";
    const group = colors.find((item) => item.colorName === targetColor) ?? colors[0];
    group.images.push(draft);
  });

  return { colors, details };
}

async function uploadFiles(files: File[]) {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  const response = await fetch("/api/admin/product-images/upload", {
    method: "POST",
    body: formData,
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Upload failed");
  }

  return (data.images ?? []) as Array<{ url: string; name: string }>;
}

function ImageDropZone({
  onImages,
  uploading,
}: {
  onImages: (images: ImageDraft[]) => void;
  uploading: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    const list = Array.from(files ?? []);
    if (list.length === 0) return;
    const uploaded = await uploadFiles(list);
    onImages(
      uploaded.map((item) => ({
        id: makeId("image"),
        url: item.url,
        altText: item.name.replace(/\.[^.]+$/, ""),
      })),
    );
  };

  return (
    <div
      className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50/70 px-4 py-8 text-center transition-colors hover:border-neutral-400 hover:bg-neutral-50"
      onDragOver={(event) => {
        event.preventDefault();
      }}
      onDrop={async (event) => {
        event.preventDefault();
        await handleFiles(event.dataTransfer.files);
      }}
    >
      <input
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        multiple
        onChange={async (event) => {
          await handleFiles(event.target.files);
          event.currentTarget.value = "";
        }}
        ref={inputRef}
        type="file"
      />
      <button className="mx-auto block rounded-full p-2 text-neutral-500 transition-colors hover:bg-white hover:text-neutral-950 disabled:text-neutral-400" disabled={uploading} onClick={() => inputRef.current?.click()} type="button" aria-label="Upload product images">
        <UploadCloud size={34} />
      </button>
      <p className="mt-3 text-neutral-500" style={{ fontSize: "12.5px", fontWeight: 600 }}>
        JPG, PNG, WEBP · ສູງສຸດ 5MB / ຮູບ
      </p>
    </div>
  );
}

export function CreateEditProductPage() {
  const { currentPage, navigate, selectedId, products, upsertProduct } = useApp();
  const feedback = useAdminFeedback();
  const isEdit = currentPage === "edit-product";
  const existing = isEdit ? products.find((product) => product.id === selectedId) ?? null : null;
  const initialMedia = useMemo(() => buildInitialColors(existing), [existing]);

  const [productName, setProductName] = useState(existing?.nameEn || existing?.nameLo || existing?.nameTh || "");
  const [description, setDescription] = useState(existing?.descriptionLo || existing?.descriptionEn || "");
  const [sku, setSku] = useState(existing?.sku ?? "");
  const [slug] = useState(existing?.slug ?? "");
  const [category, setCategory] = useState(existing?.category ?? "Jackets");
  const [status, setStatus] = useState<"active" | "hidden" | "archived">(existing?.status ?? "active");
  const [colorGroups, setColorGroups] = useState<ColorGroupDraft[]>(initialMedia.colors);
  const [detailImages, setDetailImages] = useState<ImageDraft[]>(initialMedia.details);
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [draggedImage, setDraggedImage] = useState<DraggedImage | null>(null);

  const displaySku = useMemo(() => sku || generatedProductSku(category, products, existing?.id), [category, existing?.id, products, sku]);
  const generatedSlug = useMemo(() => slugify(productName || displaySku || category || "product"), [category, productName, displaySku]);
  const displaySlug = slug || generatedSlug;
  const categories = useMemo(() => Array.from(new Set(storefrontCategories)), []);

  const totalStock = colorGroups.reduce((sum, group) => sum + group.sizes.reduce((sizeSum, size) => sizeSum + size.stock, 0), 0);
  const prices = colorGroups.map((group) => group.salePrice).filter((price) => price > 0);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;
  const firstColorImage = colorGroups.flatMap((group) => group.images)[0];
  const outCount = colorGroups.flatMap((group) => group.sizes).filter((size) => size.stock === 0).length;

  const updateColor = (id: string, patch: Partial<ColorGroupDraft>) => {
    setColorGroups((groups) => groups.map((group) => (group.id === id ? { ...group, ...patch } : group)));
  };

  const addColorGroup = () => {
    setColorGroups((groups) => [...groups, newBlankColor()]);
  };

  const removeColorGroup = async (id: string) => {
    const group = colorGroups.find((item) => item.id === id);
    const confirmed = await feedback.confirm({
      title: "ລຶບສີນີ້?",
      description: "ຮູບ ແລະ ໄຊສ໌ຂອງສີນີ້ຈະຖືກລຶບອອກຈາກຟອມ.",
      itemName: group?.colorName || group?.colorHex,
      confirmLabel: "ລຶບສີ",
    });
    if (!confirmed) return;
    setColorGroups((groups) => (groups.length <= 1 ? groups : groups.filter((group) => group.id !== id)));
    feedback.success("ລຶບສີສຳເລັດ", group?.colorName || undefined);
  };

  const addImagesToColor = async (colorId: string, images: ImageDraft[]) => {
    setUploading(true);
    try {
      setColorGroups((groups) => groups.map((group) => (group.id === colorId ? { ...group, images: [...group.images, ...images] } : group)));
    } finally {
      setUploading(false);
    }
  };

  const addDetailImages = async (images: ImageDraft[]) => {
    setUploading(true);
    try {
      setDetailImages((items) => [...items, ...images]);
    } finally {
      setUploading(false);
    }
  };

  const removeImageFromColor = async (colorId: string, imageId: string) => {
    const group = colorGroups.find((item) => item.id === colorId);
    const image = group?.images.find((item) => item.id === imageId);
    const confirmed = await feedback.confirm({
      title: "ລຶບຮູບນີ້?",
      description: "ຮູບນີ້ຈະຖືກນຳອອກຈາກກຸ່ມສີ.",
      itemName: image?.altText || image?.url,
      confirmLabel: "ລຶບຮູບ",
    });
    if (!confirmed) return;
    setColorGroups((groups) => groups.map((group) => (group.id === colorId ? { ...group, images: group.images.filter((image) => image.id !== imageId) } : group)));
    feedback.success("ລຶບຮູບສຳເລັດ");
  };

  const moveColorImage = (colorId: string, imageId: string, direction: -1 | 1) => {
    setColorGroups((groups) =>
      groups.map((group) => {
        if (group.id !== colorId) return group;
        const index = group.images.findIndex((image) => image.id === imageId);
        const nextIndex = index + direction;
        if (index < 0 || nextIndex < 0 || nextIndex >= group.images.length) return group;
        const next = [...group.images];
        const [item] = next.splice(index, 1);
        next.splice(nextIndex, 0, item);
        return { ...group, images: next };
      }),
    );
  };

  const moveColorImageTo = (colorId: string, fromImageId: string, toImageId: string) => {
    if (fromImageId === toImageId) return;

    setColorGroups((groups) =>
      groups.map((group) => {
        if (group.id !== colorId) return group;
        const fromIndex = group.images.findIndex((image) => image.id === fromImageId);
        const toIndex = group.images.findIndex((image) => image.id === toImageId);
        if (fromIndex < 0 || toIndex < 0) return group;

        const next = [...group.images];
        const [item] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, item);
        return { ...group, images: next };
      }),
    );
  };

  const moveDetailImage = (imageId: string, direction: -1 | 1) => {
    setDetailImages((items) => {
      const index = items.findIndex((image) => image.id === imageId);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= items.length) return items;
      const next = [...items];
      const [item] = next.splice(index, 1);
      next.splice(nextIndex, 0, item);
      return next;
    });
  };

  const moveDetailImageTo = (fromImageId: string, toImageId: string) => {
    if (fromImageId === toImageId) return;

    setDetailImages((items) => {
      const fromIndex = items.findIndex((image) => image.id === fromImageId);
      const toIndex = items.findIndex((image) => image.id === toImageId);
      if (fromIndex < 0 || toIndex < 0) return items;

      const next = [...items];
      const [item] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, item);
      return next;
    });
  };

  const updateSize = (colorId: string, sizeId: string, patch: Partial<SizeDraft>) => {
    setColorGroups((groups) =>
      groups.map((group) =>
        group.id === colorId
          ? {
              ...group,
              sizes: group.sizes.map((size) => (size.id === sizeId ? { ...size, ...patch } : size)),
            }
          : group,
      ),
    );
  };

  const addSize = (colorId: string) => {
    setColorGroups((groups) => groups.map((group) => (group.id === colorId ? { ...group, sizes: [...group.sizes, newBlankSize()] } : group)));
  };

  const removeSize = async (colorId: string, sizeId: string) => {
    const group = colorGroups.find((item) => item.id === colorId);
    const size = group?.sizes.find((item) => item.id === sizeId);
    const confirmed = await feedback.confirm({
      title: "ລຶບໄຊສ໌ນີ້?",
      description: "ໄຊສ໌ນີ້ຈະຖືກນຳອອກຈາກ variant ຂອງສີນີ້.",
      itemName: size?.sizeLabel,
      confirmLabel: "ລຶບໄຊສ໌",
    });
    if (!confirmed) return;
    setColorGroups((groups) =>
      groups.map((group) =>
        group.id === colorId && group.sizes.length > 1
          ? {
              ...group,
              sizes: group.sizes.filter((size) => size.id !== sizeId),
            }
          : group,
      ),
    );
    feedback.success("ລຶບໄຊສ໌ສຳເລັດ", size?.sizeLabel);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError("");

    const name = productName.trim();
    const cleanSku = displaySku.trim().toUpperCase();
    const cleanSlug = displaySlug.trim() || slugify(name || cleanSku);

    if (!name || !cleanSlug) {
      setSaving(false);
      const message = "ກະລຸນາໃສ່ຊື່ສິນຄ້າກ່ອນບັນທຶກ.";
      setSaveError(message);
      feedback.error("ບັນທຶກບໍ່ສຳເລັດ", message);
      return;
    }

    const hasColorImage = colorGroups.some((group) => group.images.length > 0);
    if (!hasColorImage) {
      setSaving(false);
      const message = "ກະລຸນາເພີ່ມຮູບສິນຄ້າຢ່າງໜ້ອຍ 1 ຮູບໃນກຸ່ມສີ.";
      setSaveError(message);
      feedback.error("ບັນທຶກບໍ່ສຳເລັດ", message);
      return;
    }

    const normalizedVariants = colorGroups.flatMap((group, groupIndex) => {
      const colorName = group.colorName.trim() || `Color ${groupIndex + 1}`;
      return group.sizes.map((size, sizeIndex) => {
        const sizeLabel = size.sizeLabel.trim() || "OS";
        return {
          id: size.id,
          sku: size.sku.trim() || generatedVariantSku(cleanSku, group, size, sizeIndex),
          sizeLabel,
          colorName,
          colorHex: group.colorHex,
          optionLabel: `${colorName} / ${sizeLabel}`,
          salePrice: group.salePrice,
          costPrice: group.costPrice,
          stock: size.stock,
          minimumStock: size.minimumStock,
          status: "active" as const,
        };
      });
    });

    const normalizedImages = [
      ...colorGroups.flatMap((group, groupIndex) => {
        const colorName = group.colorName.trim() || `Color ${groupIndex + 1}`;
        return group.images.map((image, imageIndex) => ({
          id: image.id,
          url: image.url,
          altText: `[color:${colorName}] ${cleanAlt(image.altText, name)}`,
          isPrimary: groupIndex === 0 && imageIndex === 0,
        }));
      }),
      ...detailImages.map((image) => ({
        id: image.id,
        url: image.url,
        altText: `[detail] ${cleanAlt(image.altText, name)}`,
        isPrimary: false,
      })),
    ];

    const product: Product = {
      id: existing?.id ?? `product-${Date.now()}`,
      nameTh: name,
      nameEn: name,
      sku: cleanSku,
      slug: cleanSlug,
      category,
      status,
      descriptionEn: description,
      descriptionLo: description,
      images: normalizedImages,
      variants: normalizedVariants,
      salePrice: minPrice,
      costPrice: colorGroups.map((group) => group.costPrice).filter((value) => value > 0).sort((a, b) => a - b)[0] ?? 0,
      stock: totalStock,
      minimumStock: normalizedVariants.reduce((sum, variant) => sum + variant.minimumStock, 0),
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };

    try {
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(product),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || "Save failed");
      }

      upsertProduct(result.product ?? product);
      feedback.success(isEdit ? "ບັນທຶກການແກ້ໄຂສຳເລັດ" : "ສ້າງສິນຄ້າສຳເລັດ", name);
      setSaved(true);
      window.setTimeout(() => navigate("products"), 1000);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Save failed";
      setSaveError(message);
      feedback.error("ບັນທຶກບໍ່ສຳເລັດ", message);
    } finally {
      setSaving(false);
    }
  };

  if (saved) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-green-100">
          <CheckCircle className="text-green-600" size={28} />
        </div>
        <p className="text-neutral-950" style={{ fontSize: "17px", fontWeight: 700 }}>
          {isEdit ? "ບັນທຶກການແກ້ໄຂສຳເລັດ" : "ສ້າງສິນຄ້າສຳເລັດ"}
        </p>
        <p className="text-neutral-500" style={{ fontSize: "13px" }}>ກຳລັງກັບໄປໜ້າສິນຄ້າ...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] space-y-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button className="rounded-lg p-2 text-neutral-500 transition-colors hover:bg-white hover:text-neutral-950" onClick={() => navigate("products")} type="button">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-neutral-950" style={{ fontSize: "20px", fontWeight: 750, letterSpacing: "-0.02em" }}>
              {isEdit ? "ແກ້ໄຂສິນຄ້າ" : "ເພີ່ມສິນຄ້າໃໝ່"}
            </h1>
            <p className="mt-1 text-neutral-500" style={{ fontSize: "13px" }}>
              ຈັດການຊື່, ສີ, ຮູບ, ໄຊສ໌ ແລະສະຕັອກຈາກໜ້າດຽວ.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-neutral-700 outline-none focus:ring-2 focus:ring-neutral-400" onChange={(event) => setStatus(event.target.value as "active" | "hidden" | "archived")} style={{ fontSize: "13px" }} value={status}>
            <option value="active">ເປີດໃຫ້ຂຶ້ນເວັບ</option>
            <option value="hidden">ເຊື່ອງໄວ້</option>
            <option value="archived">ເກັບເຂົ້າຄັງ</option>
          </select>
          <button className="inline-flex items-center gap-2 rounded-lg bg-neutral-950 px-5 py-2.5 text-white transition-colors hover:bg-neutral-800 disabled:opacity-60" disabled={saving || uploading} onClick={handleSave} style={{ fontSize: "13.5px", fontWeight: 650 }} type="button">
            <Save size={14} />
            {saving ? "ກຳລັງບັນທຶກ..." : "ບັນທຶກ"}
          </button>
        </div>
      </div>

      {saveError ? (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-red-700" style={{ fontSize: "13px", fontWeight: 650 }}>
          {saveError}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <section className="rounded-xl border border-neutral-100 bg-white p-5">
            <h2 className="text-neutral-950" style={{ fontSize: "15px", fontWeight: 700 }}>ຂໍ້ມູນສິນຄ້າ</h2>
            <div className="mt-4 grid gap-3">
              <label className="block">
                {fieldLabel("ຊື່ສິນຄ້າ")}
                <input className={inputClass} onChange={(event) => setProductName(event.target.value)} placeholder="ໃສ່ຊື່ສິນຄ້າ ພາສາໃດກໍໄດ້" style={{ fontSize: "13.5px" }} value={productName} />
              </label>

              <div className="grid gap-3 md:grid-cols-3">
                <label className="block">
                  {fieldLabel("SKU ຫຼັກ")}
                  <input className={`${inputClass} font-mono`} onChange={(event) => setSku(event.target.value.toUpperCase())} placeholder="auto" style={{ fontSize: "13.5px" }} value={displaySku} />
                </label>
                <label className="block">
                  {fieldLabel("Slug")}
                  <input className={`${inputClass} text-neutral-500`} readOnly placeholder="auto" style={{ fontSize: "13.5px" }} value={displaySlug} />
                </label>
                <label className="block">
                  {fieldLabel("ໝວດໝູ່ໜ້າເວັບ")}
                  <select className={inputClass} onChange={(event) => setCategory(event.target.value)} style={{ fontSize: "13.5px" }} value={category}>
                    {categories.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block">
                {fieldLabel("ລາຍລະອຽດສິນຄ້າ")}
                <textarea className={inputClass} onChange={(event) => setDescription(event.target.value)} placeholder="ໃສ່ລາຍລະອຽດ ພາສາໃດກໍໄດ້..." rows={4} style={{ fontSize: "13.5px" }} value={description} />
              </label>
            </div>
          </section>

          <section className="space-y-3 rounded-xl border border-neutral-100 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-neutral-950" style={{ fontSize: "15px", fontWeight: 700 }}>ສີສິນຄ້າ, ຮູບ, ລາຄາ ແລະສະຕັອກ</h2>
                <p className="mt-1 text-neutral-500" style={{ fontSize: "12.5px" }}>
                  ເພີ່ມສີແຕ່ລະສີເປັນກຸ່ມ. ຮູບທຳອິດຂອງສີນັ້ນຈະເປັນຮູບຫຼັກ.
                </p>
              </div>
              <button className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-2 text-neutral-700 transition-colors hover:border-neutral-400" onClick={addColorGroup} style={{ fontSize: "13px", fontWeight: 600 }} type="button">
                <Plus size={13} />
                ເພີ່ມສີ
              </button>
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-amber-800 ring-1 ring-amber-100" style={{ fontSize: "12px", fontWeight: 650 }}>
              <Ruler size={13} />
              1920×2400 px, 4:5, contain
            </span>

            {colorGroups.map((group, groupIndex) => (
              <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-4" key={group.id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-neutral-400 ring-1 ring-neutral-200">
                      <GripVertical size={16} />
                    </span>
                    <div>
                      <p className="text-neutral-950" style={{ fontSize: "14px", fontWeight: 750 }}>ສີທີ {groupIndex + 1}</p>
                      <p className="text-neutral-500" style={{ fontSize: "12px" }}>ລາກຮູບມາໃສ່ ຫຼື ຄລິກເລືອກຫຼາຍຮູບໄດ້</p>
                    </div>
                  </div>
                  {colorGroups.length > 1 ? (
                    <button className="rounded-lg p-2 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600" onClick={() => void removeColorGroup(group.id)} type="button">
                      <Trash2 size={14} />
                    </button>
                  ) : null}
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-4">
                  <label>
                    {fieldLabel("ຊື່ສີ")}
                    <input className={inputClass} onChange={(event) => updateColor(group.id, { colorName: event.target.value })} placeholder="Red / Black" style={{ fontSize: "13px" }} value={group.colorName} />
                  </label>
                  <label>
                    {fieldLabel("Color hex")}
                    <div className="flex gap-2">
                      <input className="h-10 w-12 cursor-pointer rounded-lg border border-neutral-200 bg-white" onChange={(event) => updateColor(group.id, { colorHex: event.target.value })} type="color" value={group.colorHex} />
                      <input className="min-w-0 flex-1 rounded-lg border border-neutral-200 bg-neutral-50 px-2 font-mono outline-none focus:ring-2 focus:ring-neutral-400" onChange={(event) => updateColor(group.id, { colorHex: event.target.value })} style={{ fontSize: "12px" }} value={group.colorHex} />
                    </div>
                  </label>
                  <label>
                    {fieldLabel("ລາຄາຂາຍ K")}
                    <input className={inputClass} inputMode="numeric" onChange={(event) => updateColor(group.id, { salePrice: parsePriceInput(event.target.value) })} pattern="[0-9]*" style={{ fontSize: "13px" }} type="text" value={group.salePrice || ""} />
                  </label>
                  <label>
                    {fieldLabel("ຕົ້ນທຶນ K")}
                    <input className={inputClass} inputMode="numeric" onChange={(event) => updateColor(group.id, { costPrice: parsePriceInput(event.target.value) })} pattern="[0-9]*" style={{ fontSize: "13px" }} type="text" value={group.costPrice || ""} />
                  </label>
                </div>

                <div className="mt-4">
                  <ImageDropZone
                    onImages={(images) => void addImagesToColor(group.id, images)}
                    uploading={uploading}
                  />
                </div>

                {group.images.length > 0 ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {group.images.map((image, imageIndex) => (
                      <div
                        className="cursor-grab rounded-xl border border-neutral-100 bg-white p-3 transition hover:border-neutral-300 active:cursor-grabbing"
                        draggable
                        key={image.id}
                        onDragEnd={() => setDraggedImage(null)}
                        onDragOver={(event) => event.preventDefault()}
                        onDragStart={() => setDraggedImage({ type: "color", colorId: group.id, imageId: image.id })}
                        onDrop={(event) => {
                          event.preventDefault();
                          if (draggedImage?.type === "color" && draggedImage.colorId === group.id) {
                            moveColorImageTo(group.id, draggedImage.imageId, image.id);
                          }
                          setDraggedImage(null);
                        }}
                      >
                        <div className="relative rounded-lg bg-[#f4f4f4] p-2">
                          <img alt={image.altText} className="mx-auto h-36 w-28 rounded-md object-contain" src={image.url} />
                          <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-neutral-700 shadow-sm" style={{ fontSize: "10px", fontWeight: 700 }}>
                            {imageIndex + 1}
                          </span>
                          {imageIndex === 0 ? (
                            <span className="absolute right-2 top-2 rounded-full bg-neutral-950 px-2 py-0.5 text-white" style={{ fontSize: "10px", fontWeight: 700 }}>
                              ຮູບຫຼັກ
                            </span>
                          ) : null}
                        </div>
                        <input className="mt-2 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-neutral-400" onChange={(event) => {
                          const next = group.images.map((item) => (item.id === image.id ? { ...item, altText: event.target.value } : item));
                          updateColor(group.id, { images: next });
                        }} placeholder="Alt text" style={{ fontSize: "12px" }} value={image.altText} />
                        <div className="mt-2 grid grid-cols-3 gap-2">
                          <button className="rounded-lg border border-neutral-200 px-2 py-2 text-neutral-600 disabled:opacity-35" disabled={imageIndex === 0} onClick={() => moveColorImage(group.id, image.id, -1)} style={{ fontSize: "12px", fontWeight: 650 }} type="button">
                            ຊ້າຍ
                          </button>
                          <button className="rounded-lg border border-neutral-200 px-2 py-2 text-neutral-600 disabled:opacity-35" disabled={imageIndex === group.images.length - 1} onClick={() => moveColorImage(group.id, image.id, 1)} style={{ fontSize: "12px", fontWeight: 650 }} type="button">
                            ຂວາ
                          </button>
                          <button className="rounded-lg border border-red-100 bg-red-50 px-2 py-2 text-red-600" onClick={() => void removeImageFromColor(group.id, image.id)} type="button">
                            <Trash2 className="mx-auto" size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}

                <div className="mt-5 rounded-xl bg-white p-3 ring-1 ring-neutral-100">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-neutral-800" style={{ fontSize: "13px", fontWeight: 750 }}>ໄຊສ໌ ແລະສະຕັອກ</p>
                    <button className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-2 text-neutral-700 hover:border-neutral-400" onClick={() => addSize(group.id)} style={{ fontSize: "12.5px", fontWeight: 650 }} type="button">
                      <Plus size={12} />
                      ເພີ່ມໄຊສ໌
                    </button>
                  </div>
                  <div className="mt-3 space-y-2">
                    {group.sizes.map((size, sizeIndex) => (
                      <div className="grid gap-2 md:grid-cols-[1fr_1fr_1fr_1fr_auto]" key={size.id}>
                        <input className={`${inputClass} font-mono`} onChange={(event) => updateSize(group.id, size.id, { sku: event.target.value.toUpperCase() })} placeholder="auto SKU" style={{ fontSize: "12.5px" }} value={size.sku || generatedVariantSku(displaySku, group, size, sizeIndex)} />
                        <input className={inputClass} onChange={(event) => updateSize(group.id, size.id, { sizeLabel: event.target.value })} placeholder="S / M / L / XL" style={{ fontSize: "12.5px" }} value={size.sizeLabel} />
                        <input className={inputClass} onChange={(event) => updateSize(group.id, size.id, { stock: Number(event.target.value) || 0 })} placeholder="ສະຕັອກ" style={{ fontSize: "12.5px" }} type="number" value={size.stock} />
                        <input className={inputClass} onChange={(event) => updateSize(group.id, size.id, { minimumStock: Number(event.target.value) || 0 })} placeholder="ແຈ້ງເຕືອນຂັ້ນຕ່ຳ" style={{ fontSize: "12.5px" }} type="number" value={size.minimumStock} />
                        <button className="rounded-lg border border-red-100 bg-red-50 px-3 text-red-600 disabled:opacity-35" disabled={group.sizes.length === 1} onClick={() => void removeSize(group.id, size.id)} type="button">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </section>

          <section className="rounded-xl border border-neutral-100 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-neutral-950" style={{ fontSize: "15px", fontWeight: 700 }}>ຮູບ Detail ລວມ</h2>
                <p className="mt-1 text-neutral-500" style={{ fontSize: "12.5px" }}>
                  ຮູບຜ້າ, logo, fit, close-up ໃຊ້ລວມທຸກສີ. ລາກເພີ່ມໄດ້ຫຼາຍຮູບ.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-amber-800 ring-1 ring-amber-100" style={{ fontSize: "12px", fontWeight: 650 }}>
                <Ruler size={13} />
                1920×2400 px
              </span>
            </div>

            <div className="mt-4">
              <ImageDropZone
                onImages={(images) => void addDetailImages(images)}
                uploading={uploading}
              />
            </div>

            {detailImages.length > 0 ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {detailImages.map((image, index) => (
                  <div
                    className="cursor-grab rounded-xl border border-neutral-100 bg-neutral-50 p-3 transition hover:border-neutral-300 active:cursor-grabbing"
                    draggable
                    key={image.id}
                    onDragEnd={() => setDraggedImage(null)}
                    onDragOver={(event) => event.preventDefault()}
                    onDragStart={() => setDraggedImage({ type: "detail", imageId: image.id })}
                    onDrop={(event) => {
                      event.preventDefault();
                      if (draggedImage?.type === "detail") {
                        moveDetailImageTo(draggedImage.imageId, image.id);
                      }
                      setDraggedImage(null);
                    }}
                  >
                    <div className="relative rounded-lg bg-white p-2">
                      <img alt={image.altText} className="mx-auto h-36 w-28 rounded-md object-contain" src={image.url} />
                      <span className="absolute left-2 top-2 rounded-full bg-neutral-950 px-2 py-0.5 text-white" style={{ fontSize: "10px", fontWeight: 700 }}>
                        Detail {index + 1}
                      </span>
                    </div>
                    <input className="mt-2 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-neutral-400" onChange={(event) => {
                      setDetailImages((items) => items.map((item) => (item.id === image.id ? { ...item, altText: event.target.value } : item)));
                    }} placeholder="Alt text" style={{ fontSize: "12px" }} value={image.altText} />
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      <button className="rounded-lg border border-neutral-200 px-2 py-2 text-neutral-600 disabled:opacity-35" disabled={index === 0} onClick={() => moveDetailImage(image.id, -1)} style={{ fontSize: "12px", fontWeight: 650 }} type="button">
                        ຊ້າຍ
                      </button>
                      <button className="rounded-lg border border-neutral-200 px-2 py-2 text-neutral-600 disabled:opacity-35" disabled={index === detailImages.length - 1} onClick={() => moveDetailImage(image.id, 1)} style={{ fontSize: "12px", fontWeight: 650 }} type="button">
                        ຂວາ
                      </button>
                      <button className="rounded-lg border border-red-100 bg-red-50 px-2 py-2 text-red-600" onClick={() => setDetailImages((items) => items.filter((item) => item.id !== image.id))} type="button">
                        <Trash2 className="mx-auto" size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        </div>

        <aside className="space-y-4">
          <section className="sticky top-5 rounded-xl bg-neutral-950 p-5 text-white">
            <div className="flex items-center gap-2 text-white/60" style={{ fontSize: "12px" }}>
              <PackageCheck size={14} />
              ສະຫຼຸບກ່ອນບັນທຶກ
            </div>

            <div className="mt-5 space-y-4">
              {firstColorImage ? (
                <div className="rounded-xl bg-white/7 p-3">
                  <img alt={firstColorImage.altText} className="mx-auto h-44 w-36 object-contain" src={firstColorImage.url} />
                </div>
              ) : (
                <div className="flex h-44 items-center justify-center rounded-xl bg-white/7 text-white/40" style={{ fontSize: "12px", fontWeight: 650 }}>
                  ຍັງບໍ່ມີຮູບຫຼັກ
                </div>
              )}

              <div>
                <p className="text-white/50" style={{ fontSize: "12px" }}>ລາຄາຂາຍ</p>
                <p className="mt-1 text-white" style={{ fontSize: minPrice === maxPrice ? "25px" : "20px", fontWeight: 750, letterSpacing: "-0.03em" }}>
                  {minPrice === maxPrice ? money(minPrice) : `${money(minPrice)} - ${money(maxPrice)}`}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
                <div>
                  <p className="text-white/50" style={{ fontSize: "12px" }}>ກຸ່ມສີ</p>
                  <p className="mt-1 text-white" style={{ fontSize: "26px", fontWeight: 750 }}>{colorGroups.length}</p>
                </div>
                <div>
                  <p className="text-white/50" style={{ fontSize: "12px" }}>ສະຕັອກລວມ</p>
                  <p className="mt-1 text-white" style={{ fontSize: "26px", fontWeight: 750 }}>{totalStock}</p>
                </div>
              </div>

              <div className="rounded-xl bg-white/7 p-3">
                <div className="flex gap-2">
                  <Info className="mt-0.5 shrink-0 text-amber-300" size={15} />
                  <p className="text-white/65" style={{ fontSize: "12px", lineHeight: 1.55 }}>
                    ສະຕັອກ 0 ຈະຍັງສະແດງຢູ່ໜ້າເວັບ ແຕ່ລູກຄ້າກົດເລືອກຊື້ບໍ່ໄດ້. ຕອນນີ້ມີ {outCount} ໄຊສ໌ທີ່ໝົດ.
                  </p>
                </div>
              </div>

              <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-white py-3 text-neutral-950 transition-colors hover:bg-neutral-100 disabled:opacity-60" disabled={saving || uploading} onClick={handleSave} style={{ fontSize: "14px", fontWeight: 700 }} type="button">
                <Save size={14} />
                {saving ? "ກຳລັງບັນທຶກ..." : isEdit ? "ບັນທຶກການແກ້ໄຂ" : "ສ້າງສິນຄ້າ"}
              </button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
