'use client';

import { Eye, MessageCircle, TrendingUp } from 'lucide-react';

function Leaderboard({ title, icon, rows, valueKey, accent }) {
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
                <span className="truncate text-sm text-ink-800">{row.name}</span>
              </div>
              <span className={`shrink-0 text-sm font-bold ${accent}`}>{row[valueKey]}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export default function AnalyticsPanel({ salesmen }) {
  const topViews = [...salesmen]
    .sort((a, b) => b.profile_views - a.profile_views)
    .slice(0, 5);
  const topClicks = [...salesmen]
    .sort((a, b) => b.whatsapp_clicks - a.whatsapp_clicks)
    .slice(0, 5);

  const totalViews = salesmen.reduce((sum, s) => sum + (s.profile_views || 0), 0);
  const totalClicks = salesmen.reduce((sum, s) => sum + (s.whatsapp_clicks || 0), 0);

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={<Eye size={18} />} label="Total Profile Views" value={totalViews} />
        <StatCard icon={<MessageCircle size={18} />} label="Total WhatsApp Clicks" value={totalClicks} />
        <StatCard icon={<TrendingUp size={18} />} label="Registered Salesmen" value={salesmen.length} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
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
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-5">
      <div className="flex items-center gap-2 text-ink-500">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-2 font-display text-3xl text-ink-900">{value}</p>
    </div>
  );
}
