-- Migración P0 de Seguridad
-- 1. Eliminar pines en texto plano (se usarán contraseñas de Supabase Auth)
-- 2. Asegurar Row Level Security para las tablas principales
-- 3. Crear diseño de inventario transaccional

-- Habilitar RLS en tablas expuestas si no estaba
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles: Solo administradores o el mismo usuario pueden modificar su perfil.
CREATE POLICY "Profiles are viewable by users who created them." 
ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles."
ON profiles FOR SELECT USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Solo el admin puede gestionar personal
CREATE POLICY "Admins can insert profiles."
ON profiles FOR INSERT WITH CHECK (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Admins can update profiles."
ON profiles FOR UPDATE USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Inventario Atómico (Diseño Transaccional)
CREATE TABLE IF NOT EXISTS stock_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL, -- references products(id)
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
    RETURN FALSE; -- Producto no existe en inventario
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
    -- No hay suficiente stock disponible
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
