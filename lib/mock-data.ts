import type {
  Category,
  Courier,
  Neighborhood,
  OptionItem,
  Product,
  ProductOption,
  Store,
  StoreUser,
} from "./types";

const now = "2026-08-28T12:00:00.000Z";

export const SEED_STORES: Store[] = [
  {
    id: "store-acai",
    name: "Sabor & Cia",
    slug: "acai",
    logo_url: null,
    primary_color: "#f59e0b",
    pix_key: "13.123.456/0001-99",
    active: true,
    created_at: now,
  },
  {
    id: "store-burger",
    name: "Burger House",
    slug: "burger",
    logo_url: null,
    primary_color: "#dc2626",
    pix_key: "11987654321",
    active: true,
    created_at: now,
  },
];

export const SEED_USERS: StoreUser[] = [
  {
    id: "user-master",
    user_id: "user-master",
    store_id: null,
    role: "master",
    email: "master@pedidosbertioga.com",
    password: "master123",
  },
  {
    id: "user-acai",
    user_id: "user-acai",
    store_id: "store-acai",
    role: "admin",
    email: "acai@loja.com",
    password: "admin123",
  },
  {
    id: "user-burger",
    user_id: "user-burger",
    store_id: "store-burger",
    role: "admin",
    email: "burger@loja.com",
    password: "admin123",
  },
];

export const SEED_CATEGORIES: Category[] = [
  { id: "cat-acai", store_id: "store-acai", name: "Açaí no Copo", order: 1, active: true },
  { id: "cat-cuscuz", store_id: "store-acai", name: "Cuscuz Recheado", order: 2, active: true },
  { id: "cat-burger", store_id: "store-burger", name: "Hambúrgueres", order: 1, active: true },
  { id: "cat-sides", store_id: "store-burger", name: "Acompanhamentos", order: 2, active: true },
];

export const SEED_PRODUCTS: Product[] = [
  {
    id: "prod-acai-500",
    store_id: "store-acai",
    category_id: "cat-acai",
    name: "Açaí Tradicional 500ml",
    description: "Escolha até 3 complementos grátis e adicionais.",
    price: 18,
    image_url: null,
    active: true,
  },
  {
    id: "prod-cuscuz",
    store_id: "store-acai",
    category_id: "cat-cuscuz",
    name: "Cuscuz com Carne Seca e Queijo",
    description: "Massa fofinha temperada na manteiga de garrafa.",
    price: 22,
    image_url: null,
    active: true,
  },
  {
    id: "prod-smash",
    store_id: "store-burger",
    category_id: "cat-burger",
    name: "Smash Burger Duplo",
    description: "Dois smash 80g, queijo cheddar e molho da casa.",
    price: 28,
    image_url: null,
    active: true,
  },
  {
    id: "prod-fries",
    store_id: "store-burger",
    category_id: "cat-sides",
    name: "Batata Frita",
    description: "Porção crocante para 1 pessoa.",
    price: 12,
    image_url: null,
    active: true,
  },
];

export const SEED_OPTIONS: ProductOption[] = [
  {
    id: "opt-acai-size",
    store_id: "store-acai",
    product_id: "prod-acai-500",
    title: "Tamanho",
    min_choices: 1,
    max_choices: 1,
  },
  {
    id: "opt-acai-free",
    store_id: "store-acai",
    product_id: "prod-acai-500",
    title: "Complementos grátis",
    min_choices: 0,
    max_choices: 3,
  },
  {
    id: "opt-acai-paid",
    store_id: "store-acai",
    product_id: "prod-acai-500",
    title: "Adicionais pagos",
    min_choices: 0,
    max_choices: 6,
  },
  {
    id: "opt-smash-point",
    store_id: "store-burger",
    product_id: "prod-smash",
    title: "Ponto da carne",
    min_choices: 1,
    max_choices: 1,
  },
  {
    id: "opt-smash-extras",
    store_id: "store-burger",
    product_id: "prod-smash",
    title: "Adicionais pagos",
    min_choices: 0,
    max_choices: 4,
  },
];

export const SEED_OPTION_ITEMS: OptionItem[] = [
  { id: "oi-500", option_id: "opt-acai-size", name: "500ml", price: 0 },
  { id: "oi-700", option_id: "opt-acai-size", name: "700ml", price: 6 },
  { id: "oi-leite", option_id: "opt-acai-free", name: "Leite em Pó", price: 0 },
  { id: "oi-granola", option_id: "opt-acai-free", name: "Granola", price: 0 },
  { id: "oi-morango", option_id: "opt-acai-free", name: "Morango", price: 0 },
  { id: "oi-banana", option_id: "opt-acai-free", name: "Banana", price: 0 },
  { id: "oi-nutella", option_id: "opt-acai-paid", name: "Nutella", price: 4 },
  { id: "oi-leite-ninho", option_id: "opt-acai-paid", name: "Leite Ninho extra", price: 3 },
  { id: "oi-medium", option_id: "opt-smash-point", name: "Ao ponto", price: 0 },
  { id: "oi-well", option_id: "opt-smash-point", name: "Bem passado", price: 0 },
  { id: "oi-bacon", option_id: "opt-smash-extras", name: "Bacon", price: 5 },
  { id: "oi-egg", option_id: "opt-smash-extras", name: "Ovo", price: 3 },
];

export const SEED_NEIGHBORHOODS: Neighborhood[] = [
  { id: "nb-centro", store_id: "store-acai", name: "Centro", delivery_fee: 5 },
  { id: "nb-albatroz", store_id: "store-acai", name: "Jardim Albatroz", delivery_fee: 8 },
  { id: "nb-riviera", store_id: "store-acai", name: "Riviera", delivery_fee: 12 },
  { id: "nb-centro-b", store_id: "store-burger", name: "Centro", delivery_fee: 6 },
  { id: "nb-indaia", store_id: "store-burger", name: "Indaiá", delivery_fee: 9 },
];

export const SEED_COURIERS: Courier[] = [
  { id: "cr-joao", store_id: "store-acai", name: "João Silva", phone: "13988881111", active: true },
  { id: "cr-carlos", store_id: "store-acai", name: "Carlos Souza", phone: "13988882222", active: true },
  { id: "cr-ana", store_id: "store-burger", name: "Ana Motoboy", phone: "13977771111", active: true },
];
