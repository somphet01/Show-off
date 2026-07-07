"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import styles from "./AdminProductsConsole.module.css";

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
  return `₭${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value)}`;
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

function getMinStock(product: AdminProduct) {
  const variants = getVariants(product);

  if (variants.length > 0) {
    return variants.reduce((sum, variant) => sum + (variant.min_stock_qty ?? 0), 0);
  }

  return 0;
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
  return Array.from(new Set(colors)).slice(0, 4);
}

function getStockTone(stock: number, minStock: number) {
  if (stock <= 0) return "empty";
  if (minStock > 0 && stock <= minStock) return "low";
  return "healthy";
}

function stockWidth(stock: number, minStock: number) {
  const target = Math.max(minStock * 2, 8);
  return Math.max(18, Math.min(100, Math.round((stock / target) * 100)));
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
    const lowStock = products.filter((product) => {
      const stockQty = getProductStock(product);
      const minStock = getMinStock(product);
      return stockQty <= 0 || (minStock > 0 && stockQty <= minStock);
    }).length;

    return {
      active,
      draft,
      stock,
      lowStock,
    };
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
      <section className={styles.emptyState}>
        <span className={styles.emptyBadge}>Products</span>
        <strong>ຍັງບໍ່ມີສິນຄ້າໃນລະບົບ</strong>
        <p>ເມື່ອເພີ່ມສິນຄ້າແລ້ວ ຫນ້ານີ້ຈະສະແດງລາຄາ, SKU, ສະຕ໋ອກ ແລະ ສະຖານະໃຫ້ທັນທີ.</p>
      </section>
    );
  }

  return (
    <div className={styles.page}>
      <section className={styles.statGrid}>
        <article className={`${styles.statCard} ${styles.statCardPeach}`}>
          <span className={styles.statLabel}>ສິນຄ້າເປີດຂາຍ</span>
          <strong className={styles.statValue}>{stats.active}</strong>
          <p className={styles.statNote}>ສິນຄ້າທີ່ລູກຄ້າເຫັນໄດ້ຕອນນີ້</p>
        </article>

        <article className={`${styles.statCard} ${styles.statCardGreen}`}>
          <span className={styles.statLabel}>ຈຳນວນສະຕ໋ອກລວມ</span>
          <strong className={styles.statValue}>{stats.stock}</strong>
          <p className={styles.statNote}>ນັບລວມທຸກ variant ແລະ SKU</p>
        </article>

        <article className={`${styles.statCard} ${styles.statCardLilac}`}>
          <span className={styles.statLabel}>ສິນຄ້າໃກ້ຫມົດ</span>
          <strong className={styles.statValue}>{stats.lowStock}</strong>
          <p className={styles.statNote}>ໂຕທີ່ຄວນເຕືອນໃຫ້ຈັດຊື້ເພີ່ມ</p>
        </article>

        <article className={`${styles.statCard} ${styles.statCardSoft}`}>
          <span className={styles.statLabel}>ຮ່າງ / ຍັງບໍ່ເປີດ</span>
          <strong className={styles.statValue}>{stats.draft}</strong>
          <p className={styles.statNote}>ສຳລັບສິນຄ້າທີ່ກຳລັງຈັດໜ້າຂາຍ</p>
        </article>
      </section>

      <section className={styles.toolbar}>
        <label className={styles.searchBox}>
          <span>⌕</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ຄົ້ນຫາສິນຄ້າ, SKU, ສີ..." />
        </label>

        <select className={styles.select} value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Category">
          <option value="all">ທຸກໝວດໝູ່</option>
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select className={styles.select} value={status} onChange={(event) => setStatus(event.target.value as ProductStatus)} aria-label="Status">
          <option value="all">ທຸກສະຖານະ</option>
          <option value="active">ເປີດຂາຍ</option>
          <option value="draft">ຮ່າງ</option>
          <option value="inactive">ປິດຂາຍ</option>
        </select>

        <div className={styles.viewSwitch} aria-label="Product view">
          <button className={view === "card" ? styles.viewActive : ""} onClick={() => setView("card")} type="button">
            Cards
          </button>
          <button className={view === "list" ? styles.viewActive : ""} onClick={() => setView("list")} type="button">
            List
          </button>
        </div>
      </section>

      {filteredProducts.length > 0 ? (
        view === "card" ? (
          <section className={styles.grid}>
            {filteredProducts.map((product) => {
              const stock = getProductStock(product);
              const minStock = getMinStock(product);
              const margin = getMargin(product);
              const colors = getColors(product);
              const tone = getStockTone(stock, minStock);

              return (
                <article className={styles.card} key={product.id}>
                  <div className={styles.cardTop}>
                    <div className={styles.thumb}>
                      <span>{(product.name_en ?? product.name_lo ?? "SO").slice(0, 2).toUpperCase()}</span>
                    </div>
                    <span className={`${styles.statusBadge} ${styles[`status_${product.status ?? "inactive"}`] ?? ""}`}>{statusLabel(product.status)}</span>
                  </div>

                  <div className={styles.cardBody}>
                    <div className={styles.cardHeading}>
                      <p>{getCategory(product)}</p>
                      <h3>{product.name_en ?? product.name_lo ?? "Untitled product"}</h3>
                      <small>{product.sku ?? product.slug ?? "No SKU"}</small>
                    </div>

                    <div className={styles.priceRow}>
                      <strong>{formatLak(product.sale_price ?? 0)}</strong>
                      <span>{margin !== null ? `${margin}% margin` : "No margin data"}</span>
                    </div>

                    <div className={styles.stockBlock}>
                      <div className={styles.stockHead}>
                        <span>Stock level</span>
                        <b>{stock} ຊິ້ນ</b>
                      </div>
                      <div className={styles.stockTrack}>
                        <span className={`${styles.stockFill} ${styles[`stock_${tone}`]}`} style={{ width: `${stockWidth(stock, minStock)}%` }} />
                      </div>
                      <div className={styles.stockMeta}>
                        <small>{getVariants(product).length || 1} variants</small>
                        <small>{minStock > 0 ? `Min ${minStock}` : "No minimum set"}</small>
                      </div>
                    </div>

                    <div className={styles.colorRow}>
                      {colors.length > 0 ? (
                        <>
                          <div className={styles.swatches}>
                            {colors.map((color) => (
                              <i key={color} title={color ?? ""} />
                            ))}
                          </div>
                          <span>{colors.join(", ")}</span>
                        </>
                      ) : (
                        <span>ຍັງບໍ່ມີຂໍ້ມູນສີ</span>
                      )}
                    </div>

                    <Link className={styles.cardAction} href={`/admin/products/${product.id}/edit`}>
                      ແກ້ໄຂສິນຄ້າ
                    </Link>
                  </div>
                </article>
              );
            })}
          </section>
        ) : (
          <section className={styles.listWrap}>
            <div className={`${styles.listRow} ${styles.listHead}`}>
              <span>Product</span>
              <span>Category</span>
              <span>Price</span>
              <span>Stock</span>
              <span>Status</span>
            </div>

            {filteredProducts.map((product) => {
              const stock = getProductStock(product);
              const minStock = getMinStock(product);
              const tone = getStockTone(stock, minStock);

              return (
                <div className={styles.listRow} key={product.id}>
                  <div className={styles.productCell}>
                    <div className={styles.listThumb}>{(product.name_en ?? product.name_lo ?? "SO").slice(0, 2).toUpperCase()}</div>
                    <div>
                      <strong>{product.name_en ?? product.name_lo ?? "Untitled product"}</strong>
                      <small>{product.sku ?? product.slug ?? "No SKU"}</small>
                    </div>
                  </div>

                  <span>{getCategory(product)}</span>
                  <strong>{formatLak(product.sale_price ?? 0)}</strong>
                  <div className={styles.listStock}>
                    <b>{stock} ຊິ້ນ</b>
                    <em className={`${styles.stockDot} ${styles[`stock_${tone}`]}`} />
                  </div>
                  <Link className={`${styles.statusBadge} ${styles[`status_${product.status ?? "inactive"}`] ?? ""}`} href={`/admin/products/${product.id}/edit`}>
                    {statusLabel(product.status)}
                  </Link>
                </div>
              );
            })}
          </section>
        )
      ) : (
        <section className={styles.emptyState}>
          <span className={styles.emptyBadge}>Search</span>
          <strong>ບໍ່ພົບສິນຄ້າຕາມຄຳຄົ້ນຫາ</strong>
          <p>ລອງປ່ຽນຄຳຄົ້ນຫາ ຫຼື ປັບ filter ເພື່ອເບິ່ງລາຍການທີ່ຕ້ອງການ.</p>
        </section>
      )}
    </div>
  );
}
