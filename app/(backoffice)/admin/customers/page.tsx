import { AdminCustomersConsole } from "../../../admin/AdminCustomersConsole";
import { getAdminCustomers } from "../../../lib/admin/data";

export default async function AdminCustomersPage() {
  const { customers } = await getAdminCustomers();

  return (
    <main className="admin-page admin-customers-page-v2">
      <div className="admin-page-heading admin-customers-head">
        <div>
          <span>ຫຼັງບ້ານ</span>
          <h1>ລູກຄ້າ</h1>
        </div>
        <p>ຈັດການຂໍ້ມູນລູກຄ້າ, ເບີໂທ, ທີ່ຢູ່, ປະຫວັດການຊື້ ແລະລະດັບລູກຄ້າ.</p>
      </div>
      <AdminCustomersConsole customers={customers} />
    </main>
  );
}
