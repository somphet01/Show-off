import { AdminStaticFrame } from "../../../../../admin/AdminStaticFrame";

type AdminProductEditPageProps = {
  params: { id: string };
};

export default function AdminProductEditPage({ params }: AdminProductEditPageProps) {
  return <AdminStaticFrame initialPage="edit-product" initialSelectedId={params.id} />;
}
