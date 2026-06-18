export default function AdminPurchaseOrdersPage() {
  return (
    <main className="admin-page">
      <div className="admin-page-heading">
        <div>
          <span>ຫຼັງບ້ານ</span>
          <h1>ສັ່ງຊື້ເຂົ້າ</h1>
        </div>
        <p>ບັນທຶກອໍເດີຈາກຜູ້ສະໜອງ, ຕົ້ນທຶນ, ສະຖານະຮັບຂອງ ແລະເພີ່ມສະຕ໊ອກ.</p>
      </div>
      <section className="admin-panel">
        <div className="admin-empty-state">
          <strong>ການຮັບຂອງ PO ຈະຕໍ່ຫຼັງຈາກນີ້</strong>
          <p>ເມື່ອຮັບ PO ລະບົບຈະເພີ່ມສະຕ໊ອກ ແລະສ້າງປະຫວັດການເຄື່ອນໄຫວ.</p>
        </div>
      </section>
    </main>
  );
}
