import { StoreDashboard } from "@/components/admin/StoreDashboard";

export default async function AdminDashboardPage({
  params,
}: PageProps<"/[storeSlug]/admin/dashboard">) {
  const { storeSlug } = await params;
  return <StoreDashboard storeSlug={storeSlug} />;
}
