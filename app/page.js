import { createServerSupabaseClient } from '@/lib/supabaseServer';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DirectoryGrid from '@/components/DirectoryGrid';

export const revalidate = 0;

export default async function DirectoryPage() {
  const supabase = createServerSupabaseClient();
  const { data: salesmen, error } = await supabase
    .from('salesmen')
    .select('id, name, location, whatsapp_link')
    .order('name', { ascending: true });

<<<<<<< HEAD
  const count = salesmen?.length ?? 0;

=======
>>>>>>> 94bde8f (first all)
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-ink-50">
<<<<<<< HEAD
        <section className="relative overflow-hidden border-b border-ink-800 bg-ink-900">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
              backgroundSize: '22px 22px',
            }}
          />
          <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-brand-500/25 blur-[100px]" />

          <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
            <span className="inline-block rounded-full border border-brand-500/40 bg-brand-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-brand-500">
              Directorio
            </span>
            <h1 className="mt-5 font-display text-3xl leading-tight text-white sm:text-5xl">
              Merquellantas
            </h1>
            <p className="mt-4 max-w-xl text-sm text-ink-300 sm:text-base">
              Encuentra al asesor comercial más cercano y contáctalo directamente por
              WhatsApp.
            </p>

            {!error && (
              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-ink-700 bg-ink-800/60 px-4 py-1.5 text-xs text-ink-300">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                {count} {count === 1 ? 'asesor disponible' : 'asesores disponibles'}
              </div>
            )}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
=======
        <section className="border-b border-ink-800 bg-ink-900">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
            <span className="inline-block rounded-full border border-brand-500/40 bg-brand-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-brand-500">
              Convention Directory
            </span>
            <h1 className="mt-5 font-display text-3xl leading-tight text-white sm:text-5xl">
              Meet the Merquellantas
              <br className="hidden sm:block" /> team on the floor
            </h1>
            <p className="mt-4 max-w-xl text-sm text-ink-300 sm:text-base">
              Find a representative, open their profile, and chat instantly on WhatsApp.
              Booth staff can unlock the prize wheel from the Team Login.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
>>>>>>> 94bde8f (first all)
          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
              Couldn&apos;t load the directory right now. Check that your Supabase
              environment variables are set and the <code>salesmen</code> table exists.
            </div>
<<<<<<< HEAD
          ) : count === 0 ? (
            <div className="rounded-2xl border border-ink-200 bg-white p-10 text-center text-sm text-ink-400">
              Aún no hay asesores registrados en el directorio.
            </div>
          ) : (
            <DirectoryGrid salesmen={salesmen} />
=======
          ) : (
            <DirectoryGrid salesmen={salesmen || []} />
>>>>>>> 94bde8f (first all)
          )}
        </section>
      </main>
      <Footer />
    </>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> 94bde8f (first all)
