import { createServerSupabaseClient } from '@/lib/supabaseServer'; // adjust path to your lib
import { CircleAlert, PackageOpen } from 'lucide-react';
import Upload from './upload';
import TireCard from './tire-card';

export const metadata = { title: 'Portafolio' };
export const dynamic = 'force-dynamic';

export default async function PortafolioPage() {
  const supabase = createServerSupabaseClient();

  const [{ data: tires, error }, { data: { user } }] = await Promise.all([
    supabase.from('tires').select('*').order('created_at', { ascending: false }),
    supabase.auth.getUser(),
  ]);

  return (
    <main className="min-h-screen bg-slate-200 px-4 py-8 text-slate-900 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Portafolio</h1>
            <p className="mt-2 text-slate-600">{tires?.length ?? 0} llantas disponibles</p>
          </div>
          {/* Only signed-in users see the upload button (RLS enforces it too) */}
          {user && <Upload />}
        </header>

        {error && (
          <p className="flex items-center gap-2 text-red-700">
            <CircleAlert className="h-5 w-5" /> No se pudo cargar el portafolio: {error.message}
          </p>
        )}

        {!error && tires?.length === 0 && (
          <div className="flex flex-col items-center gap-3 border border-dashed border-slate-400 py-20 text-slate-600">
            <PackageOpen className="h-10 w-10" />
            <p>Aún no hay llantas. {user ? 'Usa “Agregar llanta” para subir la primera.' : ''}</p>
          </div>
        )}

        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tires?.map((tire) => <TireCard key={tire.id} tire={tire} />)}
        </section>
      </div>
    </main>
  );
}