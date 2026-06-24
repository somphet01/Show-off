import { AdminOrdersMock } from "../../../admin/AdminOrdersMock";
import { FeedbackTone } from "../../../components/FeedbackTone";
import { getAdminOrders } from "../../../lib/admin/data";

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ review?: string; shipping?: string }> }) {
  const { orders } = await getAdminOrders();
  const params = await searchParams;
  const reviewMessage =
    params.review === "approved"
      ? "ອະນຸມັດສະລິບແລ້ວ ແລະອໍເດີຖືກອັບເດດ."
      : params.review === "rejected"
        ? "ປະຕິເສດສະລິບແລ້ວ ແລະອໍເດີຖືກອັບເດດ."
        : params.review === "already-reviewed"
          ? "ສະລິບນີ້ຖືກກວດແລ້ວ. ສະຖານະຫຼ້າສຸດສະແດງຢູ່ດ້ານລຸ່ມ."
          : "";
  const shippingMessage =
    params.shipping === "updated"
      ? "ອັບເດດສະຖານະຈັດສົ່ງແລ້ວ."
      : params.shipping === "failed"
        ? "ຍັງອັບເດດຈັດສົ່ງບໍ່ໄດ້. ກະລຸນາຢືນຢັນການຈ່າຍເງິນກ່ອນ."
        : "";

  return (
    <main className="admin-page admin-orders-page-v2">
      <div className="admin-page-heading admin-orders-head">
        <div>
          <span>ຫຼັງບ້ານ</span>
          <h1>ອໍເດີ</h1>
        </div>
        <p>ກວດອໍເດີຈາກເວັບ ແລະແຊັດ, ອະນຸມັດສະລິບ, ເພີ່ມເລກຕິດຕາມ ແລະຈັດການການສົ່ງ.</p>
      </div>
      {reviewMessage ? (
        <>
          <FeedbackTone type="success" />
          <div className="admin-review-notice" role="status">
            {reviewMessage}
          </div>
        </>
      ) : null}
      {shippingMessage ? (
        <>
          <FeedbackTone type={params.shipping === "failed" ? "error" : "success"} />
          <div className={`admin-review-notice${params.shipping === "failed" ? " is-error" : ""}`} role="status">
            {shippingMessage}
          </div>
        </>
      ) : null}
      <section className="admin-panel admin-orders-panel">
        <div className="admin-panel-heading">
          <h2>ກວດສອບອໍເດີ</h2>
          <span>{orders.length} ອໍເດີ / ຂໍ້ມູນຈິງ</span>
        </div>
        <AdminOrdersMock orders={orders} />
      </section>
    </main>
  );
}
