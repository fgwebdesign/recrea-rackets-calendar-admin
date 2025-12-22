-- Migración: Cambiar método de pago "mixed" por "mercadopago"
-- Actualiza el constraint CHECK en la tabla sales

-- Primero, actualizar los registros existentes que tengan "mixed" a "mercadopago"
UPDATE public.sales 
SET payment_method = 'mercadopago' 
WHERE payment_method = 'mixed';

-- Eliminar el constraint antiguo
ALTER TABLE public.sales 
DROP CONSTRAINT IF EXISTS sales_payment_method_check;

-- Agregar el nuevo constraint con "mercadopago" en lugar de "mixed"
ALTER TABLE public.sales 
ADD CONSTRAINT sales_payment_method_check 
CHECK (payment_method = ANY (ARRAY['cash'::text, 'transfer'::text, 'card'::text, 'mercadopago'::text, 'pending'::text]));

