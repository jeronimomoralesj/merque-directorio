import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Mail, Phone, MapPin } from 'lucide-react';
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
        <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-16">
          <div className="mt-6 overflow-hidden rounded-3xl border border-ink-200 bg-white">
            <div className="bg-ink-900 px-6 py-10 text-center sm:px-10">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-500 font-display text-2xl text-ink-900">
                {initials}
              </div>
              <h1 className="mt-5 font-display text-2xl text-white sm:text-3xl">
                {salesman.name}
              </h1>
              <p className="mt-2 flex items-center justify-center gap-1.5 text-sm text-ink-300">
                <MapPin size={14} className="text-brand-500" />
                {salesman.location}
              </p>
            </div>

            <div className="space-y-4 px-6 py-8 sm:px-10">
              <div className="flex items-center gap-3 rounded-xl border border-ink-100 bg-ink-50 px-4 py-3">
                <Mail size={18} className="shrink-0 text-brand-500" />
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wide text-ink-400">Email</p>
                  <p className="truncate text-sm font-medium text-ink-900">{salesman.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-ink-100 bg-ink-50 px-4 py-3">
                <Phone size={18} className="shrink-0 text-brand-500" />
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wide text-ink-400">Phone</p>
                  <p className="truncate text-sm font-medium text-ink-900">{salesman.phone}</p>
                </div>
              </div>

              <div className="pt-4 text-center sm:text-left">
                <WhatsAppButton
                  salesmanId={salesman.id}
                  whatsappLink={salesman.whatsapp_link}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
