import Link from "next/link";
import { AdminInventoryConsole } from "../../../admin/AdminInventoryConsole";
import { getAdminProducts } from "../../../lib/admin/data";

export default async function AdminInventoryPage() {
  const { products } = await getAdminProducts();
  const lowStockCount = products.filter((product) => {
    const variants = product.product_variants ?? [];

    if (variants.length > 0) {
      return variants.some((variant) => (variant.stock_qty ?? 0) <= (variant.min_stock_qty ?? 0));
    }

    return (product.stock_qty ?? 0) <= 0;
  }).length;

  return (
    <main className="admin-page admin-inventory-page-v2">
      <section className="admin-inventory-head">
        <div>
          <span>INVENTORY MANAGEMENT</span>
          <h1>ຈັດການສະຕ໊ອກ</h1>
          <p>{products.length} ສິນຄ້າ, {lowStockCount} ລາຍການໃກ້ໝົດ</p>
        </div>
        <div>
          <Link className="admin-inventory-outline-action" href="/admin/inventory">View Low Stock</Link>
          <Link className="admin-inventory-primary-action" href="/admin/products">+ Add New Product</Link>
        </div>
      </section>
      <AdminInventoryConsole products={products} />
    </main>
  );
}
