'use client';

import { useMemo, useState } from 'react';
import { Search, X, PackageOpen } from 'lucide-react';
import Upload from './upload';
import TireCard from './tire-card';

const SORTS = {
  recent: { label: 'Más recientes', fn: (a, b) => new Date(b.created_at) - new Date(a.created_at) },
  low: { label: 'Precio: menor a mayor', fn: (a, b) => a.price - b.price },
  high: { label: 'Precio: mayor a menor', fn: (a, b) => b.price - a.price },
};

export default function Gallery({ tires, canUpload }) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('recent');

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tires
      .filter((t) => !q || t.title.toLowerCase().includes(q) || (t.description ?? '').toLowerCase().includes(q))
      .sort(SORTS[sort].fn);
  }, [tires, query, sort]);

  return (
    <>
      {/* Toolbar */}
      <div className="mb-6 flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center">
        <label className="relative flex-1">
          <span className="sr-only">Buscar llantas</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre o medida…"
            className="w-full rounded-2xl bg-slate-100 py-3 pl-12 pr-4 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F59E33]"
          />
        </label>

        <label className="sm:w-56">
          <span className="sr-only">Ordenar</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="w-full rounded-2xl bg-slate-100 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#F59E33]"
          >
            {Object.entries(SORTS).map(([key, s]) => (
              <option key={key} value={key}>{s.label}</option>
            ))}
          </select>
        </label>

        {canUpload && <Upload />}
      </div>

      <p className="mb-4 text-sm text-slate-500">
        {visible.length} {visible.length === 1 ? 'llanta' : 'llantas'}
      </p>

      {visible.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-slate-300 bg-white py-20 text-center text-slate-500">
          <PackageOpen className="h-10 w-10" />
          {tires.length === 0 ? (
            <p>Aún no hay llantas en el portafolio.{canUpload && ' Usa “Agregar llanta” para subir la primera.'}</p>
          ) : (
            <>
              <p>No encontramos resultados para “{query}”.</p>
              <button onClick={() => setQuery('')} className="inline-flex items-center gap-1 font-semibold text-[#C26A00] hover:underline">
                <X className="h-4 w-4" /> Limpiar búsqueda
              </button>
            </>
          )}
        </div>
      ) : (
        <section className="grid gap-5">
          {visible.map((tire) => <TireCard key={tire.id} tire={tire} canEdit={canUpload} />)}
        </section>
      )}
    </>
  );
}