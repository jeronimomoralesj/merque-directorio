'use client';

import { PartyPopper, X } from 'lucide-react';

export default function VictoryModal({ prizeName, contactName, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/80 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="victory-title"
    >
      <div className="relative w-full max-w-sm animate-pop-in rounded-3xl border-4 border-brand-500 bg-white p-8 text-center shadow-2xl">
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-4 top-4 text-ink-400 transition-colors hover:text-ink-900"
        >
          <X size={20} />
        </button>

        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-500">
          <PartyPopper size={30} className="text-ink-900" />
        </div>

        <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-brand-600">
          ¡Felicitaciones!
        </p>

        {contactName && (
          <p className="mt-2 text-sm text-ink-500">
            Premio para <span className="font-semibold text-ink-900">{contactName}</span>
          </p>
        )}

        <h2 id="victory-title" className="mt-3 font-display text-2xl text-ink-900">
          Ganó
        </h2>
        <p className="mt-1 font-display text-xl text-brand-600">{prizeName}</p>

        <button
          onClick={onClose}
          className="mt-7 w-full rounded-xl bg-ink-900 py-3 text-sm font-bold text-white transition-transform active:scale-[0.98]"
        >
          Mostrar al personal del stand
        </button>
      </div>
    </div>
  );
}
