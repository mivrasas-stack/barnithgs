'use server';

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireRole } from '@/lib/supabase/server';

export type StaffMemberInput = {
  id?: string;
  name: string;
  role: string;
  email: string;
};

export type StaffActionResult = {
  success?: boolean;
  error?: string;
};

const ALLOWED_ROLES = ['admin', 'driver', 'warehouse'];

async function createNewStaffUser(
  name: string,
  role: string,
  email: string
): Promise<StaffActionResult> {
  const { data: newUser, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: name }
  });

  if (authError || !newUser?.user?.id) {
    if (authError?.message?.includes('already been registered')) {
      return { error: 'El email ya está en uso por otra persona.' };
    }
    return { error: authError?.message || 'Error desconocido creando el usuario.' };
  }

  // Set the authoritative role in the secure profiles table
  const { error: profileError } = await supabaseAdmin.from('profiles').insert({
    id: newUser.user.id,
    full_name: name,
    role: role,
    email: email
  });

  // Rollback on failure
  if (profileError) {
    await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
    return { error: `Error creando perfil: ${profileError.message}` };
  }

  return { success: true };
}

async function updateExistingStaffUser(
  id: string,
  name: string,
  role: string,
  email: string
): Promise<StaffActionResult> {
  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(id, {
    email,
    user_metadata: { full_name: name }
  });

  if (updateError) {
    return { error: updateError.message };
  }

  const { error: profileError } = await supabaseAdmin.from('profiles').update({
    full_name: name,
    role,
    email
  }).eq('id', id);

  if (profileError) {
    return { error: `Error actualizando perfil: ${profileError.message}` };
  }

  return { success: true };
}

export async function createOrUpdateStaffMember(data: StaffMemberInput): Promise<StaffActionResult> {
  try {
    await requireRole(['admin']);
    
    if (!data.email || data.email.trim().length === 0) {
      return { error: 'El email es obligatorio para invitaciones seguras.' };
    }

    if (!ALLOWED_ROLES.includes(data.role)) {
      return { error: 'Rol inválido. Roles permitidos: ' + ALLOWED_ROLES.join(', ') };
    }

    if (data.id && data.id.startsWith('staff-')) {
      return await createNewStaffUser(data.name, data.role, data.email);
    } else if (data.id) {
      return await updateExistingStaffUser(data.id, data.name, data.role, data.email);
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
