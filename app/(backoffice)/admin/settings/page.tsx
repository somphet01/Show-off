import { updatePaymentSettings } from "../../../admin/actions";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

type AdminSettingsPageProps = {
  searchParams: Promise<{ payment?: string }>;
};

export default async function AdminSettingsPage({ searchParams }: AdminSettingsPageProps) {
  const query = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("storefront_payment_settings")
    .select("thb_to_lak_rate, qr_thb_url, qr_lak_url, updated_at")
    .eq("id", "main")
    .maybeSingle();

  const notice =
    query.payment === "saved"
      ? { type: "success", text: "ບັນທຶກອັດຕາແລກປ່ຽນ ແລະ QR ຮັບເງິນແລ້ວ." }
      : query.payment === "invalid-rate"
        ? { type: "error", text: "ອັດຕາແລກປ່ຽນຕ້ອງຫຼາຍກວ່າ 0." }
        : query.payment === "forbidden"
          ? { type: "error", text: "ສະເພາະເຈົ້າຂອງຮ້ານເທົ່ານັ້ນທີ່ແກ້ໄຂຄ່ານີ້ໄດ້." }
          : query.payment === "failed"
            ? { type: "error", text: "ບັນທຶກບໍ່ສຳເລັດ. ກະລຸນາລອງໃໝ່." }
            : null;

  return (
    <main className="admin-page admin-payment-settings">
      <div className="admin-page-heading">
        <div>
          <span>ຫຼັງບ້ານ</span>
          <h1>ຕັ້ງຄ່າ</h1>
        </div>
        <p>ກຳນົດອັດຕາແລກປ່ຽນ ແລະ QR ຮັບເງິນຂອງຮ້ານ.</p>
      </div>

      {notice ? <div className={`admin-settings-notice is-${notice.type}`} role="status">{notice.text}</div> : null}

      <section className="admin-panel admin-settings-form-panel">
        <header>
          <div>
            <span>PAYMENT</span>
            <h2>ການຊຳລະເງິນ</h2>
          </div>
          <p>ລາຄາສິນຄ້າໃຊ້ເງິນບາດເປັນຫຼັກ. ລະບົບຈະແປງເປັນເງິນກີບຕາມຄ່ານີ້.</p>
        </header>

        <form action={updatePaymentSettings} className="admin-settings-form">
          <label className="admin-settings-rate">
            <span>ອັດຕາແລກປ່ຽນ THB → LAK</span>
            <div><strong>1 THB</strong><b>=</b><input name="thbToLakRate" type="number" min="0.0001" step="0.0001" defaultValue={Number(data?.thb_to_lak_rate ?? 650)} required /><strong>LAK</strong></div>
            <small>ຕົວຢ່າງ: ສິນຄ້າ ฿100 ຈະເປັນ {(100 * Number(data?.thb_to_lak_rate ?? 650)).toLocaleString("en-US")} LAK</small>
          </label>

          <div className="admin-settings-qr-grid">
            <label>
              <span>QR ຮັບເງິນບາດ</span>
              <input name="qrThbUrl" type="url" defaultValue={data?.qr_thb_url ?? ""} placeholder="https://.../qr-thb.png" />
              <small>ລູກຄ້າຈະເຫັນ QR ນີ້ເມື່ອເລືອກ THB.</small>
            </label>
            <label>
              <span>QR ຮັບເງິນກີບ</span>
              <input name="qrLakUrl" type="url" defaultValue={data?.qr_lak_url ?? ""} placeholder="https://.../qr-lak.png" />
              <small>ລູກຄ້າຈະເຫັນ QR ນີ້ເມື່ອເລືອກ LAK.</small>
            </label>
          </div>

          <div className="admin-settings-footer">
            <p>{data?.updated_at ? `ອັບເດດຫຼ້າສຸດ ${new Date(data.updated_at).toLocaleString("lo-LA")}` : "ຍັງບໍ່ມີການອັບເດດ"}</p>
            <button type="submit">ບັນທຶກການຕັ້ງຄ່າ</button>
          </div>
        </form>
      </section>
    </main>
  );
}
