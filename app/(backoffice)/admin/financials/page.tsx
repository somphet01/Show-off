export default function AdminFinancialsPage() {
  return (
    <main className="admin-page">
      <div className="admin-page-heading">
        <div>
          <span>ຫຼັງບ້ານ</span>
          <h1>ການເງິນ</h1>
        </div>
        <p>ກວດຍອດຂາຍ, ລາຍຈ່າຍ, ຕົ້ນທຶນ ແລະກຳໄລຕາມຊ່ວງເວລາ.</p>
      </div>
      <section className="admin-panel">
        <div className="admin-empty-state">
          <strong>ລາຍງານການເງິນຈະຕໍ່ຈາກອໍເດີ</strong>
          <p>ອໍເດີທີ່ຈ່າຍແລ້ວ ແລະລາຍຈ່າຍຈະຖືກຄິດເຂົ້າລາຍງານນີ້ອັດຕະໂນມັດ.</p>
        </div>
      </section>
    </main>
  );
}
