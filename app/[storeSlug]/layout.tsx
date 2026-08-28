import { StoreShell } from "@/components/client/StoreShell";

export default async function StoreLayout({
  children,
  params,
}: LayoutProps<"/[storeSlug]">) {
  const { storeSlug } = await params;
  return <StoreShell storeSlug={storeSlug}>{children}</StoreShell>;
}
