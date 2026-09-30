'use client';

import { useEffect, useState } from 'react';
import { X, Images, ChevronLeft, ChevronRight } from 'lucide-react';

const money = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

export default function TireCard({ tire }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const images = tire.images ?? [];

  const prev = () => setActive((a) => (a - 1 + images.length) % images.length);
  const next = () => setActive((a) => (a + 1) % images.length);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
      if (e.key === 'ArrowLeft') setActive((a) => (a - 1 + images.length) % images.length);
      if (e.key === 'ArrowRight') setActive((a) => (a + 1) % images.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, images.length]);

  return (
    <>
      <button
        onClick={() => { setActive(0); setOpen(true); }}
        className="group flex flex-col border border-slate-300 bg-slate-50 text-left transition hover:border-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-800"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-300">
          {images[0] && (
            <img src={images[0]} alt={tire.title} loading="lazy" className="h-full w-full object-cover" />
          )}
          {images.length > 1 && (
            <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 bg-slate-900 px-2 py-1 text-xs text-white">
              <Images className="h-3.5 w-3.5" /> {images.length}
            </span>
          )}
        </div>
        <div className="grid gap-1 p-4">
          <h3 className="font-semibold leading-snug">{tire.title}</h3>
          <p className="text-lg font-extrabold text-sky-800">{money.format(tire.price)}</p>
        </div>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={tire.title}
            onClick={(e) => e.stopPropagation()}
            className="grid max-h-[95vh] w-full max-w-4xl overflow-y-auto bg-slate-50 text-slate-900 md:grid-cols-[1.4fr_1fr]"
          >
            <div className="flex flex-col bg-black">
              <div className="relative">
                <img src={images[active]} alt={`${tire.title} — imagen ${active + 1}`} className="aspect-[4/3] w-full object-contain" />
                {images.length > 1 && (
                  <>
                    <button onClick={prev} aria-label="Imagen anterior" className="absolute left-2 top-1/2 -translate-y-1/2 bg-slate-900/70 p-2 text-white hover:bg-slate-900">
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button onClick={next} aria-label="Imagen siguiente" className="absolute right-2 top-1/2 -translate-y-1/2 bg-slate-900/70 p-2 text-white hover:bg-slate-900">
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 bg-neutral-900 p-2">
                  {images.map((src, i) => (
                    <button
                      key={src}
                      onClick={() => setActive(i)}
                      aria-label={`Ver imagen ${i + 1}`}
                      className={`h-14 w-14 ${i === active ? 'opacity-100 outline outline-2 outline-white' : 'opacity-50 hover:opacity-80'}`}
                    >
                      <img src={src} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative p-6">
              <button onClick={() => setOpen(false)} aria-label="Cerrar" className="absolute right-3 top-3 text-slate-500 hover:text-slate-900">
                <X className="h-6 w-6" />
              </button>
              <h2 className="pr-8 text-xl font-bold">{tire.title}</h2>
              <p className="my-3 text-2xl font-extrabold text-sky-800">{money.format(tire.price)}</p>
              {tire.description && <p className="whitespace-pre-wrap leading-relaxed">{tire.description}</p>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}