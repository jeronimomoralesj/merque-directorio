import { Poppins } from 'next/font/google';
import { createServerSupabaseClient } from '@/lib/supabaseServer'; // adjust path to your lib
import { CircleAlert, ExternalLink } from 'lucide-react';
import Gallery from './gallery';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  style: ['normal', 'italic'],
});

export const metadata = { title: 'Portafolio | Merquellantas' };
export const dynamic = 'force-dynamic';

const LOGO = 'https://merquellantas-navy.vercel.app/logo.jpeg';
const NEW_DAYS = 14;

export default async function PortafolioPage() {
  const supabase = createServerSupabaseClient();

  const [{ data, error }, { data: { user } }] = await Promise.all([
    supabase.from('tires').select('*').order('created_at', { ascending: false }),
    supabase.auth.getUser(),
  ]);

  // Flag recent uploads so the card can show a "Nuevo" badge
  const now = Date.now();
  const tires = (data ?? []).map((t) => ({
    ...t,
    isNew: now - new Date(t.created_at).getTime() < NEW_DAYS * 86_400_000,
  }));

  return (
    <div className={`${poppins.className} min-h-screen bg-slate-100 text-slate-900`}>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
          <a href="https://www.merquellantas.com" aria-label="Merquellantas">
            <img src={LOGO} alt="Merquellantas" className="h-6 w-auto sm:h-9" />
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold italic tracking-tight sm:text-4xl">Nuestro portafolio</h1>
          <p className="mt-1 text-slate-500">Llantas disponibles, con fotos reales y precio.</p>
        </div>

        <img />

        {error ? (
          <p className="flex items-center gap-2 rounded-2xl bg-red-50 p-4 text-red-700">
            <CircleAlert className="h-5 w-5 shrink-0" /> No se pudo cargar el portafolio: {error.message}
          </p>
        ) : (
          // Upload button only renders for signed-in users (RLS enforces it too)
          <Gallery tires={tires} canUpload={!!user} />
        )}
      </main>
    </div>
  );
}