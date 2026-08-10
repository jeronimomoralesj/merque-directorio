import Image from 'next/image';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import AdminDashboard from '@/components/admin/AdminDashboard';

export const revalidate = 0;

const LOGO_URL =
  'https://www.merquellantas.com/assets/images/logo/Logo-Merquellantas.png';

export default async function AdminPage() {
  // Middleware already verified this user is authenticated and role === 'admin'.
  const supabase = createServerSupabaseClient();

  const [{ data: salesmen }, { data: prizes }, { data: spinLogs }] = await Promise.all([
    supabase
      .from('salesmen')
      .select('id, name, email, location, profile_views, whatsapp_clicks, role, photo_base64')
      .order('name'),
    supabase
      .from('prizes')
      .select('id, prize_name, image_url, day1_stock, day2_stock, day3_stock, probability_weight')
      .order('prize_name'),
    supabase
      .from('spin_logs')
      .select('id, salesman_email, prize_won, day_number, timestamp')
      .order('timestamp', { ascending: false })
      .limit(50),
  ]);

  return (
    <main className="min-h-screen bg-ink-50 px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center gap-3">
          <div className="relative h-11 w-11 overflow-hidden rounded-xl bg-white p-1.5 shadow-sm">
            <Image src={LOGO_URL} alt="Merquellantas" fill className="object-contain" />
          </div>
          <div>
            <h1 className="font-display text-xl text-ink-900 sm:text-2xl">Admin Dashboard</h1>
            <p className="text-sm text-ink-500">Convention command center</p>
          </div>
        </div>

        <AdminDashboard
          salesmen={salesmen || []}
          prizes={prizes || []}
          spinLogs={spinLogs || []}
        />
      </div>
    </main>
  );
}