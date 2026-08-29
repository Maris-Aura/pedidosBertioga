import {
  SEED_CATEGORIES,
  SEED_COURIERS,
  SEED_NEIGHBORHOODS,
  SEED_OPTION_ITEMS,
  SEED_OPTIONS,
  SEED_PRODUCTS,
  SEED_STORES,
  SEED_USERS,
} from "./mock-data";
import type {
  Category,
  CheckoutPayload,
  Coupon,
  Courier,
  Neighborhood,
  OptionItem,
  Order,
  OrderItem,
  OrderStatus,
  OrderWithDetails,
  Product,
  ProductOption,
  Store,
  StoreCatalog,
  StoreUser,
} from "./types";

const DB_KEY = "pedidos-bertioga-db";
const SESSION_KEY = "pedidos-bertioga-session";
const CHANNEL = "pedidos-bertioga";

export type DemoDB = {
  stores: Store[];
  users: StoreUser[];
  categories: Category[];
  products: Product[];
  product_options: ProductOption[];
  option_items: OptionItem[];
  neighborhoods: Neighborhood[];
  couriers: Courier[];
  orders: Order[];
  order_items: OrderItem[];
  coupons: Coupon[];
};

function seed(): DemoDB {
  return {
    stores: structuredClone(SEED_STORES),
    users: structuredClone(SEED_USERS),
    categories: structuredClone(SEED_CATEGORIES),
    products: structuredClone(SEED_PRODUCTS),
    product_options: structuredClone(SEED_OPTIONS),
    option_items: structuredClone(SEED_OPTION_ITEMS),
    neighborhoods: structuredClone(SEED_NEIGHBORHOODS),
    couriers: structuredClone(SEED_COURIERS),
    orders: [],
    order_items: [],
    coupons: [],
  };
}

const STORE_DEFAULTS: Record<
  string,
  Pick<Store, "name" | "logo_url" | "hours">
> = {
  "store-acai": {
    name: "Fast Cuscuz e Açaí",
    logo_url: "/stores/acai.svg",
    hours: "11:00–22:00",
  },
  "store-burger": {
    name: "Carioca Burguers",
    logo_url: "/stores/burger.svg",
    hours: "18:00–23:30",
  },
};

const PRODUCT_IMAGES: Record<string, string> = {
  "prod-acai-500":
    "https://images.unsplash.com/photo-1505252585461-04db1eb84625?auto=format&fit=crop&w=640&q=80",
  "prod-cuscuz":
    "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=640&q=80",
  "prod-smash":
    "https://images.unsplash.com/photo-1568901345627-8ff6654a8cdc?auto=format&fit=crop&w=640&q=80",
  "prod-fries":
    "https://images.unsplash.com/photo-1573080496120-ff74b206e2a4?auto=format&fit=crop&w=640&q=80",
};

function migrateDb(db: DemoDB) {
  let changed = false;

  for (const store of db.stores) {
    const defaults = STORE_DEFAULTS[store.id];
    if (defaults) {
      if (store.name !== defaults.name) {
        store.name = defaults.name;
        changed = true;
      }
      if (!store.logo_url) {
        store.logo_url = defaults.logo_url;
        changed = true;
      }
      if (!store.hours) {
        store.hours = defaults.hours;
        changed = true;
      }
    }
    if (typeof store.accepting_orders !== "boolean") {
      store.accepting_orders = true;
      changed = true;
    }
    if (!store.hours) {
      store.hours = "11:00–22:00";
      changed = true;
    }
    if (store.whatsapp === undefined) {
      store.whatsapp = "";
      changed = true;
    }
    if (typeof store.extra_sunday_fee !== "number") {
      store.extra_sunday_fee = 0;
      changed = true;
    }
    if (typeof store.extra_night_fee !== "number") {
      store.extra_night_fee = 0;
      changed = true;
    }
    if (!store.night_starts_at) {
      store.night_starts_at = "22:00";
      changed = true;
    }
    if (typeof store.paused_high_demand !== "boolean") {
      store.paused_high_demand = false;
      changed = true;
    }
  }

  if (!db.coupons) {
    db.coupons = [];
    changed = true;
  }

  for (const product of db.products) {
    const image = PRODUCT_IMAGES[product.id];
    if (image && !product.image_url) {
      product.image_url = image;
      changed = true;
    }
    if (typeof product.sold_out !== "boolean") {
      product.sold_out = false;
      changed = true;
    }
  }

  for (const user of db.users) {
    if (user.role === "master") {
      if (user.email !== "mariapaularibeiro105@gmail.com") {
        user.email = "mariapaularibeiro105@gmail.com";
        changed = true;
      }
      if (user.password) {
        delete user.password;
        changed = true;
      }
    }
  }

  return { db, changed };
}

