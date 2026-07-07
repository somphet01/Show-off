import { useMemo, useState } from "react";
import { AlertTriangle, Edit, Eye, EyeOff, Image as ImageIcon, PackageCheck, Plus, Search, Shirt, Trash2, X } from "lucide-react";
import { useApp } from "../../context";
import { useAdminFeedback } from "../ui/AdminFeedback";
import type { ProductStatus } from "../../types";

const ALL_CATEGORY = "ທັງໝົດ";

const statusLabel: Record<ProductStatus, string> = {
  active: "ເປີດໃຊ້ງານ",
  hidden: "ເຊື່ອງໄວ້",
  archived: "ເກັບເຂົ້າຄັງ",
};

const statusClass: Record<ProductStatus, string> = {
  active: "bg-green-50 text-green-700 ring-green-100",
  hidden: "bg-neutral-100 text-neutral-600 ring-neutral-200",
  archived: "bg-red-50 text-red-600 ring-red-100",
};

const websiteCategories = [
  ALL_CATEGORY,
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

function money(value: number) {
  return Math.round(value).toLocaleString("en-US");
}

function productDisplayPrice(product: { salePrice: number; variants: { salePrice: number }[] }) {
  const variantPrices = product.variants
    .map((variant) => Number(variant.salePrice))
    .filter((price) => Number.isFinite(price) && price > 0);

  if (variantPrices.length > 0) {
    const min = Math.min(...variantPrices);
    const max = Math.max(...variantPrices);
    return min === max ? money(min) : `${money(min)} - ${money(max)}`;
  }

  return money(Number(product.salePrice) || 0);
}

export function ProductsListPage() {
  const { navigate, products, removeProduct } = useApp();
  const feedback = useAdminFeedback();
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState(ALL_CATEGORY);
  const [filterStatus, setFilterStatus] = useState<ProductStatus | "all">("all");
  const [filterStock, setFilterStock] = useState<"all" | "low" | "out">("all");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const categories = useMemo(() => {
    const existing = products.map((product) => product.category).filter(Boolean);
    return Array.from(new Set([...websiteCategories, ...existing]));
  }, [products]);

  const displayProducts = useMemo(() => {
    const validCategories = new Set(websiteCategories.filter((category) => category !== ALL_CATEGORY));
    return products.filter((product) => validCategories.has(product.category));
  }, [products]);

  const filtered = displayProducts.filter((product) => {
    const query = search.trim().toLowerCase();
    const matchSearch =
      !query ||
      product.nameEn.toLowerCase().includes(query) ||
      (product.nameLo ?? "").toLowerCase().includes(query) ||
      product.nameTh.toLowerCase().includes(query) ||
      product.sku.toLowerCase().includes(query) ||
      product.slug.toLowerCase().includes(query);
    const hasLow = product.variants.some((variant) => variant.stock > 0 && variant.stock <= variant.minimumStock);
    const hasOut = product.variants.some((variant) => variant.stock === 0);

    return (
      matchSearch &&
      (filterCat === ALL_CATEGORY || product.category === filterCat) &&
      (filterStatus === "all" || product.status === filterStatus) &&
      (filterStock === "all" || (filterStock === "low" && hasLow) || (filterStock === "out" && hasOut))
    );
  });

  const totalProducts = displayProducts.length;
  const activeProducts = displayProducts.filter((product) => product.status === "active").length;
  const totalVariants = displayProducts.reduce((sum, product) => sum + product.variants.length, 0);
  const outVariants = displayProducts.flatMap((product) => product.variants).filter((variant) => variant.stock === 0).length;
  const productToDelete = deleteTarget ? displayProducts.find((product) => product.id === deleteTarget) : null;

  const deleteProduct = async (target = productToDelete) => {
    if (!target) return;

    const confirmed = await feedback.confirm({
      title: "ລຶບລາຍການນີ້?",
      description: "ກວດສອບໃຫ້ແນ່ໃຈກ່ອນລຶບ. ຫຼັງຈາກຢືນຢັນລາຍການນີ້ຈະຖືກລຶບອອກ.",
      itemName: `${target.nameEn} · ${target.sku}`,
      confirmLabel: "ລຶບ",
    });

    if (!confirmed) return;

    setDeleteError("");
    setDeletingId(target.id);

    try {
      const response = await fetch(`/api/admin/products?id=${encodeURIComponent(target.id)}`, { method: "DELETE" });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || "Delete failed.");
      }

      removeProduct(target.id);
      setDeleteTarget(null);
      feedback.success("ລຶບສຳເລັດ", target.nameEn);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Delete failed.");
      feedback.error("ລຶບບໍ່ສຳເລັດ", error instanceof Error ? error.message : "Delete failed.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-[1800px] space-y-4 p-5">
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-neutral-950" style={{ fontSize: "16px", fontWeight: 750 }}>ລຶບສິນຄ້ານີ້?</h2>
                <p className="mt-1 text-neutral-500" style={{ fontSize: "13px" }}>{productToDelete.nameEn}</p>
              </div>
              <button className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900" onClick={() => setDeleteTarget(null)} type="button">
                <X size={16} />
              </button>
            </div>

            {deleteError && (
              <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-red-700" style={{ fontSize: "12.5px", fontWeight: 600 }}>{deleteError}</p>
            )}

            <div className="mt-5 flex gap-2">
              <button
                className="flex-1 rounded-xl border border-neutral-200 py-2.5 text-neutral-700 transition-colors hover:bg-neutral-50"
                onClick={() => setDeleteTarget(null)}
                style={{ fontSize: "13px", fontWeight: 650 }}
                type="button"
              >
                ຍົກເລີກ
              </button>
              <button
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-white transition-colors hover:bg-red-700 disabled:opacity-60"
                disabled={deletingId === productToDelete.id}
                onClick={() => void deleteProduct()}
                style={{ fontSize: "13px", fontWeight: 700 }}
                type="button"
              >
                {deletingId === productToDelete.id ? "ກຳລັງລຶບ..." : "ລຶບສິນຄ້າ"}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-neutral-950" style={{ fontSize: "20px", fontWeight: 750, letterSpacing: "-0.02em" }}>
            ສິນຄ້າ
          </h1>
          <p className="mt-1 text-neutral-500" style={{ fontSize: "13px" }}>
            ເພີ່ມສິນຄ້າຈາກຈຸດດຽວ ແລ້ວລະບົບຈະແຍກຮູບ, ສີ, ໄຊສ໌ ແລະສະຕັອກໃຫ້.
          </p>
        </div>

        <button
          onClick={() => navigate("create-product")}
          className="inline-flex items-center gap-2 rounded-lg bg-neutral-950 px-4 py-2.5 text-white transition-colors hover:bg-neutral-800"
          style={{ fontSize: "13px", fontWeight: 650 }}
          type="button"
        >
          <Plus size={14} />
          ເພີ່ມສິນຄ້າໃໝ່
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "ສິນຄ້າທັງໝົດ", value: totalProducts, icon: <Shirt size={17} />, tone: "text-neutral-950" },
          { label: "ເປີດໂຊວ໌ໃນເວັບ", value: activeProducts, icon: <Eye size={17} />, tone: "text-green-700" },
          { label: "Variant ສີ/ໄຊສ໌", value: totalVariants, icon: <PackageCheck size={17} />, tone: "text-neutral-950" },
          { label: "Variant ໝົດສະຕັອກ", value: outVariants, icon: <AlertTriangle size={17} />, tone: "text-red-600" },
        ].map((item) => (
          <div className="rounded-xl border border-neutral-100 bg-white p-4" key={item.label}>
            <div className="flex items-center justify-between">
              <p className="text-neutral-500" style={{ fontSize: "12.5px" }}>{item.label}</p>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700">{item.icon}</span>
            </div>
            <p className={`mt-2 ${item.tone}`} style={{ fontSize: "26px", fontWeight: 750, letterSpacing: "-0.03em" }}>
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-neutral-100 bg-white p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-[240px] flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" size={14} />
            <input
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50 py-2.5 pl-10 pr-4 text-neutral-900 outline-none transition focus:border-transparent focus:ring-2 focus:ring-neutral-400"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="ຄົ້ນຫາຊື່ສິນຄ້າ, SKU ຫຼື slug..."
              style={{ fontSize: "13.5px" }}
              value={search}
            />
          </div>

          <select
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-neutral-700 outline-none focus:ring-2 focus:ring-neutral-400"
            onChange={(event) => setFilterCat(event.target.value)}
            style={{ fontSize: "13px" }}
            value={filterCat}
          >
            {categories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          <select
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-neutral-700 outline-none focus:ring-2 focus:ring-neutral-400"
            onChange={(event) => setFilterStatus(event.target.value as ProductStatus | "all")}
            style={{ fontSize: "13px" }}
            value={filterStatus}
          >
            <option value="all">ທຸກສະຖານະ</option>
            <option value="active">ເປີດໃຊ້ງານ</option>
            <option value="hidden">ເຊື່ອງໄວ້</option>
            <option value="archived">ເກັບເຂົ້າຄັງ</option>
          </select>

          <select
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-neutral-700 outline-none focus:ring-2 focus:ring-neutral-400"
            onChange={(event) => setFilterStock(event.target.value as "all" | "low" | "out")}
            style={{ fontSize: "13px" }}
            value={filterStock}
          >
            <option value="all">ທຸກສະຕັອກ</option>
            <option value="low">ສະຕັອກໃກ້ໝົດ</option>
            <option value="out">ໝົດແລ້ວ</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-neutral-100 bg-white py-16 text-center">
          <p className="text-neutral-500" style={{ fontSize: "14px" }}>ບໍ່ພົບສິນຄ້າຕາມເງື່ອນໄຂນີ້</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-px bg-neutral-200 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8">
          {filtered.map((product) => {
            const totalStock = product.variants.reduce((sum, variant) => sum + variant.stock, 0);
            const hasLow = product.variants.some((variant) => variant.stock > 0 && variant.stock <= variant.minimumStock);
            const hasOut = product.variants.some((variant) => variant.stock === 0);
            const colors = Array.from(new Map(product.variants.map((variant) => [variant.colorName, variant])).values());
            const sizes = Array.from(new Set(product.variants.map((variant) => variant.sizeLabel).filter(Boolean)));

            return (
              <article className="group overflow-hidden bg-white transition-colors hover:bg-neutral-50" key={product.id}>
                <div className="relative bg-[#f4f4f4]">
                  <img
                    alt={product.images[0]?.altText ?? product.nameEn}
                    className="aspect-[4/5] w-full object-cover"
                    src={product.images[0]?.url}
                  />

                  <div className="absolute left-2 top-2 flex flex-wrap gap-1">
                    <span className={`rounded-full px-2 py-0.5 ring-1 ${statusClass[product.status]}`} style={{ fontSize: "10px", fontWeight: 650 }}>
                      {statusLabel[product.status]}
                    </span>
                    {(hasOut || hasLow) && (
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-white ${hasOut ? "bg-red-500" : "bg-amber-500"}`} style={{ fontSize: "10px", fontWeight: 650 }}>
                        <AlertTriangle size={10} />
                        {hasOut ? "ມີໄຊສ໌ໝົດ" : "ໃກ້ໝົດ"}
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-2 right-2 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-neutral-700 shadow-sm transition-colors hover:text-neutral-950"
                      onClick={() => navigate("edit-product", product.id)}
                      type="button"
                    >
                      <Edit size={13} />
                    </button>
                  </div>
                </div>

                <div className="p-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="line-clamp-2 leading-tight text-neutral-950" style={{ fontSize: "10.5px", fontWeight: 750 }}>{product.nameEn}</p>
                      <p className="mt-1 truncate font-medium text-neutral-500" style={{ fontSize: "9.8px", letterSpacing: "-0.01em" }}>{product.sku}</p>
                    </div>
                    <p className="shrink-0 tabular-nums text-neutral-950" style={{ fontSize: "11px", fontWeight: 850, letterSpacing: "-0.02em" }}>{productDisplayPrice(product)}</p>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1">
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-neutral-600" style={{ fontSize: "10px" }}>{product.category}</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-neutral-600" style={{ fontSize: "10px" }}>
                      <ImageIcon size={10} />
                      {product.images.length} ຮູບ
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-2 border-t border-neutral-100 pt-2">
                    <div>
                      <div className="flex gap-1">
                        {colors.slice(0, 5).map((variant) => (
                          <span className="h-2.5 w-2.5 rounded-full border border-neutral-300" key={`${product.id}-${variant.colorName}`} style={{ background: variant.colorHex }} />
                        ))}
                      </div>
                      <p className="mt-1 text-neutral-400" style={{ fontSize: "11.5px" }}>{colors.length} ສີ, {sizes.length} ໄຊສ໌</p>
                    </div>

                    <div className="text-right">
                      <p className={totalStock === 0 ? "text-red-600" : totalStock <= product.minimumStock ? "text-amber-600" : "text-neutral-950"} style={{ fontSize: "16px", fontWeight: 750 }}>
                        {totalStock}
                      </p>
                      <p className="text-neutral-400" style={{ fontSize: "11.5px" }}>ຊິ້ນ</p>
                    </div>
                  </div>

                  <div className="mt-2 flex gap-1.5">
                    <button
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-neutral-200 py-1.5 text-neutral-700 transition-colors hover:border-neutral-400 hover:text-neutral-950"
                      onClick={() => navigate("edit-product", product.id)}
                      style={{ fontSize: "11px", fontWeight: 650 }}
                      type="button"
                    >
                      <Edit size={11} />
                      ແກ້ໄຂ
                    </button>
                    <button
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-950"
                      type="button"
                    >
                      {product.status === "active" ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                    <button
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-100 text-red-500 transition-colors hover:bg-red-50 hover:text-red-700"
                      onClick={() => void deleteProduct(product)}
                      type="button"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between text-neutral-400" style={{ fontSize: "12px" }}>
        <span>ສິນຄ້າໝົດສະຕັອກຍັງສະແດງຢູ່ໜ້າເວັບ ແຕ່ປຸ່ມຊື້ຈະກົດບໍ່ໄດ້.</span>
        <span>ສະແດງ {filtered.length} ຈາກ {displayProducts.length} ສິນຄ້າ</span>
      </div>
    </div>
  );
}
