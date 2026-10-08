-- TEST FIXTURE FAULT INJECTION (ONLY FOR ISOLATED CI/LOCAL TESTING)
-- Used exclusively by integration test harness to verify ACID rollback behavior on consumption.
-- This is NOT a production migration and must never be applied to production databases.

CREATE OR REPLACE FUNCTION public.handle_stock_reservation_update_safety()
RETURNS TRIGGER AS $$
BEGIN
  -- Induced error for integration test verifying transaction rollback
  IF NEW.status = 'consumed' AND NEW.cart_id = 'ffffffff-ffff-ffff-ffff-ffffffffffff' THEN
    RAISE EXCEPTION 'SIMULATED_FINAL_PHASE_FAILURE: Induced error during reservation status transition';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_stock_reservation_update_safety ON public.stock_reservations;
CREATE TRIGGER trg_stock_reservation_update_safety
BEFORE UPDATE OF status ON public.stock_reservations
FOR EACH ROW EXECUTE FUNCTION public.handle_stock_reservation_update_safety();

-- Teardown procedure for test harness to remove fault injection dynamically
CREATE OR REPLACE FUNCTION public.teardown_test_fault_injection()
RETURNS BOOLEAN AS $$
BEGIN
  DROP TRIGGER IF EXISTS trg_stock_reservation_update_safety ON public.stock_reservations;
  DROP FUNCTION IF EXISTS public.handle_stock_reservation_update_safety();
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Explicitly restrict execution to service_role
REVOKE EXECUTE ON FUNCTION public.teardown_test_fault_injection() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.teardown_test_fault_injection() TO service_role;
