'use server';

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireRole } from '@/lib/supabase/server';

export type StaffMemberInput = {
  id?: string;
  name: string;
  role: string;
  pin?: string;
  email?: string;
};

export type StaffActionResult = {
  success?: boolean;
  error?: string;
  pin?: string;
};

function generateAutomaticPin(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

async function createNewStaffUser(
  name: string,
  role: string,
  pin: string,
  email: string
): Promise<StaffActionResult> {
  const password = `pin${pin}partyflow`;
  const { data: newUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name, role, pin }
  });

  if (authError) {
    if (authError.message.includes('already been registered')) {
      return { error: 'El email ya está en uso por otra persona.' };
    }
    return { error: authError.message };
  }

  await supabaseAdmin.from('profiles').update({
    full_name: name,
    role,
    pin,
    email
  }).eq('id', newUser.user.id);

  return { success: true, pin };
}

async function updateExistingStaffUser(
  id: string,
  name: string,
  role: string,
  pin: string,
  email: string
): Promise<StaffActionResult> {
  const password = `pin${pin}partyflow`;
  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(id, {
    email,
    password,
    user_metadata: { full_name: name, role, pin }
  });

  if (updateError) {
    return { error: updateError.message };
  }

  await supabaseAdmin.from('profiles').update({
    full_name: name,
    role,
    pin,
    email
  }).eq('id', id);

  return { success: true, pin };
}

export async function createOrUpdateStaffMember(data: StaffMemberInput): Promise<StaffActionResult> {
  try {
    await requireRole(['admin']);
    const pin = data.pin && data.pin.length === 4 ? data.pin : generateAutomaticPin();
    const email = data.email && data.email.trim().length > 0 
      ? data.email.trim() 
      : `staff_${pin}@partyflow.app`;

    if (data.id && data.id.startsWith('staff-')) {
      return await createNewStaffUser(data.name, data.role, pin, email);
    } else if (data.id) {
      return await updateExistingStaffUser(data.id, data.name, data.role, pin, email);
    }

    return { error: 'Datos de personal inválidos.' };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error inesperado';
    return { error: message };
  }
}

export async function deleteStaffMember(id: string): Promise<{ success?: boolean; error?: string }> {
  try {
    await requireRole(['admin']);
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (error) return { error: error.message };
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error inesperado';
    return { error: message };
  }
}
