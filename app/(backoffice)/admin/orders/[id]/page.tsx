import { AdminStaticFrame } from "../../../../admin/AdminStaticFrame";

type AdminOrderDetailPageProps = {
  params: { id: string };
};

export default function AdminOrderDetailPage({ params }: AdminOrderDetailPageProps) {
  return <AdminStaticFrame initialPage="order-detail" initialSelectedId={params.id} />;
}
