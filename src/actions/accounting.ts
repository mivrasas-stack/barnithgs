'use server';

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/supabase/server';

// --- GESTIÓN DE CAJAS / TURNOS ---

export async function getOpenRegister() {
  await requireRole(['admin']);
  const { data, error } = await supabaseAdmin
    .from('cash_registers')
    .select('*')
    .eq('status', 'open')
    .single();
    
  if (error && error.code !== 'PGRST116') {
    return { error: error.message };
  }
  return { data };
}

export async function openShift(adminId: string, initialBalance: number) {
  const { user } = await requireRole(['admin']);
  // Verificar si ya hay una caja abierta
  const current = await getOpenRegister();
  if (current.data) return { error: 'Ya existe un turno abierto.' };

  const { data, error } = await supabaseAdmin
    .from('cash_registers')
    .insert([
      { opened_by: user.id, initial_balance: initialBalance }
    ])
    .select()
    .single();

  if (error) return { error: error.message };
  
  revalidatePath('/homeadmin');
  return { success: true, data };
}

export async function getClosedShifts(limit = 10) {
  await requireRole(['admin']);
  const { data, error } = await supabaseAdmin
    .from('cash_registers')
    .select(`
      id, opened_at, closed_at, initial_balance, expected_balance, actual_balance, variance,
      opener:profiles!cash_registers_opened_by_fkey(name),
      closer:profiles!cash_registers_closed_by_fkey(name)
    `)
    .eq('status', 'closed')
    .order('closed_at', { ascending: false })
    .limit(limit);

  if (error) return { error: error.message };
  return { data };
}

export async function closeShift(registerId: string, adminId: string, actualBalance: number, expectedBalance: number) {
  const { user } = await requireRole(['admin']);
  const variance = actualBalance - expectedBalance;

  const { data, error } = await supabaseAdmin
    .from('cash_registers')
    .update({
      status: 'closed',
      closed_by: user.id,
      closed_at: new Date().toISOString(),
      actual_balance: actualBalance,
      expected_balance: expectedBalance,
      variance: variance
    })
    .eq('id', registerId)
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath('/homeadmin');
  return { success: true, data };
}

// --- GESTIÓN DE TRANSACCIONES (Gastos / Ingresos Extra) ---

export async function addTransaction(
  registerId: string, 
  adminId: string, 
  type: 'income' | 'expense', 
  amount: number, 
  category: string, 
  description: string,
  paymentMethod: 'cash' | 'transfer'
) {
  const { user } = await requireRole(['admin']);
  const { data, error } = await supabaseAdmin
    .from('transactions')
    .insert([
      {
        cash_register_id: registerId,
        created_by: user.id,
        type,
        amount,
        category,
        description,
        payment_method: paymentMethod
      }
    ])
    .select()
    .single();

  if (error) return { error: error.message };
  
  revalidatePath('/homeadmin');
  return { success: true, data };
}

// --- MÉTRICAS Y REPORTES ---

export async function getAccountingMetrics() {
  await requireRole(['admin']);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  // 1. Obtener ordenes completadas de los últimos 30 días, incluyendo COGS (unit_cost * quantity)
  const { data: orders, error: oError } = await supabaseAdmin
    .from('orders')
    .select(`
      id, 
      total_amount, 
      payment_method, 
      created_at, 
      delivery_fee, 
      tip_amount,
      order_items (
        quantity,
        unit_cost
      )
    `)
    .eq('status', 'completed')
    .gte('created_at', thirtyDaysAgo.toISOString());
    
  // 2. Obtener gastos de los últimos 30 días
  const { data: expenses, error: eError } = await supabaseAdmin
    .from('transactions')
    .select('amount, payment_method, created_at, type')
    .gte('created_at', thirtyDaysAgo.toISOString());
    
  return { orders: orders || [], expenses: expenses || [] };
}
