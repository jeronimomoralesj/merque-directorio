'use client';

import { useMemo, useState } from 'react';
import { Search, Users, MapPin } from 'lucide-react';
import SalesmanCard from './SalesmanCard';

export default function DirectoryGrid({ salesmen }) {
  const [query, setQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');

  const locations = useMemo(() => {
    const set = new Set(salesmen.map((s) => s.location).filter(Boolean));
    return ['all', ...Array.from(set).sort()];
  }, [salesmen]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return salesmen.filter((s) => {
      const matchesQuery =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.location.toLowerCase().includes(q);
      const matchesLocation =
        locationFilter === 'all' || s.location === locationFilter;
      return matchesQuery && matchesLocation;
    });
  }, [salesmen, query, locationFilter]);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Busca por nombre o ciudad…"
            className="w-full rounded-xl border border-ink-200 bg-white py-3 pl-11 pr-4 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-500"
          />
        </div>

        <div className="relative sm:w-56">
          <MapPin
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400"
          />
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="w-full appearance-none rounded-xl border border-ink-200 bg-white py-3 pl-11 pr-4 text-sm text-ink-900 focus:border-brand-500"
          >
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc === 'all' ? 'Todas las ciudades' : loc}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-sm text-ink-500">
        <Users size={16} className="text-brand-500" />
        {filtered.length} {filtered.length === 1 ? 'representante' : 'representantes'} encontrados
      </div>

      {filtered.length === 0 ? (
        <div className="mt-16 flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-200 bg-white py-16 text-center">
          <p className="font-display text-lg text-ink-700">No hay resultados</p>
          <p className="mt-2 max-w-sm text-sm text-ink-500">
            Intenta otro nombre
          </p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <SalesmanCard key={s.id} salesman={s} />
          ))}
        </div>
      )}
    </div>
  );
}