function readDb(): DemoDB {
  if (typeof window === "undefined") return seed();
  const raw = localStorage.getItem(DB_KEY);
  if (!raw) {
    const initial = seed();
    localStorage.setItem(DB_KEY, JSON.stringify(initial));
    return initial;
  }
  try {
    const { db, changed } = migrateDb(JSON.parse(raw) as DemoDB);
    if (changed) localStorage.setItem(DB_KEY, JSON.stringify(db));
    return db;
  } catch {
    const initial = seed();
    localStorage.setItem(DB_KEY, JSON.stringify(initial));
    return initial;
  }
}

function writeDb(db: DemoDB) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
  window.dispatchEvent(new Event("pb-db"));
  try {
    const channel = new BroadcastChannel(CHANNEL);
    channel.postMessage("update");
    channel.close();
  } catch {
    // BroadcastChannel pode não existir em alguns contextos.
  }
}

export function subscribeDemoDb(onChange: () => void) {
  const handler = () => onChange();
  window.addEventListener("pb-db", handler);
  window.addEventListener("storage", handler);
  let channel: BroadcastChannel | null = null;
  try {
    channel = new BroadcastChannel(CHANNEL);
    channel.onmessage = handler;
  } catch {
    channel = null;
  }
  return () => {
    window.removeEventListener("pb-db", handler);
    window.removeEventListener("storage", handler);
    channel?.close();
  };
}

function uid(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function getActiveStores() {
  return readDb().stores.filter((store) => store.active);
}

export function getAllStores() {
  return readDb().stores;
}

export function getStoreBySlug(slug: string) {
  return readDb().stores.find((store) => store.slug === slug) ?? null;
}

export function getStoreCatalog(
  slug: string,
  options?: { includeSoldOut?: boolean },
): StoreCatalog | null {
  const db = readDb();
  const store = db.stores.find((item) => item.slug === slug && item.active);
  if (!store) return null;

  const categories = db.categories
    .filter((item) => item.store_id === store.id && item.active)
    .sort((a, b) => a.order - b.order);

  const products = db.products
    .filter(
      (item) =>
        item.store_id === store.id &&
        item.active &&
        (options?.includeSoldOut || !item.sold_out),
    )
    .map((product) => ({
      ...product,
      options: db.product_options
        .filter((option) => option.product_id === product.id)
        .map((option) => ({
          ...option,
          items: db.option_items.filter((item) => item.option_id === option.id),
        })),
    }));

  return {
    store,
    categories,
    products,
    neighborhoods: db.neighborhoods.filter((item) => item.store_id === store.id),
    couriers: db.couriers.filter((item) => item.store_id === store.id && item.active),
    coupons: db.coupons.filter((item) => item.store_id === store.id && item.active),
  };
}

export function getOrdersByStore(storeId: string): OrderWithDetails[] {
  const db = readDb();
  return db.orders
    .filter((order) => order.store_id === storeId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((order) => hydrateOrder(db, order));
}

export function getOrderById(orderId: string): OrderWithDetails | null {
  const db = readDb();
  const order = db.orders.find((item) => item.id === orderId);
  return order ? hydrateOrder(db, order) : null;
}

function persistOrder(order: OrderWithDetails) {
  if (typeof window === "undefined") return;
  void fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(order),
  }).catch(() => undefined);
}

