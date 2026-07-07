import { useMemo, useState } from "react";
import { useApp } from "../../context";
import { Edit, History, PackageSearch, Search, SlidersHorizontal } from "lucide-react";
import type { Product } from "../../types";

function money(value: number) {
  return `${Math.round(value).toLocaleString("en-US")}K`;
}

function stockTone(stock: number, minimumStock: number) {
  if (stock === 0) return "out";
  if (stock <= minimumStock) return "low";
  return "ready";
}

function imageColorName(altText?: string) {
  const match = (altText ?? "").match(/^\[color:?([^\]]*)\]/i);
  return match?.[1]?.trim().toLowerCase() ?? "";
}

function imageForVariant(product: Product, colorName: string) {
  const target = colorName.trim().toLowerCase();
  const colorImage =
    product.images.find((image) => imageColorName(image.altText) === target && image.isPrimary) ??
    product.images.find((image) => imageColorName(image.altText) === target) ??
    product.images.find((image) => !image.altText?.toLowerCase().startsWith("[detail]") && image.isPrimary) ??
    product.images.find((image) => !image.altText?.toLowerCase().startsWith("[detail]")) ??
    product.images[0];

  return colorImage?.url;
}

const filterOptions = [
  { value: "all" as const, label: "ທັງໝົດ" },
  { value: "low" as const, label: "ໃກ້ໝົດ" },
  { value: "out" as const, label: "ໝົດແລ້ວ" },
];

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

