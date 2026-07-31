'use client';

import { useEffect, useState } from 'react';
import { Gift, LogOut, Loader2, AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/supabaseClient';
import { getConventionDay } from '@/lib/conventionDay';
import RouletteWheel from './RouletteWheel';
import VictoryModal from './VictoryModal';

const STOCK_COLUMN = { 1: 'day1_stock', 2: 'day2_stock', 3: 'day3_stock' };

export default function RouletteGame({ userEmail }) {
  const [allPrizes, setAllPrizes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [spinning, setSpinning] = useState(false);
  const [targetIndex, setTargetIndex] = useState(null);
  const [wonPrize, setWonPrize] = useState(null);
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);

  const day = getConventionDay();
  const stockCol = STOCK_COLUMN[day];

  async function loadPrizes() {
    setLoading(true);
    setLoadError('');
    const supabase = createClient();
    const { data, error } = await supabase
      .from('prizes')
      .select('id, prize_name, image_url, day1_stock, day2_stock, day3_stock, probability_weight')
      .order('prize_name');

    if (error) {
      setLoadError('Could not load today\u2019s prizes. Please refresh.');
    } else {
      setAllPrizes(data || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadPrizes();
  }, []);

  const availablePrizes = allPrizes.filter((p) => (p[stockCol] ?? 0) > 0);
  const totalWeight = availablePrizes.reduce((sum, p) => sum + (p.probability_weight || 1), 0);

  function pickWeightedIndex() {
    let roll = Math.random() * totalWeight;
    for (let i = 0; i < availablePrizes.length; i++) {
      roll -= availablePrizes[i].probability_weight || 1;
      if (roll <= 0) return i;
    }
    return availablePrizes.length - 1;
  }

  async function handleSpin() {
    if (spinning || busy || availablePrizes.length === 0) return;
    setActionError('');
    const index = pickWeightedIndex();
    setTargetIndex(index);
    setSpinning(true);
  }

  async function handleSpinComplete() {
    setSpinning(false);
    setBusy(true);
    const prize = availablePrizes[targetIndex];

    try {
      const supabase = createClient();
      const { error } = await supabase.rpc('spin_and_award', {
        p_prize_id: prize.id,
        p_day_number: day,
        p_salesman_email: userEmail,
      });

      if (error) {
        // Most likely someone else just took the last unit — refresh and
        // let the salesman try again rather than falsely claiming a win.
        setActionError(
          'That prize just ran out. Refreshing available prizes \u2014 please spin again.'
        );
        await loadPrizes();
      } else {
        setWonPrize(prize.prize_name);
        await loadPrizes();
      }
    } catch (_err) {
      setActionError('Something went wrong recording your spin. Please try again.');
    } finally {
      setBusy(false);
      setTargetIndex(null);
    }
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-ink-400">
        <Loader2 size={28} className="animate-spin text-brand-500" />
        Loading today&apos;s prize wheel…
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center text-sm text-red-400">
        {loadError}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg text-center">
      <div className="mb-6 flex items-center justify-between">
        <span className="rounded-full border border-brand-500/40 bg-brand-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-brand-500">
          Convention Day {day}
        </span>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-sm text-ink-400 transition-colors hover:text-brand-500"
        >
          <LogOut size={15} />
          Log out
        </button>
      </div>

      {availablePrizes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-700 bg-ink-800 p-10">
          <Gift size={32} className="mx-auto text-ink-500" />
          <p className="mt-4 font-display text-lg text-white">All prizes claimed for today</p>
          <p className="mt-2 text-sm text-ink-400">
            Check back tomorrow, or ask an admin to restock inventory.
          </p>
        </div>
      ) : (
        <>
          <RouletteWheel
            prizes={availablePrizes}
            spinning={spinning}
            targetIndex={targetIndex}
            onSpinComplete={handleSpinComplete}
          />

          {actionError && (
            <p className="mx-auto mt-5 flex max-w-sm items-center justify-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-400">
              <AlertTriangle size={16} className="shrink-0" />
              {actionError}
            </p>
          )}

          <button
            onClick={handleSpin}
            disabled={spinning || busy}
            className="mt-8 w-full rounded-2xl bg-brand-500 py-4 text-lg font-display text-ink-900 shadow-brand transition-transform active:scale-[0.98] disabled:opacity-60 sm:w-auto sm:px-16"
          >
            {spinning ? 'Spinning…' : busy ? 'Recording win…' : 'Spin the Wheel'}
          </button>
        </>
      )}

      {wonPrize && (
        <VictoryModal prizeName={wonPrize} onClose={() => setWonPrize(null)} />
      )}
    </div>
  );
}
