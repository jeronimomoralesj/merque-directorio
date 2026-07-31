import { notFound } from 'next/navigation';
import { Mail, Phone, MapPin, BadgeCheck } from 'lucide-react';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import WhatsAppButton from '@/components/WhatsAppButton';

export const revalidate = 0;

export default async function SalesmanProfilePage({ params }) {
  const supabase = createServerSupabaseClient();

  const { data: salesman } = await supabase
    .from('salesmen')
    .select('id, name, email, phone, location, whatsapp_link')
    .eq('id', params.id)
    .single();

  if (!salesman) {
    notFound();
  }

  // CRITICAL LOGIC: every load of this page counts as a profile view.
  // Fire-and-forget via RPC so a slow counter never delays the page.
  supabase.rpc('increment_profile_views', { salesman_id: salesman.id }).then(
    () => {},
    () => {}
  );

  const initials = salesman.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-ink-50">
        {/* Hero band: dot-grid texture + soft brand glow, card floats on top */}
        <div className="relative overflow-hidden bg-ink-900 pb-24 pt-14 sm:pb-32 sm:pt-20">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                'radial-gradient(circle, #fff 1px, transparent 1px)',
              backgroundSize: '22px 22px',
            }}
          />
          <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-brand-500/30 blur-[90px]" />

          <div className="relative mx-auto max-w-2xl px-4 text-center sm:px-6">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-ink-400">
              Perfil de contacto
            </p>
          </div>
        </div>

        <div className="mx-auto -mt-20 max-w-2xl px-4 pb-16 sm:-mt-28 sm:px-6 sm:pb-24">
          {/* Signature element: metallic-edged ID card */}
          <div className="rounded-[2rem] bg-gradient-to-br from-brand-500 via-brand-400/60 to-ink-200 p-[1.5px] shadow-2xl shadow-ink-900/20">
            <div className="overflow-hidden rounded-[calc(2rem-1.5px)] bg-white">
              <div className="flex flex-col items-center px-6 pb-8 pt-10 text-center sm:px-10">
                <div className="relative">
                  <div className="absolute -inset-2 rounded-[1.4rem] bg-brand-500/60 opacity-70 blur-md" />
                  <div className="relative flex h-24 w-24 items-center justify-center rounded-[1.4rem] bg-ink-900 font-display text-3xl text-white ring-4 ring-white">
                    {initials}
                  </div>
                  <span className="absolute -bottom-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-md ring-2 ring-white">
                    <BadgeCheck size={18} className="text-brand-500" strokeWidth={2.5} />
                  </span>
                </div>

                <h1 className="mt-5 font-display text-2xl text-ink-900 sm:text-3xl">
                  {salesman.name}
                </h1>
                <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-ink-50 px-3 py-1 text-sm text-ink-500">
                  <MapPin size={14} className="text-brand-500" />
                  {salesman.location}
                </p>
              </div>

              <div className="h-px bg-gradient-to-r from-transparent via-ink-100 to-transparent" />

              <div className="grid gap-3 px-6 py-8 sm:grid-cols-2 sm:px-10">
                <a
                  href={`mailto:${salesman.email}`}
                  className="group flex items-center gap-3 rounded-xl border border-ink-100 bg-ink-50 px-4 py-3 transition-all hover:-translate-y-0.5 hover:border-brand-500/40 hover:bg-white hover:shadow-md"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-brand-500 shadow-sm transition-colors group-hover:bg-brand-500 group-hover:text-white">
                    <Mail size={16} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-wide text-ink-400">Correo</p>
                    <p className="truncate text-sm font-medium text-ink-900">{salesman.email}</p>
                  </div>
                </a>

                <a
                  href={`tel:${salesman.phone}`}
                  className="group flex items-center gap-3 rounded-xl border border-ink-100 bg-ink-50 px-4 py-3 transition-all hover:-translate-y-0.5 hover:border-brand-500/40 hover:bg-white hover:shadow-md"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-brand-500 shadow-sm transition-colors group-hover:bg-brand-500 group-hover:text-white">
                    <Phone size={16} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-wide text-ink-400">Teléfono</p>
                    <p className="truncate text-sm font-medium text-ink-900">{salesman.phone}</p>
                  </div>
                </a>
              </div>

              <div className="border-t border-ink-100 bg-ink-50/60 px-6 py-6 sm:px-10">
                <WhatsAppButton
                  salesmanId={salesman.id}
                  whatsappLink={salesman.whatsapp_link}
                />
                <p className="mt-3 text-center text-xs text-ink-400 sm:text-left">
                  Respuesta habitual en minutos por WhatsApp
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}