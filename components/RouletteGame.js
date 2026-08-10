'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Gift, Loader2, AlertTriangle, BadgeCheck,
  UserPlus, ChevronLeft, Users, PlusCircle, Ban,
} from 'lucide-react';
import { createClient } from '@/lib/supabaseClient';
import { getConventionDay } from '@/lib/conventionDay';
import RouletteWheel from './RouletteWheel';
import VictoryModal from './VictoryModal';

const STOCK_COLUMN = { 1: 'day1_stock', 2: 'day2_stock', 3: 'day3_stock' };
const LOSE_SENTINEL = '__SIN_PREMIO__';

export default function RouletteGame({ userEmail, selectedContact: initialContact, contacts }) {
  const [selectedContact, setSelectedContact] = useState(initialContact ?? null);
  const [allPrizes, setAllPrizes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [spinning, setSpinning] = useState(false);
  const [targetIndex, setTargetIndex] = useState(null);
  const [wonPrize, setWonPrize] = useState(null);
  const [lostSpin, setLostSpin] = useState(false);
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);
  const [contactSpins, setContactSpins] = useState([]);
  const [contactSpinsLoading, setContactSpinsLoading] = useState(initialContact != null);

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
    if (error) setLoadError('No se pudieron cargar los premios. Recargue la página.');
    else setAllPrizes(data ?? []);
    setLoading(false);
  }

  async function loadContactSpins(contactId) {
    const supabase = createClient();
    const { data } = await supabase
      .from('spin_logs')
      .select('id, prize_won')
      .eq('contact_id', contactId)
      .order('timestamp', { ascending: true });
    setContactSpins(data ?? []);
  }

  useEffect(() => { loadPrizes(); }, []);

  useEffect(() => {
    if (!selectedContact) return;
    loadContactSpins(selectedContact.id).finally(() => setContactSpinsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedContact?.id]);

  // 0 spins → 1 try; 1 loss → 1 bonus try; won or 2 spins used → blocked
  const spinsUsed = contactSpins.length;
  const alreadyWon = contactSpins.some((s) => s.prize_won !== LOSE_SENTINEL);
  const canSpin = spinsUsed === 0 || (spinsUsed === 1 && !alreadyWon);

  function handleSelectContact(c) {
    setContactSpins([]);
    setContactSpinsLoading(true);
    setLostSpin(false);
    setActionError('');
    setSelectedContact(c);
  }

  const availablePrizes = allPrizes.filter((p) => (p[stockCol] ?? 0) > 0);

  // Build wheel slots: one lose slot per prize, interleaved for visual balance.
  // Lose slots share equal total weight with prizes so win rate is always ~50%.
  const totalPrizeWeight = availablePrizes.reduce((sum, p) => sum + (p.probability_weight || 1), 0);
  const loseWeight = availablePrizes.length > 0 ? totalPrizeWeight / availablePrizes.length : 1;
  const wheelSlots = availablePrizes.flatMap((p) => [
    p,
    { id: null, prize_name: '¡Sin Premio!', isLose: true, probability_weight: loseWeight },
  ]);
  const totalWheelWeight = totalPrizeWeight * 2;

  function pickWeightedIndex() {
    let roll = Math.random() * totalWheelWeight;
    for (let i = 0; i < wheelSlots.length; i++) {
      roll -= wheelSlots[i].probability_weight || 1;
      if (roll <= 0) return i;
    }
    return wheelSlots.length - 1;
  }

  async function handleSpin() {
    if (spinning || busy || availablePrizes.length === 0 || !selectedContact || !canSpin) return;
    setActionError('');
    setLostSpin(false);
    setTargetIndex(pickWeightedIndex());
    setSpinning(true);
  }

  async function handleSpinComplete() {
    setSpinning(false);
    setBusy(true);
    const slot = wheelSlots[targetIndex];

    if (slot.isLose) {
      try {
        const supabase = createClient();
        await supabase.from('spin_logs').insert({
          salesman_email: userEmail,
          prize_won: LOSE_SENTINEL,
          day_number: day,
          contact_id: selectedContact.id,
          contact_name: selectedContact.nombre,
        });
        await loadContactSpins(selectedContact.id);
      } catch { /* best-effort */ }
      setLostSpin(true);
      setBusy(false);
      setTargetIndex(null);
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.rpc('spin_and_award', {
        p_prize_id: slot.id,
        p_day_number: day,
        p_salesman_email: userEmail,
        p_contact_id: selectedContact.id,
        p_contact_name: selectedContact.nombre,
      });
      if (error) {
        setActionError('Ese premio se agotó. Recargando premios — intente girar de nuevo.');
        await loadPrizes();
      } else {
        setWonPrize(slot.prize_name);
        await loadPrizes();
        await loadContactSpins(selectedContact.id);
      }
    } catch {
      setActionError('Algo salió mal al registrar el giro. Por favor intente de nuevo.');
    } finally {
      setBusy(false);
      setTargetIndex(null);
    }
  }

  // ── Step 1: pick a contact ────────────────────────────────────────────────
  if (!selectedContact) {
    return <ContactPicker contacts={contacts} onSelect={handleSelectContact} />;
  }

  // ── Step 2: spin ──────────────────────────────────────────────────────────
  if (loading || contactSpinsLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-ink-400">
        <Loader2 size={28} className="animate-spin text-brand-500" />
        Cargando…
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
      {/* Contact + day strip */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <button
          onClick={() => { setSelectedContact(null); setContactSpins([]); setContactSpinsLoading(false); setLostSpin(false); setActionError(''); }}
          className="flex items-center gap-1 text-sm text-ink-400 transition-colors hover:text-brand-500"
        >
          <ChevronLeft size={16} />
          Cambiar
        </button>
        <div className="flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-brand-600">Girando para:</span>
          <span className="text-sm font-bold text-brand-700">{selectedContact.nombre}</span>
        </div>
        <span className="rounded-full border border-ink-700/40 bg-ink-900/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-ink-500">
          Día {day}
        </span>
      </div>

      {availablePrizes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-700 bg-ink-800 p-10">
          <Gift size={32} className="mx-auto text-ink-500" />
          <p className="mt-4 font-display text-lg text-white">Premios agotados por hoy</p>
          <p className="mt-2 text-sm text-ink-400">
            Consulte a un administrador para reabastecer el inventario.
          </p>
        </div>
      ) : !canSpin ? (
        <div className="rounded-2xl border border-ink-200 bg-ink-50 p-8 text-center">
          <Ban size={32} className="mx-auto mb-3 text-ink-400" />
          <p className="font-semibold text-ink-700">
            {alreadyWon ? '¡Este cliente ya ganó su premio!' : '¡Este cliente ya usó sus 2 oportunidades!'}
          </p>
          <p className="mt-1 text-sm text-ink-400">
            {alreadyWon
              ? 'Solo se permite un premio por cliente en el evento.'
              : 'Recibió un segundo intento tras perder el primero.'}
          </p>
        </div>
      ) : (
        <>
          <RouletteWheel
            prizes={wheelSlots}
            spinning={spinning}
            targetIndex={targetIndex}
            onSpinComplete={handleSpinComplete}
          />

          {lostSpin && !actionError && (
            <p className="mx-auto mt-5 flex max-w-sm items-center justify-center gap-2 rounded-lg border border-ink-300 bg-ink-100 px-3 py-2 text-sm font-semibold text-ink-600">
              😔 ¡Sin suerte esta vez! Inténtalo de nuevo.
            </p>
          )}

          {actionError && (
            <p className="mx-auto mt-5 flex max-w-sm items-center justify-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-400">
              <AlertTriangle size={16} className="shrink-0" />
              {actionError}
            </p>
          )}

          <button
            onClick={handleSpin}
            disabled={spinning || busy || !canSpin}
            className="mt-8 w-full rounded-2xl bg-brand-500 py-4 text-lg font-display text-ink-900 shadow-brand transition-transform active:scale-[0.98] disabled:opacity-60 sm:w-auto sm:px-16"
          >
            {spinning ? '¡Girando…!' : busy ? 'Registrando…' : spinsUsed === 1 ? '¡Segundo intento!' : '¡Girar la ruleta!'}
          </button>
        </>
      )}

      {wonPrize && (
        <VictoryModal
          prizeName={wonPrize}
          contactName={selectedContact.nombre}
          onClose={() => setWonPrize(null)}
        />
      )}
    </div>
  );
}

