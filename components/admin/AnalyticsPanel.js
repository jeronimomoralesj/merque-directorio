'use client';

import { Eye, MessageCircle, TrendingUp, Users, UserPlus, BadgeCheck, CalendarDays } from 'lucide-react';

function StatCard({ icon, label, value, sub }) {
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-5">
      <div className="flex items-center gap-2 text-ink-500">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-2 font-display text-3xl text-ink-900">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-ink-400">{sub}</p>}
    </div>
  );
}

function Leaderboard({ title, icon, rows, valueKey, accent, sub }) {
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-ink-700">
        {icon}
        {title}
      </div>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-ink-400">No data yet.</p>
      ) : (
        <ol className="mt-4 space-y-2.5">
          {rows.map((row, i) => (
            <li key={row.id} className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    i === 0 ? 'bg-brand-500 text-ink-900' : 'bg-ink-100 text-ink-500'
                  }`}
                >
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm text-ink-800">{row.name}</p>
                  {sub && <p className="text-xs text-ink-400">{sub(row)}</p>}
                </div>
              </div>
              <span className={`shrink-0 text-sm font-bold ${accent}`}>{row[valueKey]}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export default function AnalyticsPanel({ salesmen, contacts = [] }) {
  // ── Profile / WhatsApp analytics ────────────────────────────────────────
  const topViews = [...salesmen].sort((a, b) => b.profile_views - a.profile_views).slice(0, 5);
  const topClicks = [...salesmen].sort((a, b) => b.whatsapp_clicks - a.whatsapp_clicks).slice(0, 5);
  const totalViews = salesmen.reduce((sum, s) => sum + (s.profile_views || 0), 0);
  const totalClicks = salesmen.reduce((sum, s) => sum + (s.whatsapp_clicks || 0), 0);

  // ── CRM contact analytics ────────────────────────────────────────────────
  const todayStr = new Date().toISOString().split('T')[0];
  const totalContacts = contacts.length;
  const totalLeads = contacts.filter(c => c.tipo === 'lead').length;
  const totalClientes = contacts.filter(c => c.tipo === 'cliente_existente').length;
  const todayContacts = contacts.filter(c => c.fecha === todayStr).length;

  // Aggregate per salesman
  const contactsBySalesman = contacts.reduce((acc, c) => {
    const key = c.salesman_email;
    if (!acc[key]) acc[key] = { email: key, name: c.salesman_name || key, total: 0, leads: 0, clientes: 0 };
    acc[key].total += 1;
    if (c.tipo === 'lead') acc[key].leads += 1;
    if (c.tipo === 'cliente_existente') acc[key].clientes += 1;
    return acc;
  }, {});

  // Merge with salesmen list so everyone appears even with 0 contacts
  const salesmenWithContacts = salesmen
    .filter(s => s.role !== 'admin')
    .map(s => ({
      id: s.id,
      name: s.name,
      email: s.email,
      total: contactsBySalesman[s.email]?.total || 0,
      leads: contactsBySalesman[s.email]?.leads || 0,
      clientes: contactsBySalesman[s.email]?.clientes || 0,
      profile_views: s.profile_views || 0,
      whatsapp_clicks: s.whatsapp_clicks || 0,
    }))
    .sort((a, b) => b.total - a.total);

  const topContacts = salesmenWithContacts.slice(0, 5);

  return (
    <div className="space-y-6">

      {/* ── CRM section ─────────────────────────────────────────────────── */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-ink-400">CRM — Contactos registrados</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard icon={<Users size={16} />} label="Total" value={totalContacts} />
          <StatCard icon={<CalendarDays size={16} />} label="Hoy" value={todayContacts} />
          <StatCard icon={<UserPlus size={16} />} label="Leads" value={totalLeads} />
          <StatCard icon={<BadgeCheck size={16} />} label="Clientes" value={totalClientes} />
        </div>
      </div>

      {/* ── Contacts leaderboard ─────────────────────────────────────────── */}
      <Leaderboard
        title="Más contactos registrados"
        icon={<Users size={16} className="text-brand-500" />}
        rows={topContacts}
        valueKey="total"
        accent="text-brand-600"
        sub={row => `${row.leads} leads · ${row.clientes} clientes`}
      />

      {/* ── Full per-salesman table ──────────────────────────────────────── */}
      <div className="rounded-2xl border border-ink-200 bg-white p-5">
        <p className="mb-4 text-sm font-semibold text-ink-700">Detalle por asesor</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100">
                <th className="pb-2 text-left text-xs font-semibold uppercase tracking-wide text-ink-400">Asesor</th>
                <th className="pb-2 pr-4 text-right text-xs font-semibold uppercase tracking-wide text-ink-400">Total</th>
                <th className="pb-2 pr-4 text-right text-xs font-semibold uppercase tracking-wide text-ink-400">Leads</th>
                <th className="pb-2 pr-4 text-right text-xs font-semibold uppercase tracking-wide text-ink-400">Clientes</th>
                <th className="pb-2 pr-4 text-right text-xs font-semibold uppercase tracking-wide text-ink-400">Vistas</th>
                <th className="pb-2 text-right text-xs font-semibold uppercase tracking-wide text-ink-400">WhatsApp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {salesmenWithContacts.map(s => (
                <tr key={s.id} className="hover:bg-ink-50/50">
                  <td className="py-2.5 pr-4 font-medium text-ink-800">{s.name}</td>
                  <td className="py-2.5 pr-4 text-right font-bold text-ink-900">{s.total}</td>
                  <td className="py-2.5 pr-4 text-right text-blue-600">{s.leads}</td>
                  <td className="py-2.5 pr-4 text-right text-green-600">{s.clientes}</td>
                  <td className="py-2.5 pr-4 text-right text-ink-500">{s.profile_views}</td>
                  <td className="py-2.5 text-right text-ink-500">{s.whatsapp_clicks}</td>
                </tr>
              ))}
              {salesmenWithContacts.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-sm text-ink-400">Sin asesores registrados</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Profile / WhatsApp section ───────────────────────────────────── */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-ink-400">Perfiles — Actividad digital</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard icon={<Eye size={16} />} label="Total Profile Views" value={totalViews} />
          <StatCard icon={<MessageCircle size={16} />} label="Total WhatsApp Clicks" value={totalClicks} />
          <StatCard icon={<TrendingUp size={16} />} label="Registered Salesmen" value={salesmen.filter(s => s.role !== 'admin').length} />
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Leaderboard
            title="Most Profile Views"
            icon={<Eye size={16} className="text-brand-500" />}
            rows={topViews}
            valueKey="profile_views"
            accent="text-brand-600"
          />
          <Leaderboard
            title="Most WhatsApp Clicks"
            icon={<MessageCircle size={16} className="text-brand-500" />}
            rows={topClicks}
            valueKey="whatsapp_clicks"
            accent="text-brand-600"
          />
        </div>
      </div>

    </div>
  );
}
