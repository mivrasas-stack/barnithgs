import * as dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

async function test() {
  console.log("Testing create user...");
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: 'staff_9999@partyflow.app',
    password: 'pin9999partyflow',
    email_confirm: true,
    user_metadata: { full_name: 'Test', role: 'admin', pin: '9999' }
  });

  if (error) {
    console.error("Error creating user:", error);
  } else {
    console.log("User created successfully:", data.user?.id);
    
    // Clean up
    if (data.user) {
        await supabaseAdmin.auth.admin.deleteUser(data.user.id);
        console.log("User deleted.");
    }
  }
}

test();
