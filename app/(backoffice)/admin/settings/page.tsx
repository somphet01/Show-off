export default function AdminSettingsPage() {
  return (
    <main className="admin-page">
      <div className="admin-page-heading">
        <div>
          <span>ຫຼັງບ້ານ</span>
          <h1>ຕັ້ງຄ່າ</h1>
        </div>
        <p>ຕັ້ງຄ່າຂໍ້ມູນຮ້ານ, ບັນຊີຮັບເງິນ, ສະຕ໊ອກຂັ້ນຕ່ຳ ແລະສິດແອດມິນ.</p>
      </div>
      <section className="admin-panel">
        <div className="admin-empty-state">
          <strong>ການຕັ້ງຄ່າສຳລັບເຈົ້າຂອງຮ້ານ</strong>
          <p>ປຸ່ມຄວບຄຸມເຫຼົ່ານີ້ຈະເຊື່ອມຕໍ່ຫຼັງຈາກຢືນຢັນລະບົບສິດຜູ້ໃຊ້ແລ້ວ.</p>
        </div>
      </section>
    </main>
  );
}
