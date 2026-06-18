import Link from "next/link";
import { AdminProductsConsole } from "../../../admin/AdminProductsConsole";
import { getAdminProducts } from "../../../lib/admin/data";

export default async function AdminProductsPage() {
  const { products } = await getAdminProducts();
  const activeCount = products.filter((product) => product.status === "active").length;

  return (
    <main className="admin-page admin-products-page-v2">
      <section className="admin-products-head">
        <div>
          <span>PRODUCT CATALOG</span>
          <h1>ຈັດການສິນຄ້າ</h1>
          <p>{products.length} ສິນຄ້າ, {activeCount} ລາຍການເປີດຂາຍຢູ່</p>
        </div>
        <div>
          <Link className="admin-products-outline-action" href="/admin/inventory">ເບິ່ງສະຕ໊ອກ</Link>
          <Link className="admin-products-primary-action" href="/admin/products">+ Add Product</Link>
        </div>
      </section>
      <AdminProductsConsole products={products} />
    </main>
  );
}
