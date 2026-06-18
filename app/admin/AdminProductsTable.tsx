"use client";

import { useMemo, useState } from "react";

type Relation<T> = T | T[] | null | undefined;

type ProductVariant = {
  id: string;
  sku?: string | null;
  size_label?: string | null;
  color_name?: string | null;
  stock_qty?: number | null;
  min_stock_qty?: number | null;
  status?: string | null;
};

type AdminProduct = {
  id: string;
  sku?: string | null;
  name_en?: string | null;
  name_lo?: string | null;
  slug?: string | null;
  sale_price?: number | null;
  cost_price?: number | null;
  stock_qty?: number | null;
  status?: string | null;
  created_at?: string | null;
  categories?: Relation<{ name_en?: string | null }>;
  product_variants?: ProductVariant[] | null;
};

type ProductFilter = "all" | "active" | "low-stock" | "inactive";

function firstRelation<T>(value: Relation<T>): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function formatLak(value: number) {
  return `฿${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value)}`;
}

function statusLabel(status: string | null | undefined) {
  const labels: Record<string, string> = {
    active: "ເປີດຂາຍ",
    draft: "ຮ່າງ",
    archived: "ເກັບໄວ້",
    inactive: "ປິດຂາຍ",
  };

  return labels[status ?? ""] ?? status ?? "-";
}

function getVariants(product: AdminProduct) {
  return product.product_variants ?? [];
}

function getProductStock(product: AdminProduct) {
  const variants = getVariants(product);

  if (variants.length > 0) {
    return variants.reduce((sum, variant) => sum + (variant.stock_qty ?? 0), 0);
  }

  return product.stock_qty ?? 0;
}

function getLowStockCount(product: AdminProduct) {
  const variants = getVariants(product);

  if (variants.length > 0) {
    return variants.filter((variant) => (variant.stock_qty ?? 0) <= (variant.min_stock_qty ?? 0)).length;
  }

  return (product.stock_qty ?? 0) <= 0 ? 1 : 0;
}

function getVariantLabel(variant: ProductVariant) {
  return [variant.color_name, variant.size_label].filter(Boolean).join(" / ") || "ຄ່າເລີ່ມຕົ້ນ";
}

