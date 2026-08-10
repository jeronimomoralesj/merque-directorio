import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import CRMDashboard from '@/components/CRMDashboard';

export const revalidate = 0;

export const metadata = {
  title: 'CRM Convención — Merquellantas',
};

export default async function CRMPage() {
  // Middleware guarantees a valid session reaches here.
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login?next=/crm');

  const { data: profile } = await supabase
    .from('salesmen')
    .select('id, name')
    .eq('email', user.email)
    .single();

  const salesmanName = profile?.name ?? user.email;

  return (
    <CRMDashboard
      user={{ email: user.email, id: user.id }}
      salesmanName={salesmanName}
      salesmanId={profile?.id ?? null}
    />
  );
}
