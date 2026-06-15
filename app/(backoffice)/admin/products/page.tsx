import { formatLak, getAdminProducts } from "../../../lib/admin/data";

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

export default async function AdminProductsPage() {
  const { products } = await getAdminProducts();

  return (
    <main className="admin-page">
      <div className="admin-page-heading">
        <div>
          <span>Backoffice</span>
          <h1>Products</h1>
        </div>
        <p>Create products, upload images, set prices, and manage stock status.</p>
      </div>
      <section className="admin-panel">
        <div className="admin-panel-heading">
          <h2>Product catalog</h2>
          <span>{products.length} items</span>
        </div>
        {products.length > 0 ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Variants</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const category = firstRelation(product.categories);

                  return (
                    <tr key={product.id}>
                      <td>
                        <strong>{product.name_en}</strong>
                        <span>{product.name_lo ?? product.slug}</span>
                      </td>
                      <td>{product.sku}</td>
                      <td>{category?.name_en ?? "-"}</td>
                      <td>{formatLak(product.sale_price ?? 0)}</td>
                      <td>{product.product_variants?.length ?? 0}</td>
                      <td>{product.status}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="admin-empty-state">
            <strong>No products yet</strong>
            <p>The next step is adding the create product form with variants, size, color, stock, and images.</p>
          </div>
        )}
      </section>
    </main>
  );
}
