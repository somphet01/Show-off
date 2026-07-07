import { AdminStaticFrame } from "../../../../admin/AdminStaticFrame";

type AdminPurchaseOrderDetailPageProps = {
  params: { id: string };
};

export default function AdminPurchaseOrderDetailPage({ params }: AdminPurchaseOrderDetailPageProps) {
  return <AdminStaticFrame initialPage="purchase-order-detail" initialSelectedId={params.id} />;
}
