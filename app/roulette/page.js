import Image from 'next/image';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import RouletteGame from '@/components/RouletteGame';

const LOGO_URL =
  'https://www.merquellantas.com/assets/images/logo/Logo-Merquellantas.png';

export default async function RoulettePage() {
  // Middleware already guarantees a valid session reaches this far.
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen bg-ink-900 px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-lg text-center">
        <div className="relative mx-auto h-14 w-14 overflow-hidden rounded-2xl bg-white p-2">
          <Image src={LOGO_URL} alt="Merquellantas" fill className="object-contain" />
        </div>
        <h1 className="mt-5 font-display text-2xl text-white sm:text-3xl">
          Booth Prize Wheel
        </h1>
        <p className="mt-2 text-sm text-ink-400">
          Signed in as <span className="text-brand-500">{user?.email}</span>. Let your
          booth visitor tap Spin!
        </p>
      </div>

      <div className="mt-10">
        <RouletteGame userEmail={user?.email} />
      </div>
    </main>
  );
}
