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
  categories?: Relation<{ name_en?: string | null }>;
  product_variants?: ProductVariant[] | null;
};

type ProductStatus = "all" | "active" | "draft" | "inactive";
type ProductView = "card" | "list";

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

function getCategory(product: AdminProduct) {
  return firstRelation(product.categories)?.name_en ?? "Uncategorized";
}

function getMargin(product: AdminProduct) {
  const sale = product.sale_price ?? 0;
  const cost = product.cost_price ?? 0;

  if (sale <= 0 || cost <= 0) return null;

  return Math.round(((sale - cost) / sale) * 100);
}

function getColors(product: AdminProduct) {
  const colors = getVariants(product).map((variant) => variant.color_name).filter(Boolean);
  return Array.from(new Set(colors)).slice(0, 3);
}

export function AdminProductsConsole({ products }: { products: AdminProduct[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState<ProductStatus>("all");
  const [view, setView] = useState<ProductView>("card");

  const categories = useMemo(() => {
    return Array.from(new Set(products.map((product) => getCategory(product)))).sort();
  }, [products]);

  const stats = useMemo(() => {
    const active = products.filter((product) => product.status === "active").length;
    const draft = products.filter((product) => product.status === "draft").length;
    const stock = products.reduce((sum, product) => sum + getProductStock(product), 0);
    const variants = products.reduce((sum, product) => sum + getVariants(product).length, 0);

    return { active, draft, stock, variants };
  }, [products]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return products.filter((product) => {
      const productCategory = getCategory(product);
      const variants = getVariants(product);
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
        (status === "draft" && product.status === "draft") ||
        (status === "inactive" && product.status !== "active" && product.status !== "draft");

      return (!normalizedQuery || haystack.includes(normalizedQuery)) && (category === "all" || productCategory === category) && statusMatch;
    });
  }, [category, products, query, status]);

  if (products.length === 0) {
    return (
      <section className="admin-v2-card admin-products-empty">
        <strong>ຍັງບໍ່ມີສິນຄ້າ</strong>
        <p>ຫຼັງຈາກເພີ່ມສິນຄ້າ ຈະເຫັນລາຄາ, variant, ສະຖານະ ແລະສະຕ໊ອກຢູ່ໜ້ານີ້.</p>
      </section>
    );
  }

  return (
    <div className="admin-products-v2">
      <section className="admin-products-stats">
        <article>
          <span>Active Products</span>
          <strong>{stats.active}</strong>
          <p>ສິນຄ້າທີ່ລູກຄ້າເຫັນ</p>
        </article>
        <article>
          <span>Total Variants</span>
          <strong>{stats.variants}</strong>
          <p>ສີ, ໄຊສ໌ ແລະ SKU</p>
        </article>
        <article>
          <span>Total Stock</span>
          <strong>{stats.stock}</strong>
          <p>ຈຳນວນພ້ອມຂາຍ</p>
        </article>
        <article className="is-soft">
          <span>Draft</span>
          <strong>{stats.draft}</strong>
          <p>ກຳລັງກຽມເປີດຂາຍ</p>
        </article>
      </section>

      <section className="admin-products-toolbar">
        <div className="admin-products-search">
          <span aria-hidden="true">⌕</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products, SKU, colour..." />
        </div>
        <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Category">
          <option value="all">All Categories</option>
          {categories.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
        <select value={status} onChange={(event) => setStatus(event.target.value as ProductStatus)} aria-label="Status">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="inactive">Inactive</option>
        </select>
        <div className="admin-products-view" aria-label="Product view">
          <button className={view === "card" ? "is-active" : ""} onClick={() => setView("card")} type="button">Card</button>
          <button className={view === "list" ? "is-active" : ""} onClick={() => setView("list")} type="button">List</button>
        </div>
      </section>

      {filteredProducts.length > 0 ? (
        view === "card" ? (
          <section className="admin-products-grid">
            {filteredProducts.map((product) => {
              const stock = getProductStock(product);
              const margin = getMargin(product);
              const colors = getColors(product);

              return (
                <article className="admin-product-card-v2" key={product.id}>
                  <div className="admin-product-thumb-v2">
                    <span>{(product.name_en ?? "SO").slice(0, 2).toUpperCase()}</span>
                    <em>{statusLabel(product.status)}</em>
                  </div>
                  <div className="admin-product-card-body">
                    <div>
                      <strong>{product.name_en ?? product.name_lo ?? "Untitled product"}</strong>
                      <span>{getCategory(product)}</span>
                    </div>
                    <b>{formatLak(product.sale_price ?? 0)}</b>
                    <div className="admin-product-card-meta">
                      <span>{stock} Units</span>
                      <span>{getVariants(product).length || 1} Variants</span>
                      <span>{margin !== null ? `${margin}% Margin` : "No margin"}</span>
                    </div>
                    <div className="admin-product-swatches">
                      {colors.length > 0 ? colors.map((color) => <i key={color} title={color ?? ""} />) : <small>No colours</small>}
                    </div>
                    <div className="admin-product-card-actions">
                      <button type="button">Edit</button>
                      <button type="button">Variants</button>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        ) : (
          <section className="admin-v2-card admin-products-list-card">
            <div className="admin-products-list-row is-head">
              <span>Product</span>
              <span>Category</span>
              <span>Price</span>
              <span>Stock</span>
              <span>Status</span>
              <span>Actions</span>
            </div>
            {filteredProducts.map((product) => (
              <div className="admin-products-list-row" key={product.id}>
                <div className="admin-products-list-name">
                  <span>{(product.name_en ?? "SO").slice(0, 2).toUpperCase()}</span>
                  <strong>{product.name_en ?? product.name_lo ?? "Untitled product"}</strong>
                  <small>{product.sku ?? product.slug ?? "-"}</small>
                </div>
                <em>{getCategory(product)}</em>
                <strong>{formatLak(product.sale_price ?? 0)}</strong>
                <span>{getProductStock(product)} Units</span>
                <b>{statusLabel(product.status)}</b>
                <div>
                  <button type="button">Edit</button>
                  <button type="button">⋮</button>
                </div>
              </div>
            ))}
          </section>
        )
      ) : (
        <section className="admin-products-no-results">
          <strong>ບໍ່ພົບສິນຄ້າ</strong>
          <p>ລອງປ່ຽນຄຳຄົ້ນຫາ, ໝວດໝູ່ ຫຼືສະຖານະ.</p>
        </section>
      )}
    </div>
  );
}
