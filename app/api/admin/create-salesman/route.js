import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { createAdminClient } from '@/lib/supabaseAdmin';

// Creates both the Supabase Auth login AND the public.salesmen profile row
// for a new team member. Requires the caller to already be an authenticated
// admin — re-checked here server-side, never trust the client.
export async function POST(request) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const { data: callerProfile } = await supabase
    .from('salesmen')
    .select('role')
    .eq('email', user.email)
    .single();

  if (!callerProfile || callerProfile.role !== 'admin') {
    return NextResponse.json({ error: 'Admins only.' }, { status: 403 });
  }

  const body = await request.json();
  const { name, email, phone, location, whatsapp_link, password, role } = body;

  if (!name || !email || !phone || !location || !whatsapp_link || !password) {
    return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: 'Password must be at least 8 characters.' },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  const { error: insertError } = await admin.from('salesmen').insert({
    name,
    email,
    phone,
    location,
    whatsapp_link,
    role: role === 'admin' ? 'admin' : 'salesman',
  });

  if (insertError) {
    // Roll back the auth account so we don't leave an orphaned login.
    await admin.auth.admin.deleteUser(authUser.user.id);
    return NextResponse.json({ error: insertError.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
