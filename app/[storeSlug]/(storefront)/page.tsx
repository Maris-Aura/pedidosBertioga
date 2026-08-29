import { MenuView } from "@/components/client/MenuView";

export default async function StoreMenuPage({
  params,
}: PageProps<"/[storeSlug]">) {
  const { storeSlug } = await params;
  return <MenuView storeSlug={storeSlug} />;
}
