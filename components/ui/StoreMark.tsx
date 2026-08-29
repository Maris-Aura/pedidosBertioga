import type { Store } from "@/lib/types";

export function StoreMark({
  store,
  size = 40,
}: {
  store: Pick<Store, "name" | "logo_url" | "primary_color">;
  size?: number;
}) {
  const className = "rounded-xl object-cover shrink-0";
  if (store.logo_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={store.logo_url}
        alt={store.name}
        width={size}
        height={size}
        className={className}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className={`${className} flex items-center justify-center font-black text-sm`}
      style={{
        width: size,
        height: size,
        backgroundColor: store.primary_color,
        color: "#0f172a",
      }}
    >
      {store.name.slice(0, 1)}
    </div>
  );
}
