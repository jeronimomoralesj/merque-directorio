'use client';

import { useEffect, useState } from 'react';
import { X, Images, ChevronLeft, ChevronRight, Eye } from 'lucide-react';

const money = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

export default function TireCard({ tire }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const images = tire.images ?? [];

  const prev = () => setActive((a) => (a - 1 + images.length) % images.length);
  const next = () => setActive((a) => (a + 1) % images.length);
  const show = () => { setActive(0); setOpen(true); };

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
      if (e.key === 'ArrowLeft') setActive((a) => (a - 1 + images.length) % images.length);
      if (e.key === 'ArrowRight') setActive((a) => (a + 1) % images.length);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, images.length]);

  return (
    <>
      <article className="flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md md:flex-row">
        {/* Cover */}
        <button
          onClick={show}
          aria-label={`Ver ${tire.title}`}
          className="relative aspect-square w-full shrink-0 bg-white p-3 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#F59E33] md:w-64 lg:w-72"
        >
          {images[0] && (
            <img src={images[0]} alt={tire.title} loading="lazy" className="h-full w-full rounded-2xl object-contain" />
          )}
          {tire.isNew && (
            <span className="absolute left-5 top-5 rounded-full bg-rose-500 px-3 py-1 text-xs font-bold text-white">Nuevo</span>
          )}
          {images.length > 1 && (
            <span className="absolute bottom-5 right-5 inline-flex items-center gap-1 rounded-full bg-slate-900/80 px-2.5 py-1 text-xs font-medium text-white">
              <Images className="h-3.5 w-3.5" /> {images.length}
            </span>
          )}
        </button>

        {/* Info */}
        <div className="flex flex-1 flex-col justify-between gap-5 p-5 sm:p-6 lg:flex-row lg:items-end">
          <div className="min-w-0">
            <p className="mb-1 text-xs font-semibold tracking-wide text-[#C26A00]">Llantas</p>
            <h2 className="text-xl font-bold italic leading-tight sm:text-2xl">{tire.title}</h2>
            {tire.description && (
              <p className="mt-2 line-clamp-2 max-w-prose text-slate-500">{tire.description}</p>
            )}
            <p className="mt-4 text-3xl font-bold sm:text-4xl">{money.format(tire.price)}</p>
          </div>

          <button
            onClick={show}
            className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#F59E33] px-6 py-3.5 font-semibold text-slate-900 shadow-md shadow-[#F59E33]/30 transition hover:bg-[#E68E1F] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 lg:w-auto"
          >
            <Eye className="h-5 w-5" /> Ver detalles
          </button>
        </div>
      </article>

      {/* Detail viewer */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 sm:items-center sm:p-4" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={tire.title}
            onClick={(e) => e.stopPropagation()}
            className="grid max-h-[95vh] w-full max-w-4xl overflow-y-auto rounded-t-3xl bg-white sm:rounded-3xl md:grid-cols-[1.3fr_1fr]"
          >
            <div className="flex flex-col bg-slate-50 p-3">
              <div className="relative">
                <img src={images[active]} alt={`${tire.title} — imagen ${active + 1}`} className="aspect-square w-full rounded-2xl bg-white object-contain" />
                {images.length > 1 && (
                  <>
                    <button onClick={prev} aria-label="Imagen anterior" className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow hover:bg-white">
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button onClick={next} aria-label="Imagen siguiente" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow hover:bg-white">
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>
              {images.length > 1 && (
                <div className="mt-3 flex gap-2 overflow-x-auto">
                  {images.map((src, i) => (
                    <button
                      key={src}
                      onClick={() => setActive(i)}
                      aria-label={`Ver imagen ${i + 1}`}
                      className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 bg-white ${i === active ? 'border-[#F59E33]' : 'border-transparent opacity-60 hover:opacity-100'}`}
                    >
                      <img src={src} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative p-6">
              <button onClick={() => setOpen(false)} aria-label="Cerrar" className="absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-900">
                <X className="h-6 w-6" />
              </button>
              <p className="mb-1 text-xs font-semibold tracking-wide text-[#C26A00]">Llantas</p>
              <h2 className="pr-10 text-2xl font-bold italic leading-tight">{tire.title}</h2>
              <p className="my-4 text-3xl font-bold">{money.format(tire.price)}</p>
              {tire.description && <p className="whitespace-pre-wrap leading-relaxed text-slate-600">{tire.description}</p>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}