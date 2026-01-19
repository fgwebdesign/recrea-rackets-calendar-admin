// Tipos para el sistema de Kiosco/Punto de Venta

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductSize {
  id?: string;
  product_id?: string;
  size: string;
  size_type: 'clothing' | 'shoes';
  stock_quantity: number;
  created_at?: string;
  updated_at?: string;
}

export interface ProductAttribute {
  id?: string;
  product_id?: string;
  name: string; // "Color", "Sabor", etc.
  display_order?: number;
  values?: ProductAttributeValue[];
  created_at?: string;
  updated_at?: string;
}

export interface ProductAttributeValue {
  id?: string;
  attribute_id?: string;
  value: string; // "Azul", "Rojo", "Verde", etc.
  display_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ProductVariant {
  id?: string;
  product_id?: string;
  sku?: string;
  name?: string;
  price?: number; // Si es null, usa el precio del producto padre
  cost_price?: number;
  stock_quantity: number;
  image_url?: string;
  is_active?: boolean;
  attributes?: Array<{
    attribute_id: string;
    attribute_name: string;
    value_id: string;
    value: string;
  }>;
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  id: string;
  category_id: string;
  name: string;
  description?: string;
  sku?: string;
  barcode?: string;
  price: number;
  cost_price: number;
  stock_quantity: number;
  min_stock_alert: number;
  track_inventory: boolean;
  image_url?: string;
  is_active: boolean;
  is_featured: boolean;
  venue_id?: string;
  created_at: string;
  updated_at: string;
  // Relaciones
  category?: ProductCategory;
  venue?: {
    id: string;
    name: string;
  };
  sizes?: ProductSize[]; // Talles del producto (solo para indumentaria)
  attributes?: ProductAttribute[]; // Atributos para variantes (ej: Color, Sabor)
  variants?: ProductVariant[]; // Variantes del producto (ej: Powerade Azul, Powerade Rojo)
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  total: number;
  product_name: string;
  product_sku?: string;
  product_size_id?: string;
  product_variant_id?: string; // ID de la variante si se vendió una variante
  size?: string;
  size_type?: 'clothing' | 'shoes';
  created_at: string;
  // Relaciones
  product?: {
    id: string;
    image_url?: string;
  };
}

export interface Sale {
  id: string;
  sale_number: number;
  venue_id?: string;
  user_id?: string;
  customer_id?: string;
  customer_name?: string;
  subtotal: number;
  discount_amount: number;
  discount_percent: number;
  total: number;
  payment_method: 'cash' | 'transfer' | 'card' | 'mercadopago' | 'pending';
  payment_status: 'pending' | 'completed' | 'refunded' | 'cancelled';
  payment_reference?: string;
  sale_context: 'general' | 'tournament' | 'league' | 'class' | 'booking';
  tournament_id?: string;
  league_id?: string;
  notes?: string;
  sale_date: string;
  created_at: string;
  updated_at: string;
  // Relaciones
  venue?: {
    id: string;
    name: string;
  };
  seller?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  customer?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  items?: SaleItem[];
}

export interface InventoryMovement {
  id: string;
  product_id: string;
  movement_type: 'sale' | 'purchase' | 'adjustment' | 'return' | 'loss' | 'transfer';
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reference_type?: string;
  reference_id?: string;
  notes?: string;
  user_id?: string;
  venue_id?: string;
  created_at: string;
  // Relaciones
  product?: {
    id: string;
    name: string;
    sku?: string;
  };
  user?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  venue?: {
    id: string;
    name: string;
  };
}

// Tipos para formularios
export interface CreateProductCategoryData {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  sort_order?: number;
}

export interface UpdateProductCategoryData extends Partial<CreateProductCategoryData> {
  is_active?: boolean;
}

export interface CreateProductData {
  category_id: string;
  name: string;
  description?: string;
  sku?: string;
  barcode?: string;
  price: number;
  cost_price?: number;
  stock_quantity?: number;
  min_stock_alert?: number;
  track_inventory?: boolean;
  image_url?: string;
  is_active?: boolean;
  is_featured?: boolean;
  venue_id?: string;
  sizes?: ProductSize[]; // Talles para productos de indumentaria
  attributes?: Array<{
    name: string;
    values: string[]; // ["Azul", "Rojo", "Verde"]
    display_order?: number;
  }>;
  variants?: Array<{
    sku?: string;
    name?: string;
    price?: number;
    cost_price?: number;
    stock_quantity: number;
    image_url?: string;
    is_active?: boolean;
    attribute_values: Record<string, string>; // { "Color": "Azul" }
  }>;
}

export type UpdateProductData = Partial<CreateProductData>;

export interface CreateSaleData {
  items: Array<{
    product_id: string;
    quantity: number;
    unit_price?: number;
    discount_amount?: number;
    product_size_id?: string;
    product_variant_id?: string; // ID de la variante seleccionada
    size?: string;
    size_type?: 'clothing' | 'shoes';
  }>;
  venue_id?: string;
  customer_id?: string;
  customer_name?: string;
  payment_method: 'cash' | 'transfer' | 'card' | 'mercadopago' | 'pending';
  payment_reference?: string;
  sale_context?: 'general' | 'tournament' | 'league' | 'class' | 'booking';
  tournament_id?: string;
  league_id?: string;
  discount_amount?: number;
  discount_percent?: number;
  notes?: string;
}

export interface UpdateStockData {
  quantity: number;
  movement_type?: 'purchase' | 'adjustment' | 'return' | 'loss' | 'transfer';
  notes?: string;
}

// Tipos para reportes
export interface SalesSummary {
  total_sales: number;
  total_revenue: number;
  average_ticket: number;
  by_payment_method: Record<string, { count: number; total: number }>;
  by_context: Record<string, { count: number; total: number }>;
}

export interface TopProduct {
  product_id: string;
  product_name: string;
  total_quantity: number;
  total_revenue: number;
}

export interface DashboardStats {
  today: {
    sales_count: number;
    total_revenue: number;
    average_ticket: number;
  };
  week: {
    sales_count: number;
    total_revenue: number;
    average_ticket: number;
    daily_breakdown?: Array<{
      date: string;
      day_name: string;
      sales_count: number;
      total: number;
    }>;
  };
  month: {
    sales_count: number;
    total_revenue: number;
    average_ticket: number;
    variation_percent: number;
    previous_month_total: number;
  };
  payment_methods: Record<string, { count: number; total: number }>;
  low_stock_count: number;
  low_stock_products: Array<{
    id: string;
    name: string;
    stock_quantity: number;
    min_stock_alert: number;
    category?: {
      name: string;
    };
  }>;
}

export interface LowStockAlert {
  id: string;
  name: string;
  sku?: string;
  stock_quantity: number;
  min_stock_alert: number;
  category?: string;
  venue?: string;
  urgency: 'critical' | 'high' | 'medium';
}

export interface ProfitabilityReport {
  period: {
    start_date: string;
    end_date: string;
  };
  summary: {
    total_revenue: number;
    total_cost: number;
    total_profit: number;
    profit_margin_percent: number;
  };
  by_product: Array<{
    product_id: string;
    product_name: string;
    quantity_sold: number;
    revenue: number;
    cost: number;
    profit: number;
    profit_margin_percent: number;
  }>;
  by_category: Array<{
    category_id: string | null;
    category_name: string;
    icon?: string;
    color?: string;
    quantity_sold: number;
    revenue: number;
    cost: number;
    profit: number;
    profit_margin_percent: number;
  }>;
}

export interface ExpensesReport {
  period: {
    start_date: string;
    end_date: string;
  };
  summary: {
    total_expenses: number;
    total_units_sold: number;
    average_cost_per_unit: number;
  };
  by_product: Array<{
    product_id: string;
    product_name: string;
    quantity_sold: number;
    total_cost: number;
    average_cost_per_unit: number;
  }>;
  by_category: Array<{
    category_id: string | null;
    category_name: string;
    icon?: string;
    color?: string;
    quantity_sold: number;
    total_cost: number;
    average_cost_per_unit: number;
  }>;
}

// Filtros
export interface ProductFilters {
  category_id?: string;
  venue_id?: string;
  is_active?: boolean;
  search?: string;
  low_stock?: boolean;
}

export interface SaleFilters {
  venue_id?: string;
  payment_method?: string;
  payment_status?: string;
  sale_context?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}

export interface InventoryFilters {
  product_id?: string;
  venue_id?: string;
  movement_type?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
}

