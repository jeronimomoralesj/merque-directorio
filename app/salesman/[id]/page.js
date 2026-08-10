import { notFound } from 'next/navigation';
import { Mail, Phone, MapPin, BadgeCheck } from 'lucide-react';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import WhatsAppButton from '@/components/WhatsAppButton';

export const revalidate = 0;

export default async function SalesmanProfilePage({ params }) {
  const { id } = await params;

  const supabase = createServerSupabaseClient();

  const { data: salesman } = await supabase
    .from('salesmen')
    .select('id, name, email, phone, location, whatsapp_link, photo_base64')
    .eq('id', id)
    .single();

  if (!salesman) notFound();

  supabase.rpc('increment_profile_views', { salesman_id: salesman.id }).then(() => {}, () => {});

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

        {/* ── Hero ── */}
        <div className="relative overflow-hidden bg-ink-900 pb-36 pt-12 sm:pb-44 sm:pt-16">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
              backgroundSize: '22px 22px',
            }}
          />
          <div className="pointer-events-none absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-brand-500/20 blur-[120px]" />

          <div className="relative mx-auto flex max-w-lg flex-col items-center px-4 text-center sm:px-6">
            <p className="mb-8 text-xs font-semibold uppercase tracking-[0.22em] text-ink-400">
              Asesor Comercial · Merquellantas
            </p>

            {/* Avatar */}
            <div className="relative mb-6">
              <div className="absolute -inset-5 rounded-full bg-brand-500/25 blur-2xl" />
              {salesman.photo_base64 ? (
                <img
                  src={salesman.photo_base64}
                  alt={salesman.name}
                  className="relative h-44 w-44 rounded-full object-cover shadow-2xl ring-4 ring-white/20 sm:h-52 sm:w-52"
                />
              ) : (
                <div className="relative flex h-44 w-44 items-center justify-center rounded-full bg-ink-800 font-display text-5xl text-white shadow-2xl ring-4 ring-white/20 sm:h-52 sm:w-52">
                  {initials}
                </div>
              )}
              <span className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-lg ring-2 ring-white/40 sm:bottom-3 sm:right-3">
                <BadgeCheck size={20} className="text-brand-500" strokeWidth={2.5} />
              </span>
            </div>

            <h1 className="font-display text-3xl text-white sm:text-4xl">{salesman.name}</h1>
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-sm text-ink-300">
              <MapPin size={13} className="text-brand-400" />
              {salesman.location}
            </div>
          </div>
        </div>

        {/* ── Contact card ── */}
        <div className="mx-auto -mt-24 max-w-lg px-4 pb-16 sm:-mt-28 sm:px-6 sm:pb-24">
          <div className="overflow-hidden rounded-3xl bg-white shadow-2xl shadow-ink-900/10 ring-1 ring-ink-900/5">

            {/* Email + Phone */}
            <div className="grid grid-cols-2 divide-x divide-ink-100 border-b border-ink-100">
              <a
                href={`mailto:${salesman.email}`}
                className="group flex flex-col items-center gap-2.5 px-4 py-7 transition-colors hover:bg-ink-50"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-500 transition-colors group-hover:bg-brand-500 group-hover:text-white">
                  <Mail size={19} />
                </span>
                <div className="text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-400">Correo</p>
                  <p className="mt-1 break-all text-xs font-medium text-ink-700">{salesman.email}</p>
                </div>
              </a>

              <a
                href={`tel:${salesman.phone}`}
                className="group flex flex-col items-center gap-2.5 px-4 py-7 transition-colors hover:bg-ink-50"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-500 transition-colors group-hover:bg-brand-500 group-hover:text-white">
                  <Phone size={19} />
                </span>
                <div className="text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-400">Teléfono</p>
                  <p className="mt-1 text-xs font-medium text-ink-700">{salesman.phone}</p>
                </div>
              </a>
            </div>

            {/* WhatsApp CTA */}
            <div className="px-6 py-6 sm:px-8 sm:py-7">
              <WhatsAppButton salesmanId={salesman.id} phone={salesman.phone} />
            </div>
          </div>
        </div>

      </main>
      <Footer />
    </>
  );
}
