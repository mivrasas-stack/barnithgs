'use server'

import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function createOrUpdateStaffMember(data: { id?: string, name: string, role: string, pin: string }) {
  try {
    const email = `staff_${data.pin}@partyflow.app`;
    const password = `pin${data.pin}partyflow`;

    if (data.id && data.id.startsWith('staff-')) {
      // Es un usuario nuevo que vino del UI de "Equipo Staff"
      const { data: newUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: data.name, role: data.role, pin: data.pin }
      });

      if (authError) {
        if (authError.message.includes('already been registered')) {
          return { error: 'El PIN ya está en uso por otra persona.' };
        }
        return { error: authError.message };
      }

      // El trigger en la base de datos (Supabase) creará el perfil automáticamente
      // pero actualizamos el PIN en metadata por si acaso
      return { success: true };
    } else if (data.id) {
      // Actualizar usuario existente
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(data.id, {
        email,
        password,
        user_metadata: { full_name: data.name, role: data.role, pin: data.pin }
      });

      if (updateError) {
        return { error: updateError.message };
      }

      // También actualizamos la tabla profiles manualmente por si el role o nombre cambió
      await supabaseAdmin.from('profiles').update({
        full_name: data.name,
        role: data.role,
        pin: data.pin
      }).eq('id', data.id);

      return { success: true };
    }

    return { error: 'Invalid data' };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deleteStaffMember(id: string) {
  try {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (error) return { error: error.message };
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
