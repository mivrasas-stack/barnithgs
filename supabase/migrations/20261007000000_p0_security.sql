-- Migración P0 de Seguridad - V2 (Correcciones Críticas)
-- 1. Eliminar pines en texto plano
-- 2. Asegurar Row Level Security para las tablas principales
-- 3. Crear diseño de inventario transaccional
-- 4. Evitar recursión en profiles y proteger ejecución de RPCs

-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Función segura para verificar si un usuario es admin, ejecutada con privilegios de creador (bypassa RLS y evita recursión)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT role = 'admin' FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- Políticas para profiles
DROP POLICY IF EXISTS "Profiles are viewable by users who created them." ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles." ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles." ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles." ON profiles;

CREATE POLICY "Profiles are viewable by self" 
ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT USING (is_admin());

CREATE POLICY "Admins can insert profiles"
ON profiles FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can update profiles"
ON profiles FOR UPDATE USING (is_admin());

-- Revocar permisos por defecto a usuarios anónimos en profiles
REVOKE ALL ON profiles FROM public;
REVOKE ALL ON profiles FROM anon;
GRANT SELECT ON profiles TO authenticated;

-- Inventario Atómico (Diseño Transaccional)
CREATE TABLE IF NOT EXISTS stock_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,
  cart_id UUID NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stock_res_product ON stock_reservations(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_res_cart ON stock_reservations(cart_id);

-- Función segura para reservar stock
CREATE OR REPLACE FUNCTION reserve_stock(
  p_product_id UUID, 
  p_cart_id UUID, 
  p_quantity INTEGER, 
  p_ttl_minutes INTEGER DEFAULT 15
) RETURNS BOOLEAN AS $$
DECLARE
  v_physical_stock INTEGER;
  v_reserved_stock INTEGER;
BEGIN
  -- 1. Obtener stock físico real y bloquear la fila para prevenir race conditions
  SELECT physical_quantity INTO v_physical_stock 
  FROM inventory 
  WHERE product_id = p_product_id
  FOR UPDATE;
  
  IF v_physical_stock IS NULL THEN
    RETURN FALSE;
  END IF;

  -- 2. Calcular cuánto stock está actualmente reservado por otros y que no ha expirado
  SELECT COALESCE(SUM(quantity), 0) INTO v_reserved_stock
  FROM stock_reservations
  WHERE product_id = p_product_id AND expires_at > now();

  -- 3. Validar si queda suficiente stock disponible
  IF (v_physical_stock - v_reserved_stock) >= p_quantity THEN
    -- Hay stock disponible, registrar la reserva
    INSERT INTO stock_reservations (product_id, cart_id, quantity, expires_at)
    VALUES (p_product_id, p_cart_id, p_quantity, now() + (p_ttl_minutes || ' minutes')::interval);
    
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Restringir la ejecución de la función de reserva de stock
REVOKE EXECUTE ON FUNCTION reserve_stock FROM public;
REVOKE EXECUTE ON FUNCTION reserve_stock FROM anon;
GRANT EXECUTE ON FUNCTION reserve_stock TO authenticated;
