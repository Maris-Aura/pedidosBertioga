"use client";

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
  };
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
    return JSON.parse(raw) as DemoDB;
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

export function getStoreCatalog(slug: string): StoreCatalog | null {
  const db = readDb();
  const store = db.stores.find((item) => item.slug === slug && item.active);
  if (!store) return null;

  const categories = db.categories
    .filter((item) => item.store_id === store.id && item.active)
    .sort((a, b) => a.order - b.order);

  const products = db.products
    .filter((item) => item.store_id === store.id && item.active)
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
  return hydrateOrder(db, order);
}

export function updateOrderStatus(orderId: string, status: OrderStatus) {
  const db = readDb();
  const order = db.orders.find((item) => item.id === orderId);
  if (!order) return null;
  order.status = status;
  writeDb(db);
  return hydrateOrder(db, order);
}

export function assignCourier(orderId: string, courierId: string | null) {
  const db = readDb();
  const order = db.orders.find((item) => item.id === orderId);
  if (!order) return null;
  order.courier_id = courierId;
  writeDb(db);
  return hydrateOrder(db, order);
}

export function demoLogin(email: string, password: string) {
  const user = readDb().users.find(
    (item) =>
      item.email.toLowerCase() === email.toLowerCase() && item.password === password,
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
      active: input.active ?? true,
      created_at: new Date().toISOString(),
    });
  }
  writeDb(db);
  return db.stores;
}

export function setStoreActive(storeId: string, active: boolean) {
  const db = readDb();
  const store = db.stores.find((item) => item.id === storeId);
  if (store) {
    store.active = active;
    writeDb(db);
  }
  return store ?? null;
}

export function createStoreAdmin(storeId: string, email: string, password: string) {
  const db = readDb();
  db.users.push({
    id: uid("user"),
    user_id: uid("user"),
    store_id: storeId,
    role: "admin",
    email,
    password,
  });
  writeDb(db);
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
  db.products = db.products.filter((item) => item.id !== productId);
  db.product_options = db.product_options.filter((item) => item.product_id !== productId);
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
  const db = readDb();
  const store = db.stores.find((item) => item.id === storeId);
  if (store) {
    store.pix_key = pixKey;
    writeDb(db);
  }
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

export function getStoreUsers(storeId?: string) {
  const db = readDb();
  return storeId
    ? db.users.filter((item) => item.store_id === storeId)
    : db.users;
}
