'use client';

import { useMemo, useState } from 'react';
import { Trophy, X, Filter, Gift, Users, RotateCcw, CalendarDays } from 'lucide-react';

const LOSE_SENTINEL = '__SIN_PREMIO__';

function buildSalesmanMap(salesmen) {
  const map = {};
  (salesmen || []).forEach((s) => { map[s.email] = s.name; });
  return map;
}

function StatCard({ icon, label, value, accent }) {
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-5">
      <div className="flex items-center gap-2 text-ink-500">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className={`mt-2 font-display text-3xl ${accent ?? 'text-ink-900'}`}>{value}</p>
    </div>
  );
}

export default function RoulettePanel({ spinLogs, salesmen }) {
  const salesmanMap = useMemo(() => buildSalesmanMap(salesmen), [salesmen]);

  const [filterDay, setFilterDay] = useState('all');
  const [filterSalesman, setFilterSalesman] = useState('all');
  const [filterResult, setFilterResult] = useState('all');

  const uniqueSalesmen = useMemo(() => {
    const emails = [...new Set((spinLogs || []).map((l) => l.salesman_email))].sort();
    return emails;
  }, [spinLogs]);

  const filtered = useMemo(() => {
    return (spinLogs || []).filter((log) => {
      if (filterDay !== 'all' && String(log.day_number) !== filterDay) return false;
      if (filterSalesman !== 'all' && log.salesman_email !== filterSalesman) return false;
      if (filterResult === 'won' && log.prize_won === LOSE_SENTINEL) return false;
      if (filterResult === 'lost' && log.prize_won !== LOSE_SENTINEL) return false;
      return true;
    });
  }, [spinLogs, filterDay, filterSalesman, filterResult]);

  const totalSpins = (spinLogs || []).length;
  const totalWins = (spinLogs || []).filter((l) => l.prize_won !== LOSE_SENTINEL).length;
  const totalLosses = totalSpins - totalWins;
  const uniqueClients = new Set((spinLogs || []).map((l) => l.contact_id).filter(Boolean)).size;

  function resetFilters() {
    setFilterDay('all');
    setFilterSalesman('all');
    setFilterResult('all');
  }

  const hasFilters = filterDay !== 'all' || filterSalesman !== 'all' || filterResult !== 'all';

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          icon={<RotateCcw size={18} />}
          label="Total Giros"
          value={totalSpins}
        />
        <StatCard
          icon={<Trophy size={18} className="text-brand-500" />}
          label="Premios Ganados"
          value={totalWins}
          accent="text-brand-600"
        />
        <StatCard
          icon={<X size={18} className="text-red-400" />}
          label="Sin Premio"
          value={totalLosses}
          accent="text-red-500"
        />
        <StatCard
          icon={<Users size={18} />}
          label="Clientes Únicos"
          value={uniqueClients}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-ink-200 bg-white px-4 py-3">
        <Filter size={15} className="shrink-0 text-ink-400" />

        <div className="flex items-center gap-2">
          <CalendarDays size={14} className="text-ink-400" />
          <select
            value={filterDay}
            onChange={(e) => setFilterDay(e.target.value)}
            className="rounded-lg border border-ink-200 bg-ink-50 px-2.5 py-1.5 text-sm font-medium text-ink-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">Todos los días</option>
            <option value="1">Día 1</option>
            <option value="2">Día 2</option>
            <option value="3">Día 3</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Users size={14} className="text-ink-400" />
          <select
            value={filterSalesman}
            onChange={(e) => setFilterSalesman(e.target.value)}
            className="rounded-lg border border-ink-200 bg-ink-50 px-2.5 py-1.5 text-sm font-medium text-ink-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">Todos los vendedores</option>
            {uniqueSalesmen.map((email) => (
              <option key={email} value={email}>
                {salesmanMap[email] || email}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Gift size={14} className="text-ink-400" />
          <select
            value={filterResult}
            onChange={(e) => setFilterResult(e.target.value)}
            className="rounded-lg border border-ink-200 bg-ink-50 px-2.5 py-1.5 text-sm font-medium text-ink-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">Todos los resultados</option>
            <option value="won">Ganó premio</option>
            <option value="lost">Sin premio</option>
          </select>
        </div>

        {hasFilters && (
          <button
            onClick={resetFilters}
            className="ml-auto flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-ink-500 hover:text-ink-700"
          >
            <X size={13} />
            Limpiar
          </button>
        )}

        <span className="ml-auto text-xs font-semibold text-ink-400">
          {filtered.length} registro{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-ink-200 bg-white">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-ink-400">
            No hay registros que coincidan con los filtros.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 bg-ink-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">Fecha / Hora</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">Vendedor</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">Cliente</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-ink-500">Día</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">Resultado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {filtered.map((log) => {
                  const won = log.prize_won !== LOSE_SENTINEL;
                  const salesmanName = salesmanMap[log.salesman_email] || log.salesman_email;
                  const ts = new Date(log.timestamp);
                  return (
                    <tr key={log.id} className="hover:bg-ink-50/60 transition-colors">
                      <td className="whitespace-nowrap px-4 py-3 text-ink-500">
                        <span className="block text-xs">
                          {ts.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                        </span>
                        <span className="block font-semibold text-ink-800">
                          {ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-ink-900 truncate max-w-[160px]">{salesmanName}</p>
                        <p className="text-xs text-ink-400 truncate max-w-[160px]">{log.salesman_email}</p>
                      </td>
                      <td className="px-4 py-3">
                        {log.contact_name ? (
                          <p className="font-medium text-ink-800 truncate max-w-[160px]">{log.contact_name}</p>
                        ) : (
                          <p className="text-ink-400 italic">—</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-ink-100 text-xs font-bold text-ink-600">
                          {log.day_number}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {won ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/15 px-2.5 py-1 text-xs font-bold text-brand-700">
                            <Trophy size={11} />
                            {log.prize_won}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-500">
                            <X size={11} />
                            Sin Premio
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
