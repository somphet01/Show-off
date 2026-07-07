import { AdminStaticFrame } from "../../../../admin/AdminStaticFrame";

type AdminCustomerDetailPageProps = {
  params: { id: string };
};

export default function AdminCustomerDetailPage({ params }: AdminCustomerDetailPageProps) {
  return <AdminStaticFrame initialPage="customer-detail" initialSelectedId={params.id} />;
}
