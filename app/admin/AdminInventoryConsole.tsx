"use client";

import { useMemo, useState } from "react";
import styles from "./AdminInventoryConsole.module.css";

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

function getStockTone(product: AdminProduct) {
  const stock = getProductStock(product);
  const lowStock = getLowStockCount(product) > 0;

  if (stock <= 0) return "empty";
  if (lowStock) return "low";
  return "healthy";
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
      <section className={styles.emptyState}>
        <span className={styles.emptyBadge}>Inventory</span>
        <strong>ຍັງບໍ່ມີສິນຄ້າໃນຄັງ</strong>
        <p>ເມື່ອເພີ່ມສິນຄ້າແລ້ວ ສະຕ໋ອກ, SKU ແລະ ສະຖານະຈະຂຶ້ນໃຫ້ເຫັນທີ່ໜ້ານີ້.</p>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <section className={styles.statGrid}>
        <article className={`${styles.statCard} ${styles.statCardGreen}`}>
          <span className={styles.statLabel}>ຈຳນວນຄົງຄັງລວມ</span>
          <strong className={styles.statValue}>{stats.totalStock}</strong>
          <p className={styles.statNote}>ນັບລວມສິນຄ້າທຸກ variant ໃນລະບົບ</p>
        </article>

        <article className={`${styles.statCard} ${styles.statCardPeach}`}>
          <span className={styles.statLabel}>ສິນຄ້າໃກ້ໝົດ</span>
          <strong className={styles.statValue}>{stats.lowStock}</strong>
          <p className={styles.statNote}>ລາຍການທີ່ຄວນຈັດຊື້ເພີ່ມທັນທີ</p>
        </article>

        <article className={`${styles.statCard} ${styles.statCardLilac}`}>
          <span className={styles.statLabel}>ມູນຄ່າຄັງ</span>
          <strong className={styles.statValue}>{formatLak(stats.totalValue)}</strong>
          <p className={styles.statNote}>ຄຳນວນຈາກ stock ຄູນລາຄາຂາຍປັດຈຸບັນ</p>
        </article>

        <article className={`${styles.statCard} ${styles.statCardSoft}`}>
          <span className={styles.statLabel}>ສິນຄ້າເປີດຂາຍ</span>
          <strong className={styles.statValue}>{stats.active}</strong>
          <p className={styles.statNote}>ສະຖານະພ້ອມຂາຍຢູ່ໜ້າຮ້ານ</p>
        </article>
      </section>

      <section className={styles.toolbar}>
        <label className={styles.searchBox}>
          <span>⌕</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ຄົ້ນຫາສິນຄ້າ ຫຼື SKU..." />
        </label>

        <select className={styles.select} value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="all">ທຸກໝວດໝູ່</option>
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select className={styles.select} value={status} onChange={(event) => setStatus(event.target.value as InventoryStatus)}>
          <option value="all">ທຸກສະຖານະ</option>
          <option value="active">ເປີດຂາຍ</option>
          <option value="low-stock">ໃກ້ໝົດ</option>
          <option value="inactive">ປິດຂາຍ</option>
        </select>

        <label className={styles.check}>
          <input checked={onlyLowStock} onChange={(event) => setOnlyLowStock(event.target.checked)} type="checkbox" />
          <span>ສະແດງສະເພາະລາຍການໃກ້ໝົດ</span>
        </label>
      </section>

      {filteredProducts.length > 0 ? (
        <section className={styles.tableWrap}>
          <div className={`${styles.row} ${styles.headRow}`}>
            <span>Product</span>
            <span>SKU / Variant</span>
            <span>Category</span>
            <span>Price</span>
            <span>Stock</span>
            <span>Status</span>
          </div>

          {filteredProducts.map((product) => {
            const stock = getProductStock(product);
            const tone = getStockTone(product);
            const lowStock = getLowStockCount(product) > 0;

            return (
              <div className={styles.row} key={product.id}>
                <div className={styles.productCell}>
                  <div className={styles.thumb}>{(product.name_en ?? product.name_lo ?? "SO").slice(0, 2).toUpperCase()}</div>
                  <div className={styles.productCopy}>
                    <strong>{product.name_en ?? product.name_lo ?? "Untitled product"}</strong>
                    <small>{product.slug ?? "No slug"}</small>
                  </div>
                </div>

                <div className={styles.skuCell}>
                  <strong>{product.sku ?? "-"}</strong>
                  <small>{getVariantSummary(product)}</small>
                </div>

                <span>{getCategory(product)}</span>
                <strong>{formatLak(product.sale_price ?? 0)}</strong>

                <div className={styles.stockCell}>
                  <div className={styles.stockTop}>
                    <b>{stock} ຊິ້ນ</b>
                    {lowStock ? <small>Low stock</small> : <small>Healthy</small>}
                  </div>
                  <div className={styles.stockTrack}>
                    <span className={`${styles.stockFill} ${styles[`stock_${tone}`]}`} style={{ width: `${Math.min(100, Math.max(10, stock))}%` }} />
                  </div>
                </div>

                <span className={`${styles.statusBadge} ${styles[`status_${product.status ?? "inactive"}`] ?? ""}`}>{statusLabel(product.status)}</span>
              </div>
            );
          })}
        </section>
      ) : (
        <section className={styles.emptyState}>
          <span className={styles.emptyBadge}>Inventory</span>
          <strong>ບໍ່ພົບລາຍການສິນຄ້າ</strong>
          <p>ລອງປ່ຽນຄຳຄົ້ນຫາ ຫຼື ປັບຕົວກອງສະຕ໋ອກ.</p>
        </section>
      )}
    </section>
  );
}