export function InventoryPage() {
  const { navigate, products } = useApp();
  const [search, setSearch] = useState("");
  const [filterStock, setFilterStock] = useState<"all" | "low" | "out">("all");
  const visibleProducts = useMemo(() => {
    const validCategories = new Set(websiteCategories);
    return products.filter((product) => validCategories.has(product.category));
  }, [products]);

  const variants = useMemo(
    () =>
      visibleProducts.flatMap((product) =>
        product.variants.map((variant) => ({
          ...variant,
          productId: product.id,
          productName: product.nameEn,
          productNameLo: product.nameLo ?? product.nameTh,
          category: product.category,
          image: imageForVariant(product, variant.colorName),
          productStatus: product.status,
        })),
      ),
    [visibleProducts],
  );

  const filtered = variants.filter((variant) => {
    const query = search.trim().toLowerCase();
    const matchSearch =
      !query ||
      variant.productName.toLowerCase().includes(query) ||
      variant.productNameLo.toLowerCase().includes(query) ||
      variant.sku.toLowerCase().includes(query) ||
      variant.colorName.toLowerCase().includes(query) ||
      variant.sizeLabel.toLowerCase().includes(query) ||
      variant.optionLabel.toLowerCase().includes(query);
    const tone = stockTone(variant.stock, variant.minimumStock);

    return matchSearch && (filterStock === "all" || filterStock === tone);
  });

  const totalStock = variants.reduce((sum, variant) => sum + variant.stock, 0);
  const inventoryValue = variants.reduce((sum, variant) => sum + variant.stock * variant.costPrice, 0);
  const lowCount = variants.filter((variant) => stockTone(variant.stock, variant.minimumStock) === "low").length;
  const outCount = variants.filter((variant) => stockTone(variant.stock, variant.minimumStock) === "out").length;
  const activeCount = variants.length - outCount;

  return (
    <div className="mx-auto max-w-[1520px] space-y-5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-[680px]">
          <h1 className="text-neutral-950" style={{ fontSize: "24px", fontWeight: 760, letterSpacing: "-0.025em" }}>
            ສະຕັອກ
          </h1>
          <p className="mt-1.5 text-neutral-500" style={{ fontSize: "13.5px", lineHeight: 1.65 }}>
            ກວດສະຕັອກຈາກສີ, ໄຊສ໌ ແລະ SKU ຂອງສິນຄ້າ. ຖ້າສະຕັອກເປັນ 0 ສິນຄ້າຍັງໂຊວໃນໜ້າເວັບໄດ້ ແຕ່ກົດຊື້ບໍ່ໄດ້.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-neutral-700 shadow-[0_2px_8px_rgba(0,0,0,0.03)] transition-colors hover:border-neutral-300 hover:bg-neutral-50"
            onClick={() => navigate("stock-movement")}
            style={{ fontSize: "13px", fontWeight: 650 }}
            type="button"
          >
            <History size={14} />
            ປະຫວັດສະຕັອກ
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-lg bg-neutral-950 px-4 py-2.5 text-white shadow-[0_8px_18px_rgba(0,0,0,0.12)] transition-colors hover:bg-neutral-800"
            onClick={() => navigate("stock-adjustment")}
            style={{ fontSize: "13px", fontWeight: 700 }}
            type="button"
          >
            <SlidersHorizontal size={14} />
            ປັບສະຕັອກ
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl bg-neutral-950 p-5 text-white md:col-span-2">
          <div className="flex items-center gap-2 text-white/55" style={{ fontSize: "12.5px", fontWeight: 650 }}>
            <PackageSearch size={15} />
            ສະຕັອກລວມທັງໝົດ
          </div>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
            <p className="text-white" style={{ fontSize: "38px", fontWeight: 780, letterSpacing: "-0.04em", lineHeight: 1 }}>
              {totalStock.toLocaleString()}
            </p>
            <p className="rounded-full bg-white/8 px-3 py-1.5 text-white/70" style={{ fontSize: "12.5px", fontWeight: 600 }}>
              ມູນຄ່າຕົ້ນທຶນ {money(inventoryValue)}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-100 bg-white p-5">
          <p className="text-neutral-500" style={{ fontSize: "12.5px", fontWeight: 650 }}>ພ້ອມຂາຍ</p>
          <p className="mt-2 text-neutral-950" style={{ fontSize: "30px", fontWeight: 760, letterSpacing: "-0.03em" }}>{activeCount}</p>
          <p className="text-neutral-400" style={{ fontSize: "12px" }}>variant ທີ່ຍັງມີສະຕັອກ</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-amber-100 bg-white p-5">
            <p className="text-neutral-500" style={{ fontSize: "12.5px", fontWeight: 650 }}>ໃກ້ໝົດ</p>
            <p className="mt-2 text-amber-600" style={{ fontSize: "30px", fontWeight: 760 }}>{lowCount}</p>
            <p className="text-neutral-400" style={{ fontSize: "12px" }}>variant</p>
          </div>
          <div className="rounded-xl border border-red-100 bg-white p-5">
            <p className="text-neutral-500" style={{ fontSize: "12.5px", fontWeight: 650 }}>ໝົດ</p>
            <p className="mt-2 text-red-600" style={{ fontSize: "30px", fontWeight: 760 }}>{outCount}</p>
            <p className="text-neutral-400" style={{ fontSize: "12px" }}>variant</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-100 bg-white p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative min-w-[260px] flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={15} />
            <input
              className="h-12 w-full rounded-lg border border-neutral-200 bg-neutral-50 pl-11 pr-4 text-neutral-900 outline-none transition focus:border-transparent focus:ring-2 focus:ring-neutral-400"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="ຄົ້ນຫາສິນຄ້າ, SKU, ສີ, ໄຊສ໌..."
              style={{ fontSize: "13.5px", fontWeight: 500 }}
              value={search}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {filterOptions.map((filter) => (
              <button
                className={`h-11 whitespace-nowrap rounded-lg px-4 transition-colors ${
                  filterStock === filter.value ? "bg-neutral-950 text-white shadow-[0_8px_18px_rgba(0,0,0,0.12)]" : "border border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50"
                }`}
                key={filter.value}
                onClick={() => setFilterStock(filter.value)}
                style={{ fontSize: "13px", fontWeight: 650 }}
                type="button"
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-100 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] table-fixed">
            <colgroup>
              <col className="w-[220px]" />
              <col className="w-[170px]" />
              <col className="w-[150px]" />
              <col className="w-[92px]" />
              <col className="w-[118px]" />
              <col className="w-[120px]" />
              <col className="w-[130px]" />
              <col className="w-[80px]" />
            </colgroup>
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50">
                {["ສິນຄ້າ", "SKU", "ສີ / ໄຊສ໌", "ສະຕັອກ", "ສະຖານະ", "ຕົ້ນທຶນ", "ລາຄາຂາຍ", ""].map((heading) => (
                  <th className="whitespace-nowrap px-5 py-3.5 text-left text-neutral-400" key={heading} style={{ fontSize: "11.5px", fontWeight: 700 }}>
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {filtered.map((variant) => {
                const tone = stockTone(variant.stock, variant.minimumStock);
                const isLow = tone === "low";
                const isOut = tone === "out";

                return (
                  <tr
                    className={`transition-colors hover:bg-neutral-50/70 ${isOut ? "bg-red-50/20" : isLow ? "bg-amber-50/20" : ""}`}
                    key={`${variant.productId}-${variant.id}`}
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f4f4f4]">
                          {variant.image ? <img alt={variant.productName} className="h-10 w-8 object-contain" src={variant.image} /> : null}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-neutral-900" style={{ fontSize: "12.5px", fontWeight: 700 }}>{variant.productName}</p>
                          <p className="mt-0.5 truncate text-neutral-400" style={{ fontSize: "11.5px", fontWeight: 500 }}>{variant.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="block truncate rounded-md bg-neutral-50 px-2.5 py-1 font-mono text-neutral-600" style={{ fontSize: "12px", fontWeight: 650 }}>
                        {variant.sku}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-white shadow-[0_0_0_1px_rgba(0,0,0,0.16)]" style={{ background: variant.colorHex }} />
                        <span className="truncate text-neutral-700" style={{ fontSize: "13px", fontWeight: 650 }}>{variant.colorName}</span>
                        <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-neutral-600" style={{ fontSize: "11.5px", fontWeight: 700 }}>{variant.sizeLabel}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={isOut ? "text-red-600" : isLow ? "text-amber-600" : "text-neutral-950"} style={{ fontSize: "18px", fontWeight: 780, letterSpacing: "-0.02em" }}>
                        {variant.stock}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {isOut ? (
                        <span className="inline-flex max-w-full rounded-full bg-red-50 px-2.5 py-1 text-red-600" style={{ fontSize: "12px", fontWeight: 700 }}>
                          <span className="truncate">ໝົດ</span>
                        </span>
                      ) : isLow ? (
                        <span className="inline-flex max-w-full rounded-full bg-amber-50 px-2.5 py-1 text-amber-700" style={{ fontSize: "12px", fontWeight: 700 }}>
                          <span className="truncate">ໃກ້ໝົດ</span>
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-green-50 px-2.5 py-1 text-green-700" style={{ fontSize: "12px", fontWeight: 700 }}>
                          ພ້ອມຂາຍ
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="whitespace-nowrap text-neutral-600" style={{ fontSize: "13px", fontWeight: 650 }}>{money(variant.costPrice)}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="whitespace-nowrap text-neutral-950" style={{ fontSize: "13px", fontWeight: 750 }}>{money(variant.salePrice)}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-1.5">
                        <button
                          aria-label="Adjust stock"
                          className="rounded-lg p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-950"
                          onClick={() => navigate("stock-adjustment", `${variant.productId}::${variant.id}`)}
                          type="button"
                        >
                          <SlidersHorizontal size={14} />
                        </button>
                        <button
                          aria-label="Edit product"
                          className="rounded-lg p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-950"
                          onClick={() => navigate("edit-product", variant.productId)}
                          type="button"
                        >
                          <Edit size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="py-14 text-center">
            <p className="text-neutral-900" style={{ fontSize: "14px", fontWeight: 700 }}>ບໍ່ພົບສະຕັອກ</p>
            <p className="mt-1 text-neutral-400" style={{ fontSize: "13px" }}>ລອງປ່ຽນຄຳຄົ້ນຫາ ຫຼືຕົວກອງສະຕັອກ.</p>
          </div>
        )}
      </div>

      <p className="text-right text-neutral-400" style={{ fontSize: "12px", fontWeight: 600 }}>
        ສະແດງ {filtered.length} ຈາກ {variants.length} variant
      </p>
    </div>
  );
}
