import * as dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, anonKey);

async function test() {
  console.log("Testing sign in...");
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'staff_1234@partyflow.app', 
    password: 'pin1234partyflow'
  });

  if (error) {
    console.error("Error signing in:", error);
  } else {
    console.log("Signed in successfully:", data.user?.id);
    
    console.log("Fetching profile...");
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();
        
    console.log("Profile:", profile, "Error:", profileError);
  }
}

test();
