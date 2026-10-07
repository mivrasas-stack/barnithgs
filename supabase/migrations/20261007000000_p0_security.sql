-- Migración P0 de Seguridad - V3 (Correcciones Definitivas)

-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Función segura para verificar si un usuario es admin, con SCHEMA EXPLÍCITO y permisos mínimos
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT role = 'admin' FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- Revocar permisos de ejecución a todos por seguridad extrema
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM public;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Políticas para profiles
DROP POLICY IF EXISTS "Profiles are viewable by self" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;

CREATE POLICY "Profiles are viewable by self" 
ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can insert profiles"
ON public.profiles FOR INSERT WITH CHECK (public.is_admin());

-- Un administrador puede actualizar un perfil, pero nosotros restringiremos la tabla a nivel de columna
CREATE POLICY "Admins can update profiles"
ON public.profiles FOR UPDATE USING (public.is_admin());

-- Revocar TODOS los privilegios base
REVOKE ALL ON public.profiles FROM public;
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.profiles FROM authenticated;

-- Otorgar solo lo estrictamente necesario a authenticated:
-- Permitimos SELECT, pero NO permitimos INSERT/DELETE a usuarios normales (el backend con service_role los creará)
GRANT SELECT ON public.profiles TO authenticated;

-- IMPORTANTE: No permitimos UPDATE de columnas sensibles como 'role'. 
-- El service_role puede hacer UPDATE de cualquier columna, pero 'authenticated' solo si se lo permitimos (aquí NO lo permitimos).
-- Así, nadie (ni siquiera un admin mediante el cliente) puede hacer un UPDATE a `role` engañando a RLS, 
-- solo el servidor puede hacerlo.

-- Inventario Atómico (Diseño Transaccional)
CREATE TABLE IF NOT EXISTS public.stock_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,
  cart_id UUID NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stock_res_product ON public.stock_reservations(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_res_cart ON public.stock_reservations(cart_id);

-- Función segura para reservar stock
CREATE OR REPLACE FUNCTION public.reserve_stock(
  p_product_id UUID, 
  p_cart_id UUID, 
  p_quantity INTEGER, 
  p_ttl_minutes INTEGER DEFAULT 15
) RETURNS BOOLEAN AS $$
DECLARE
  v_physical_stock INTEGER;
  v_reserved_stock INTEGER;
BEGIN
  SELECT physical_quantity INTO v_physical_stock 
  FROM public.inventory 
  WHERE product_id = p_product_id
  FOR UPDATE;
  
  IF v_physical_stock IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT COALESCE(SUM(quantity), 0) INTO v_reserved_stock
  FROM public.stock_reservations
  WHERE product_id = p_product_id AND expires_at > now();

  IF (v_physical_stock - v_reserved_stock) >= p_quantity THEN
    INSERT INTO public.stock_reservations (product_id, cart_id, quantity, expires_at)
    VALUES (p_product_id, p_cart_id, p_quantity, now() + (p_ttl_minutes || ' minutes')::interval);
    
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Ocultar completamente reserve_stock del cliente. Sólo se puede ejecutar desde el servidor (service_role)
REVOKE EXECUTE ON FUNCTION public.reserve_stock(UUID, UUID, INTEGER, INTEGER) FROM public;
REVOKE EXECUTE ON FUNCTION public.reserve_stock(UUID, UUID, INTEGER, INTEGER) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.reserve_stock(UUID, UUID, INTEGER, INTEGER) FROM anon;
ALTER TABLE public.stock_reservations ENABLE ROW LEVEL SECURITY;

-- ProtecciÃ³n total
REVOKE ALL ON public.stock_reservations FROM public;
REVOKE ALL ON public.stock_reservations FROM anon;
REVOKE ALL ON public.stock_reservations FROM authenticated;

-- Foreign Keys (validación e integridad transaccional)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_product'
  ) THEN
    ALTER TABLE public.stock_reservations 
    ADD CONSTRAINT fk_product FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
  END IF;
END $$;
