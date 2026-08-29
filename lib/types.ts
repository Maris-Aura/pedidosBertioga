export type OrderStatus =
  | "pending"
  | "preparing"
  | "out_for_delivery"
  | "delivered";

export type OrderType = "delivery" | "pickup";
export type PaymentMethod = "pix" | "card" | "cash";
export type UserRole = "admin" | "master";

export type Store = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string;
  pix_key: string;
  hours: string;
  accepting_orders: boolean;
  active: boolean;
  created_at: string;
};

export type StoreUser = {
  id: string;
  user_id: string;
  store_id: string | null;
  role: UserRole;
  email: string;
  password?: string;
};

export type Category = {
  id: string;
  store_id: string;
  name: string;
  order: number;
  active: boolean;
};

export type Product = {
  id: string;
  store_id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  active: boolean;
};

export type ProductOption = {
  id: string;
  store_id: string;
  product_id: string;
  title: string;
  min_choices: number;
  max_choices: number;
};

export type OptionItem = {
  id: string;
  option_id: string;
  name: string;
  price: number;
};

export type Neighborhood = {
  id: string;
  store_id: string;
  name: string;
  delivery_fee: number;
};

export type Courier = {
  id: string;
  store_id: string;
  name: string;
  phone: string;
  active: boolean;
};

export type SelectedOption = {
  optionTitle: string;
  name: string;
  price: number;
};

export type Order = {
  id: string;
  store_id: string;
  customer_name: string;
  customer_phone: string;
  order_type: OrderType;
  address: string | null;
  neighborhood_id: string | null;
  payment_method: PaymentMethod;
  change_for: number | null;
  status: OrderStatus;
  total_amount: number;
  courier_id: string | null;
  notes: string | null;
  created_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  observation: string | null;
  options_selected_json: SelectedOption[];
};

export type OrderWithDetails = Order & {
  items: OrderItem[];
  neighborhood: Neighborhood | null;
  courier: Courier | null;
};

export type CatalogProduct = Product & {
  options: (ProductOption & { items: OptionItem[] })[];
};

export type StoreCatalog = {
  store: Store;
  categories: Category[];
  products: CatalogProduct[];
  neighborhoods: Neighborhood[];
  couriers: Courier[];
};

export type CartItem = {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  observation: string;
  optionsSelected: SelectedOption[];
};

export type CheckoutPayload = {
  storeId: string;
  customerName: string;
  customerPhone: string;
  orderType: OrderType;
  address: string | null;
  neighborhoodId: string | null;
  paymentMethod: PaymentMethod;
  changeFor: number | null;
  notes: string | null;
  items: CartItem[];
  totalAmount: number;
};

export type SessionUser = {
  email: string;
  role: UserRole;
  storeId: string | null;
};
