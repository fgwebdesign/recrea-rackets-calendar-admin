-- Migración: Agregar tabla para talles de productos
-- Esta tabla permite manejar diferentes talles (S, M, L, XL, XXL para ropa o números para zapatillas)
-- y el stock individual por cada talle

CREATE TABLE IF NOT EXISTS public.product_sizes (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  product_id uuid NOT NULL,
  size text NOT NULL, -- "S", "M", "L", "XL", "XXL" o "36", "37", "38", etc.
  size_type text NOT NULL DEFAULT 'clothing' CHECK (size_type IN ('clothing', 'shoes')), -- 'clothing' para ropa, 'shoes' para zapatillas
  stock_quantity integer DEFAULT 0 CHECK (stock_quantity >= 0),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT product_sizes_pkey PRIMARY KEY (id),
  CONSTRAINT product_sizes_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE,
  CONSTRAINT product_sizes_unique UNIQUE (product_id, size, size_type) -- Evitar duplicados del mismo talle
);

-- Índice para búsquedas rápidas por producto
CREATE INDEX IF NOT EXISTS idx_product_sizes_product_id ON public.product_sizes(product_id);

-- Comentarios para documentación
COMMENT ON TABLE public.product_sizes IS 'Almacena los talles disponibles y el stock por talle para productos de indumentaria';
COMMENT ON COLUMN public.product_sizes.size IS 'Talle del producto (ej: "S", "M", "L", "XL", "XXL" para ropa o "36", "37", "38" para zapatillas)';
COMMENT ON COLUMN public.product_sizes.size_type IS 'Tipo de talle: "clothing" para prendas de ropa o "shoes" para zapatillas';