function ContactPicker({ contacts, onSelect }) {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6 text-center">
        <h2 className="font-display text-xl text-ink-900">¿Para quién es el giro?</h2>
        <p className="mt-1 text-sm text-ink-500">
          Seleccione un contacto registrado para continuar con la ruleta.
        </p>
      </div>

      {contacts.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-ink-200 bg-white py-10 text-center">
          <Users size={32} className="mb-3 text-ink-300" />
          <p className="text-sm font-semibold text-ink-700">Sin contactos registrados</p>
          <p className="mt-1 text-sm text-ink-400">
            Debe registrar un contacto en el CRM antes de girar.
          </p>
          <button
            onClick={() => router.push('/crm')}
            className="mt-5 flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-ink-900 shadow-brand transition-transform active:scale-[0.98]"
          >
            <PlusCircle size={16} />
            Registrar contacto
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {contacts.map(c => {
            const isCliente = c.tipo === 'cliente_existente';
            return (
              <button
                key={c.id}
                onClick={() => onSelect(c)}
                className="flex w-full items-center gap-3 rounded-2xl border border-ink-200 bg-white p-4 text-left transition-all hover:border-brand-500 hover:shadow-md active:scale-[0.99]"
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  isCliente ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                }`}>
                  {isCliente ? <BadgeCheck size={20} /> : <UserPlus size={20} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink-900">{c.nombre}</p>
                  <p className="text-xs text-ink-400">
                    {c.telefono} · {isCliente ? 'Cliente existente' : 'Lead nuevo'}
                  </p>
                </div>
                <Gift size={18} className="shrink-0 text-brand-500" />
              </button>
            );
          })}

          <div className="pt-3 text-center">
            <button
              onClick={() => router.push('/crm')}
              className="text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700"
            >
              + Registrar nuevo contacto
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
