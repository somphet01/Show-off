import { redirect } from "next/navigation";

export default async function CollectionRedirectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  redirect(`/en/collections/${slug}`);
}
