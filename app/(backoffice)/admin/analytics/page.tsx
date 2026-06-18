export default function AdminAnalyticsPage() {
  return (
    <main className="admin-page">
      <div className="admin-page-heading">
        <div>
          <span>ຫຼັງບ້ານ</span>
          <h1>ວິເຄາະ</h1>
        </div>
        <p>ຕິດຕາມຍອດຂາຍ, ລູກຄ້າ, ການເຂົ້າໃຊ້ງານ ແລະສິນຄ້າທີ່ເຄື່ອນໄຫວດີ.</p>
      </div>
      <section className="admin-panel">
        <div className="admin-empty-state">
          <strong>ສ່ວນວິເຄາະຈະຕໍ່ກັບຂໍ້ມູນຈິງຫຼັງຈາກນີ້</strong>
          <p>ໜ້ານີ້ຈະຮວບຮວມກາຟຍອດຂາຍ, ຈຳນວນອໍເດີ, ລູກຄ້າໃໝ່ ແລະສິນຄ້າຂາຍດີ.</p>
        </div>
      </section>
    </main>
  );
}