export function AdminProductsTable({ products, mode = "products" }: { products: AdminProduct[]; mode?: "products" | "inventory" }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ProductFilter>(mode === "inventory" ? "low-stock" : "all");
  const stats = useMemo(() => {
    const active = products.filter((product) => product.status === "active").length;
    const inactive = products.filter((product) => product.status !== "active").length;
    const lowStock = products.filter((product) => getLowStockCount(product) > 0).length;
    const totalStock = products.reduce((sum, product) => sum + getProductStock(product), 0);

    return { active, inactive, lowStock, totalStock };
  }, [products]);
  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return products.filter((product) => {
      const category = firstRelation(product.categories);
      const variants = getVariants(product);
      const haystack = [
        product.name_en,
        product.name_lo,
        product.sku,
        product.slug,
        category?.name_en,
        ...variants.flatMap((variant) => [variant.sku, variant.color_name, variant.size_label]),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesFilter =
        filter === "all" ||
        (filter === "active" && product.status === "active") ||
        (filter === "inactive" && product.status !== "active") ||
        (filter === "low-stock" && getLowStockCount(product) > 0);

      return matchesFilter && (!normalizedQuery || haystack.includes(normalizedQuery));
    });
  }, [filter, products, query]);

  if (products.length === 0) {
    return (
      <div className="admin-empty-state">
        <strong>ຍັງບໍ່ມີສິນຄ້າ</strong>
        <p>ຂັ້ນຕໍ່ໄປແມ່ນເພີ່ມຟອມສ້າງສິນຄ້າ ພ້ອມສີ, ໄຊສ໌, ສະຕ໊ອກ ແລະຮູບພາບ.</p>
      </div>
    );
  }

  return (
    <div className="admin-product-workspace">
      <section className="admin-product-stats" aria-label="ສະຫຼຸບສິນຄ້າ">
        <div>
          <span>ສິນຄ້າເປີດຂາຍ</span>
          <strong>{stats.active}</strong>
        </div>
        <div>
          <span>ສະຕ໊ອກລວມ</span>
          <strong>{stats.totalStock}</strong>
        </div>
        <div className={stats.lowStock > 0 ? "is-warning" : ""}>
          <span>ໃກ້ໝົດ</span>
          <strong>{stats.lowStock}</strong>
        </div>
        <div>
          <span>ປິດ/ຮ່າງ</span>
          <strong>{stats.inactive}</strong>
        </div>
      </section>

      <div className="admin-order-toolbar admin-product-toolbar">
        <div className="admin-order-search">
          <span aria-hidden="true" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ຄົ້ນຫາຊື່ສິນຄ້າ, SKU, ສີ, ໄຊສ໌" />
        </div>
        <div className="admin-order-filter" aria-label="ກອງສິນຄ້າ">
          {[
            ["all", "ທັງໝົດ", products.length],
            ["active", "ເປີດຂາຍ", stats.active],
            ["low-stock", "ສະຕ໊ອກຕ່ຳ", stats.lowStock],
            ["inactive", "ປິດ/ຮ່າງ", stats.inactive],
          ].map(([value, label, count]) => (
            <button className={filter === value ? "is-active" : ""} key={value} type="button" onClick={() => setFilter(value as ProductFilter)}>
              {label}
              <strong>{count}</strong>
            </button>
          ))}
        </div>
      </div>

      {filteredProducts.length > 0 ? (
        <div className="admin-table-wrap">
          <table className="admin-table admin-product-table">
            <thead>
              <tr>
                <th>ສິນຄ້າ</th>
                <th>SKU</th>
                <th>ໝວດໝູ່</th>
                <th>ລາຄາ</th>
                <th>ສະຕ໊ອກ</th>
                <th>ຕົວເລືອກ</th>
                <th>ສະຖານະ</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => {
                const category = firstRelation(product.categories);
                const variants = getVariants(product);
                const lowStockCount = getLowStockCount(product);
                const totalStock = getProductStock(product);

                return (
                  <tr key={product.id}>
                    <td>
                      <strong>{product.name_en}</strong>
                      <span>{product.name_lo ?? product.slug}</span>
                    </td>
                    <td>{product.sku ?? "-"}</td>
                    <td>{category?.name_en ?? "-"}</td>
                    <td>{formatLak(product.sale_price ?? 0)}</td>
                    <td>
                      <b className={lowStockCount > 0 ? "admin-stock-value is-low" : "admin-stock-value"}>{totalStock}</b>
                      <span>{lowStockCount > 0 ? `${lowStockCount} ຕົວເລືອກໃກ້ໝົດ` : "ພ້ອມຂາຍ"}</span>
                    </td>
                    <td>
                      <div className="admin-variant-stack">
                        {variants.length > 0 ? (
                          variants.slice(0, 3).map((variant) => (
                            <em className={(variant.stock_qty ?? 0) <= (variant.min_stock_qty ?? 0) ? "is-low" : ""} key={variant.id}>
                              {getVariantLabel(variant)}
                              <small>{variant.stock_qty ?? 0}</small>
                            </em>
                          ))
                        ) : (
                          <em>ບໍ່ມີ variant<small>{product.stock_qty ?? 0}</small></em>
                        )}
                        {variants.length > 3 ? <span>+{variants.length - 3} ເພີ່ມ</span> : null}
                      </div>
                    </td>
                    <td>
                      <span className={`admin-status-chip is-${product.status === "active" ? "active" : "muted"}`}>{statusLabel(product.status)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="admin-order-no-results">
          <strong>ບໍ່ພົບສິນຄ້າ</strong>
          <p>ລອງປ່ຽນຄຳຄົ້ນຫາ ຫຼືຕົວກອງສິນຄ້າ.</p>
        </div>
      )}
    </div>
  );
}
