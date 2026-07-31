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
<<<<<<< HEAD
    <main className="relative min-h-screen overflow-hidden bg-ink-50 px-4 py-10 sm:py-16">
      {/* soft festive backdrop */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      <div className="pointer-events-none absolute -top-24 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-brand-500/20 blur-[110px] sm:h-[28rem] sm:w-[28rem]" />

      <div className="relative mx-auto max-w-lg text-center">
        <div className="relative mx-auto h-16 w-16 overflow-hidden rounded-2xl border border-ink-200 bg-white p-2.5 shadow-sm sm:h-20 sm:w-20">
          <Image src={LOGO_URL} alt="Merquellantas" fill className="object-contain" />
        </div>

        <span className="mt-6 inline-block rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-brand-600">
          Evento en vivo
        </span>

        <h1 className="mt-4 font-display text-3xl leading-tight text-ink-900 sm:text-4xl">
          Booth Prize Wheel
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm text-ink-500 sm:text-base">
          Sesión iniciada como{' '}
          <span className="font-medium text-brand-600">{user?.email}</span>. Deja que tu
          visitante toque <span className="font-medium text-ink-900">Girar</span>.
        </p>
      </div>

      <div className="relative mx-auto mt-10 w-full max-w-2xl rounded-[2rem] border border-ink-200 bg-white p-4 shadow-xl shadow-ink-900/5 sm:mt-14 sm:p-8">
=======
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
>>>>>>> 94bde8f (first all)
        <RouletteGame userEmail={user?.email} />
      </div>
    </main>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> 94bde8f (first all)
