'use client';

import { useEffect, useState } from 'react';
import { Radio, Gift } from 'lucide-react';
import { createClient } from '@/lib/supabaseClient';

export default function SpinLogFeed({ initialLogs }) {
  const [logs, setLogs] = useState(initialLogs);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('spin_logs_feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'spin_logs' },
        (payload) => {
          setLogs((prev) => [payload.new, ...prev].slice(0, 50));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-ink-700">
        <Radio size={16} className="text-brand-500" />
        Live Spin Feed
      </div>

      {logs.length === 0 ? (
        <p className="mt-4 text-sm text-ink-400">No spins recorded yet.</p>
      ) : (
        <ul className="mt-4 max-h-80 space-y-2 overflow-y-auto pr-1">
          {logs.map((log) => (
            <li
              key={log.id}
              className="flex items-center gap-3 rounded-xl border border-ink-100 bg-ink-50 px-3 py-2.5"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-500 text-ink-900">
                <Gift size={15} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink-900">{log.prize_won}</p>
                <p className="truncate text-xs text-ink-500">
                  {log.salesman_email} · Day {log.day_number}
                </p>
              </div>
              <span className="shrink-0 text-xs text-ink-400">
                {new Date(log.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
