import { CourierPanel } from "@/components/courier/CourierPanel";

export default async function CourierPage({
  params,
}: PageProps<"/[storeSlug]/entregador/[courierId]">) {
  const { storeSlug, courierId } = await params;
  return <CourierPanel storeSlug={storeSlug} courierId={courierId} />;
}
