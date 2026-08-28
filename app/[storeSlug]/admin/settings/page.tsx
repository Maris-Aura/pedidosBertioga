import { StoreSettings } from "@/components/admin/StoreSettings";

export default async function AdminSettingsPage({
  params,
}: PageProps<"/[storeSlug]/admin/settings">) {
  const { storeSlug } = await params;
  return <StoreSettings storeSlug={storeSlug} />;
}
