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
  stock_qty?: number | null;
  status?: string | null;
  categories?: Relation<{ name_en?: string | null }>;
  product_variants?: ProductVariant[] | null;
};

type InventoryStatus = "all" | "active" | "low-stock" | "inactive";

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

function getVariantSummary(product: AdminProduct) {
  const variants = getVariants(product);

  if (variants.length === 0) {
    return product.sku ?? "-";
  }

  return variants
    .slice(0, 2)
    .map((variant) => [variant.color_name, variant.size_label].filter(Boolean).join(" / ") || variant.sku)
    .join(", ");
}

function getCategory(product: AdminProduct) {
  return firstRelation(product.categories)?.name_en ?? "Uncategorized";
}

export function AdminInventoryConsole({ products }: { products: AdminProduct[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState<InventoryStatus>("all");
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  const categories = useMemo(() => {
    return Array.from(new Set(products.map((product) => getCategory(product)))).sort();
  }, [products]);

  const stats = useMemo(() => {
    const totalStock = products.reduce((sum, product) => sum + getProductStock(product), 0);
    const lowStock = products.filter((product) => getLowStockCount(product) > 0).length;
    const active = products.filter((product) => product.status === "active").length;
    const totalValue = products.reduce((sum, product) => sum + getProductStock(product) * (product.sale_price ?? 0), 0);

    return { active, lowStock, totalStock, totalValue };
  }, [products]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return products.filter((product) => {
      const variants = getVariants(product);
      const productCategory = getCategory(product);
      const lowStock = getLowStockCount(product) > 0;
      const haystack = [
        product.name_en,
        product.name_lo,
        product.sku,
        product.slug,
        productCategory,
        ...variants.flatMap((variant) => [variant.sku, variant.color_name, variant.size_label]),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const statusMatch =
        status === "all" ||
        (status === "active" && product.status === "active") ||
        (status === "inactive" && product.status !== "active") ||
        (status === "low-stock" && lowStock);

      return (
        (!normalizedQuery || haystack.includes(normalizedQuery)) &&
        (category === "all" || productCategory === category) &&
        statusMatch &&
        (!onlyLowStock || lowStock)
      );
    });
  }, [category, onlyLowStock, products, query, status]);

  if (products.length === 0) {
    return (
      <section className="admin-v2-card admin-inventory-empty">
        <strong>ຍັງບໍ່ມີສິນຄ້າ</strong>
        <p>ເມື່ອເພີ່ມສິນຄ້າແລ້ວ ສະຕ໊ອກ ແລະ SKU ຈະສະແດງຢູ່ໜ້ານີ້.</p>
      </section>
    );
  }

  return (
    <div className="admin-inventory-v2">
      <section className="admin-inventory-toolbar">
        <div className="admin-inventory-search">
          <span aria-hidden="true">⌕</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Product name / SKU..."
            aria-label="ຄົ້ນຫາສິນຄ້າ"
          />
        </div>
        <label>
          <span>Category</span>
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="all">All Categories</option>
            {categories.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Status</span>
          <select value={status} onChange={(event) => setStatus(event.target.value as InventoryStatus)}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="low-stock">Low Stock</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
        <label className="admin-inventory-check">
          <input checked={onlyLowStock} onChange={(event) => setOnlyLowStock(event.target.checked)} type="checkbox" />
          <span>Only Low Stock Items</span>
        </label>
      </section>

      <section className="admin-v2-card admin-inventory-table-card">
        <div className="admin-inventory-table">
          <div className="admin-inventory-row is-head">
            <span>Product</span>
            <span>SKU</span>
            <span>Category</span>
            <span>Price</span>
            <span>Stock Balance</span>
            <span>Status</span>
            <span>Actions</span>
          </div>

          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => {
              const stock = getProductStock(product);
              const lowStock = getLowStockCount(product) > 0;
              const categoryName = getCategory(product);

              return (
                <div className="admin-inventory-row" key={product.id}>
                  <div className="admin-inventory-product">
                    <span aria-hidden="true">{(product.name_en ?? "SO").slice(0, 2).toUpperCase()}</span>
                    <strong>{product.name_en ?? product.name_lo ?? "Untitled product"}</strong>
                    <small>{getVariantSummary(product)}</small>
                  </div>
                  <span className="admin-inventory-sku">{product.sku ?? product.slug ?? "-"}</span>
                  <span><em>{categoryName}</em></span>
                  <strong>{formatLak(product.sale_price ?? 0)}</strong>
                  <div className={lowStock ? "admin-inventory-stock is-low" : "admin-inventory-stock"}>
                    <b>{stock} Units</b>
                    <i style={{ width: `${Math.min(100, Math.max(8, stock))}%` }} />
                  </div>
                  <button className={product.status === "active" ? "admin-inventory-toggle is-on" : "admin-inventory-toggle"} type="button" aria-label="ສະຖານະສິນຄ້າ">
                    <span>{statusLabel(product.status)}</span>
                  </button>
                  <div className="admin-inventory-actions">
                    {lowStock ? <button type="button">Restock</button> : null}
                    <button aria-label="ແກ້ໄຂ" type="button">≡</button>
                    <button aria-label="ເພີ່ມເຕີມ" type="button">⋮</button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="admin-inventory-no-results">
              <strong>ບໍ່ພົບສິນຄ້າ</strong>
              <p>ລອງປ່ຽນຄຳຄົ້ນຫາ ຫຼືຕົວກອງສະຕ໊ອກ.</p>
            </div>
          )}
        </div>
      </section>

      <section className="admin-inventory-stats">
        <article>
          <span>Total Value</span>
          <strong>{formatLak(stats.totalValue)}</strong>
          <p>↗ +4.2% ຈາກເດືອນກ່ອນ</p>
        </article>
        <article className="is-alert">
          <span>Low Stock SKUs</span>
          <strong>{stats.lowStock} Items</strong>
          <p>Requires immediate restock</p>
        </article>
        <article>
          <span>Storage Used</span>
          <strong>{stats.totalStock} Units</strong>
          <i style={{ width: `${Math.min(100, Math.max(12, stats.active * 8))}%` }} />
        </article>
      </section>
    </div>
  );
}
