import { KdsPanel } from "@/components/admin/KdsPanel";

export default async function AdminPage({
  params,
}: PageProps<"/[storeSlug]/admin">) {
  const { storeSlug } = await params;
  return <KdsPanel storeSlug={storeSlug} />;
}