function hydrateOrder(db: DemoDB, order: Order): OrderWithDetails {
  return {
    ...order,
    items: db.order_items.filter((item) => item.order_id === order.id),
    neighborhood:
      db.neighborhoods.find((item) => item.id === order.neighborhood_id) ?? null,
    courier: db.couriers.find((item) => item.id === order.courier_id) ?? null,
  };
}

export function createOrder(payload: CheckoutPayload): OrderWithDetails {
  const db = readDb();
  const order: Order = {
    id: uid("ord"),
    store_id: payload.storeId,
    customer_name: payload.customerName,
    customer_phone: payload.customerPhone,
    order_type: payload.orderType,
    address: payload.address,
    neighborhood_id: payload.neighborhoodId,
    payment_method: payload.paymentMethod,
    change_for: payload.changeFor,
    status: "pending",
    total_amount: payload.totalAmount,
    courier_id: null,
    notes: payload.notes,
    created_at: new Date().toISOString(),
    coupon_code: payload.couponCode ?? null,
    discount: payload.discount ?? 0,
  };

  const items: OrderItem[] = payload.items.map((item) => ({
    id: uid("item"),
    order_id: order.id,
    product_id: item.productId,
    product_name: item.name,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    observation: item.observation || null,
    options_selected_json: item.optionsSelected,
  }));

  db.orders.unshift(order);
  db.order_items.push(...items);
  writeDb(db);
  const hydrated = hydrateOrder(db, order);
  void persistOrder(hydrated);
  return hydrated;
}

export function updateOrderStatus(orderId: string, status: OrderStatus) {
  const db = readDb();
  const order = db.orders.find((item) => item.id === orderId);
  if (!order) return null;
  order.status = status;
  writeDb(db);
  const hydrated = hydrateOrder(db, order);
  void persistOrder(hydrated);
  return hydrated;
}

export function assignCourier(orderId: string, courierId: string | null) {
  const db = readDb();
  const order = db.orders.find((item) => item.id === orderId);
  if (!order) return null;
  order.courier_id = courierId;
  writeDb(db);
  const hydrated = hydrateOrder(db, order);
  void persistOrder(hydrated);
  return hydrated;
}

export function createTestDeliveryOrder(storeSlug: string) {
  const catalog = getStoreCatalog(storeSlug);
  if (!catalog) return null;
  const product = catalog.products[0];
  const neighborhood = catalog.neighborhoods[0];
  return createOrder({
    storeId: catalog.store.id,
    customerName: "Cliente Teste",
    customerPhone: "13988880000",
    orderType: "delivery",
    address: "Rua das Palmeiras, 120",
    neighborhoodId: neighborhood?.id ?? null,
    paymentMethod: "pix",
    changeFor: null,
    notes: "Pedido teste para acompanhar o andamento",
    items: product
      ? [
          {
            id: crypto.randomUUID(),
            productId: product.id,
            name: product.name,
            quantity: 1,
            unitPrice: product.price,
            observation: "",
            optionsSelected: [],
          },
        ]
      : [],
    totalAmount: (product?.price ?? 0) + (neighborhood?.delivery_fee ?? 0),
  });
}

export function demoLogin(email: string, password: string) {
  const normalized = email.trim().toLowerCase();
  const pass = password.trim();
  const user = readDb().users.find(
    (item) =>
      item.role !== "master" &&
      item.email.toLowerCase() === normalized &&
      item.password === pass,
  );
  if (!user) return null;
  const session = {
    email: user.email,
    role: user.role,
    storeId: user.store_id,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  document.cookie = `pb_session=${encodeURIComponent(JSON.stringify(session))}; path=/; max-age=604800`;
  return session;
}

export function demoLogout() {
  localStorage.removeItem(SESSION_KEY);
  document.cookie = "pb_session=; path=/; max-age=0";
}

export function getDemoSession() {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as {
      email: string;
      role: "admin" | "master";
      storeId: string | null;
    };
  } catch {
    return null;
  }
}

