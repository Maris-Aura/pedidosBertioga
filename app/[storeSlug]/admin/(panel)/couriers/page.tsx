import { CourierSheet } from "@/components/admin/CourierSheet";

export default async function AdminCouriersPage({
  params,
}: PageProps<"/[storeSlug]/admin/couriers">) {
  const { storeSlug } = await params;
  return <CourierSheet storeSlug={storeSlug} />;
}
