'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Package, UserPlus, LogOut, ClipboardList, Disc3 } from 'lucide-react';
import { createClient } from '@/lib/supabaseClient';
import AnalyticsPanel from './AnalyticsPanel';
import SpinLogFeed from './SpinLogFeed';
import InventoryManager from './InventoryManager';
import SalesmanManager from './SalesmanManager';
import SalesmanList from './SalesmanList';
import RoulettePanel from './RoulettePanel';

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'salesmen', label: 'Salesmen', icon: UserPlus },
  { id: 'list', label: 'Lista', icon: UserPlus },
  { id: 'roulette', label: 'Ruleta', icon: Disc3 },
];

export default function AdminDashboard({ salesmen, prizes, spinLogs, contacts }) {
  const [tab, setTab] = useState('overview');
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5 rounded-xl border border-ink-200 bg-white p-1.5">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${
                tab === id
                  ? 'bg-brand-500 text-ink-900'
                  : 'text-ink-500 hover:bg-ink-50'
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/crm"
            className="flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-3.5 py-2 text-sm font-semibold text-ink-600 hover:border-brand-500 hover:text-brand-600"
          >
            <ClipboardList size={15} />
            CRM
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-3.5 py-2 text-sm font-semibold text-ink-600 hover:border-brand-500 hover:text-brand-600"
          >
            <LogOut size={15} />
            Log out
          </button>
        </div>
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <AnalyticsPanel salesmen={salesmen} contacts={contacts} />
          </div>
          <SpinLogFeed initialLogs={spinLogs} />
        </div>
      )}

      {tab === 'inventory' && <InventoryManager initialPrizes={prizes} />}
      {tab === 'list' && <SalesmanList initialSalesmen={salesmen} />}
      {tab === 'roulette' && <RoulettePanel spinLogs={spinLogs} salesmen={salesmen} />}

      {tab === 'salesmen' && (
        <SalesmanManager onCreated={() => router.refresh()} />
      )}
    </div>
  );
}