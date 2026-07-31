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

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-ink-50">
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
          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
              Couldn&apos;t load the directory right now. Check that your Supabase
              environment variables are set and the <code>salesmen</code> table exists.
            </div>
          ) : (
            <DirectoryGrid salesmen={salesmen || []} />
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