export function upsertStore(input: Partial<Store> & { name: string; slug: string }) {
  const db = readDb();
  const existing = input.id ? db.stores.find((item) => item.id === input.id) : null;
  if (existing) {
    Object.assign(existing, input);
  } else {
    db.stores.push({
      id: uid("store"),
      name: input.name,
      slug: input.slug,
      logo_url: input.logo_url ?? null,
      primary_color: input.primary_color ?? "#f59e0b",
      pix_key: input.pix_key ?? "",
      hours: input.hours ?? "11:00–22:00",
      accepting_orders: input.accepting_orders ?? true,
      active: input.active ?? true,
      created_at: new Date().toISOString(),
    });
  }
  writeDb(db);
  return db.stores;
}

export function patchStore(storeId: string, patch: Partial<Store>) {
  const db = readDb();
  const store = db.stores.find((item) => item.id === storeId);
  if (!store) return null;
  Object.assign(store, patch);
  writeDb(db);
  return store;
}

export function setStoreActive(storeId: string, active: boolean) {
  return patchStore(storeId, { active });
}

export function setAcceptingOrders(storeId: string, accepting: boolean) {
  return patchStore(
    storeId,
    accepting
      ? { accepting_orders: true }
      : { accepting_orders: false, paused_high_demand: false },
  );
}

export function setPausedHighDemand(storeId: string, paused: boolean) {
  return patchStore(
    storeId,
    paused
      ? { paused_high_demand: true, accepting_orders: true }
      : { paused_high_demand: false },
  );
}

export function createStoreAdmin(storeId: string, email: string, password: string) {
  const db = readDb();
  const normalized = email.trim().toLowerCase();
  if (db.users.some((item) => item.email.toLowerCase() === normalized)) {
    return { ok: false as const, error: "Este e-mail já está cadastrado." };
  }
  db.users.push({
    id: uid("user"),
    user_id: uid("user"),
    store_id: storeId,
    role: "admin",
    email: normalized,
    password,
  });
  writeDb(db);
  return { ok: true as const };
}

export function updateStoreAdmin(
  userId: string,
  patch: { email?: string; password?: string },
) {
  const db = readDb();
  const user = db.users.find((item) => item.id === userId && item.role === "admin");
  if (!user) return { ok: false as const, error: "Usuário não encontrado." };
  if (patch.email) {
    const normalized = patch.email.trim().toLowerCase();
    const taken = db.users.some(
      (item) => item.id !== userId && item.email.toLowerCase() === normalized,
    );
    if (taken) return { ok: false as const, error: "Este e-mail já está cadastrado." };
    user.email = normalized;
  }
  if (patch.password) user.password = patch.password;
  writeDb(db);
  return { ok: true as const };
}

export function removeStoreAdmin(userId: string) {
  const db = readDb();
  const user = db.users.find((item) => item.id === userId && item.role === "admin");
  if (!user) return { ok: false as const, error: "Usuário não encontrado." };
  db.users = db.users.filter((item) => item.id !== userId);
  writeDb(db);
  return { ok: true as const };
}

export function saveCategory(category: Category) {
  const db = readDb();
  const existing = db.categories.find((item) => item.id === category.id);
  if (existing) Object.assign(existing, category);
  else db.categories.push(category);
  writeDb(db);
}

export function saveProduct(product: Product) {
  const db = readDb();
  const existing = db.products.find((item) => item.id === product.id);
  if (existing) Object.assign(existing, product);
  else db.products.push(product);
  writeDb(db);
}

