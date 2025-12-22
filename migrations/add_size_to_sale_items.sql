-- Migración: Agregar campo de talle a sale_items
-- Permite registrar qué talle específico se vendió para productos de indumentaria

ALTER TABLE public.sale_items 
ADD COLUMN IF NOT EXISTS product_size_id uuid,
ADD COLUMN IF NOT EXISTS size text,
ADD COLUMN IF NOT EXISTS size_type text CHECK (size_type IN ('clothing', 'shoes'));

-- Agregar foreign key opcional a product_sizes
ALTER TABLE public.sale_items
ADD CONSTRAINT sale_items_product_size_id_fkey 
FOREIGN KEY (product_size_id) REFERENCES public.product_sizes(id) ON DELETE SET NULL;

-- Comentarios para documentación
COMMENT ON COLUMN public.sale_items.product_size_id IS 'ID del talle específico vendido (opcional, solo para productos con talles)';
COMMENT ON COLUMN public.sale_items.size IS 'Talle vendido (ej: "S", "M", "L" o "36", "37", etc.)';
COMMENT ON COLUMN public.sale_items.size_type IS 'Tipo de talle: "clothing" para ropa o "shoes" para zapatillas';

