import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
          }
        },
      },
    }
  )
}

export async function requireAuth() {
  const supabase = await createClient();
  // getUser() validates the token on the server, getSession() only reads the cookie locally
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error('Unauthorized');
  }
  
  return { user, supabase };
}

export async function requireRole(allowedRoles: string[]) {
  const { user, supabase } = await requireAuth();
  
  // NEVER trust user_metadata for authorization, users can modify it via the client
  // Always query the secure profiles table protected by RLS / service_role
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
    
  if (error || !profile) {
    throw new Error('Profile not found');
  }
  
  if (!allowedRoles.includes(profile.role)) {
    throw new Error('Forbidden: Insufficient permissions');
  }
  
  return { user, role: profile.role };
}