export function removeProduct(productId: string) {
  const db = readDb();
  const optionIds = db.product_options
    .filter((item) => item.product_id === productId)
    .map((item) => item.id);
  db.products = db.products.filter((item) => item.id !== productId);
  db.product_options = db.product_options.filter((item) => item.product_id !== productId);
  db.option_items = db.option_items.filter((item) => !optionIds.includes(item.option_id));
  writeDb(db);
}

export function saveNeighborhood(neighborhood: Neighborhood) {
  const db = readDb();
  const existing = db.neighborhoods.find((item) => item.id === neighborhood.id);
  if (existing) Object.assign(existing, neighborhood);
  else db.neighborhoods.push(neighborhood);
  writeDb(db);
}

export function removeNeighborhood(id: string) {
  const db = readDb();
  db.neighborhoods = db.neighborhoods.filter((item) => item.id !== id);
  writeDb(db);
}

export function saveCourier(courier: Courier) {
  const db = readDb();
  const existing = db.couriers.find((item) => item.id === courier.id);
  if (existing) Object.assign(existing, courier);
  else db.couriers.push(courier);
  writeDb(db);
}

export function savePixKey(storeId: string, pixKey: string) {
  patchStore(storeId, { pix_key: pixKey });
}

export function saveProductOption(option: ProductOption, items: OptionItem[]) {
  const db = readDb();
  const existing = db.product_options.find((item) => item.id === option.id);
  if (existing) Object.assign(existing, option);
  else db.product_options.push(option);
  db.option_items = db.option_items.filter((item) => item.option_id !== option.id);
  db.option_items.push(...items);
  writeDb(db);
}

export function removeProductOption(optionId: string) {
  const db = readDb();
  db.product_options = db.product_options.filter((item) => item.id !== optionId);
  db.option_items = db.option_items.filter((item) => item.option_id !== optionId);
  writeDb(db);
}

export function getStoreUsers(storeId?: string) {
  const db = readDb();
  return storeId
    ? db.users.filter((item) => item.store_id === storeId)
    : db.users;
}

export function mergeRemoteOrders(orders: OrderWithDetails[]) {
  if (orders.length === 0) return;
  const db = readDb();
  for (const incoming of orders) {
    const { items, neighborhood: _n, courier: _c, ...plain } = incoming;
    const existing = db.orders.find((item) => item.id === incoming.id);
    if (existing) Object.assign(existing, plain);
    else db.orders.unshift(plain);
    db.order_items = db.order_items.filter((item) => item.order_id !== incoming.id);
    db.order_items.push(...items);
  }
  writeDb(db);
}

export function getOrdersByPhone(storeId: string, phone: string) {
  const digits = phone.replace(/\D/g, "");
  return getOrdersByStore(storeId).filter(
    (order) => order.customer_phone.replace(/\D/g, "") === digits,
  );
}

export function setProductSoldOut(productId: string, soldOut: boolean) {
  const db = readDb();
  const product = db.products.find((item) => item.id === productId);
  if (!product) return;
  product.sold_out = soldOut;
  writeDb(db);
}

export function saveCoupon(coupon: Coupon) {
  const db = readDb();
  const existing = db.coupons.find((item) => item.id === coupon.id);
  if (existing) Object.assign(existing, coupon);
  else db.coupons.push(coupon);
  writeDb(db);
}

export function removeCoupon(id: string) {
  const db = readDb();
  db.coupons = db.coupons.filter((item) => item.id !== id);
  writeDb(db);
}

export function getStoreCoupons(storeId: string) {
  return readDb().coupons.filter((item) => item.store_id === storeId);
}

export function findCoupon(storeId: string, code: string) {
  const normalized = code.trim().toUpperCase();
  return (
    readDb().coupons.find(
      (item) =>
        item.store_id === storeId && item.active && item.code.toUpperCase() === normalized,
    ) ?? null
  );
}
