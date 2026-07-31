'use client';

import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { createClient } from '@/lib/supabaseClient';

export default function WhatsAppButton({ salesmanId, whatsappLink }) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const supabase = createClient();
      // Fire the counter increment, but don't let a slow/failed network call
      // block the visitor from reaching WhatsApp.
      await supabase.rpc('increment_whatsapp_clicks', { salesman_id: salesmanId });
    } catch (_err) {
      // Non-fatal — the chat should still open even if the counter fails.
    } finally {
      window.open(whatsappLink, '_blank', 'noopener,noreferrer');
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 py-4 text-base font-bold text-ink-900 shadow-brand transition-transform active:scale-[0.98] disabled:opacity-70 sm:w-auto sm:px-10"
    >
      <MessageCircle size={20} />
      {loading ? 'Opening WhatsApp…' : 'Chat via WhatsApp'}
    </button>
  );
}
