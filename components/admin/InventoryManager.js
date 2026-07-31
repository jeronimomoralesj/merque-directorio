'use client';

import { useState } from 'react';
import { Plus, Trash2, Save, Package, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabaseClient';

const EMPTY_FORM = {
  prize_name: '',
  image_url: '',
  day1_stock: 0,
  day2_stock: 0,
  day3_stock: 0,
  probability_weight: 1,
};

export default function InventoryManager({ initialPrizes }) {
  const [prizes, setPrizes] = useState(initialPrizes);
  const [drafts, setDrafts] = useState({});
  const [newPrize, setNewPrize] = useState(EMPTY_FORM);
  const [savingId, setSavingId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  function updateDraft(id, field, value) {
    setDrafts((prev) => ({
      ...prev,
      [id]: { ...prizes.find((p) => p.id === id), ...prev[id], [field]: value },
    }));
  }

  async function saveRow(id) {
    const draft = drafts[id];
    if (!draft) return;
    setSavingId(id);
    setError('');
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from('prizes')
      .update({
        prize_name: draft.prize_name,
        image_url: draft.image_url,
        day1_stock: Number(draft.day1_stock),
        day2_stock: Number(draft.day2_stock),
        day3_stock: Number(draft.day3_stock),
        probability_weight: Number(draft.probability_weight),
      })
      .eq('id', id);

    if (updateError) {
      setError(updateError.message);
    } else {
      setPrizes((prev) => prev.map((p) => (p.id === id ? { ...p, ...draft } : p)));
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
    setSavingId(null);
  }

  async function deleteRow(id) {
    if (!confirm('Delete this prize permanently?')) return;
    const supabase = createClient();
    const { error: deleteError } = await supabase.from('prizes').delete().eq('id', id);
    if (deleteError) {
      setError(deleteError.message);
    } else {
      setPrizes((prev) => prev.filter((p) => p.id !== id));
    }
  }

  async function createPrize(e) {
    e.preventDefault();
    setCreating(true);
    setError('');
    const supabase = createClient();
    const { data, error: insertError } = await supabase
      .from('prizes')
      .insert({
        ...newPrize,
        day1_stock: Number(newPrize.day1_stock),
        day2_stock: Number(newPrize.day2_stock),
        day3_stock: Number(newPrize.day3_stock),
        probability_weight: Number(newPrize.probability_weight),
      })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
    } else {
      setPrizes((prev) => [...prev, data]);
      setNewPrize(EMPTY_FORM);
    }
    setCreating(false);
  }

  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-ink-700">
        <Package size={16} className="text-brand-500" />
        Prize Inventory
      </div>
      <p className="mt-1 text-xs text-ink-400">
        Edit stock live during the convention — changes save instantly to Supabase.
      </p>

      {error && (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-xs uppercase tracking-wide text-ink-400">
              <th className="pb-2 pr-3">Prize</th>
              <th className="pb-2 pr-3">Image URL</th>
              <th className="pb-2 pr-3">Day 1</th>
              <th className="pb-2 pr-3">Day 2</th>
              <th className="pb-2 pr-3">Day 3</th>
              <th className="pb-2 pr-3">Weight</th>
              <th className="pb-2"></th>
            </tr>
          </thead>
          <tbody>
            {prizes.map((p) => {
              const draft = drafts[p.id] || p;
              const dirty = Boolean(drafts[p.id]);
              return (
                <tr key={p.id} className="border-b border-ink-50">
                  <td className="py-2 pr-3">
                    <input
                      value={draft.prize_name}
                      onChange={(e) => updateDraft(p.id, 'prize_name', e.target.value)}
                      className="w-32 rounded-lg border border-ink-200 px-2 py-1.5"
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      value={draft.image_url || ''}
                      onChange={(e) => updateDraft(p.id, 'image_url', e.target.value)}
                      placeholder="https://…"
                      className="w-40 rounded-lg border border-ink-200 px-2 py-1.5"
                    />
                  </td>
                  {['day1_stock', 'day2_stock', 'day3_stock'].map((col) => (
                    <td key={col} className="py-2 pr-3">
                      <input
                        type="number"
                        min="0"
                        value={draft[col]}
                        onChange={(e) => updateDraft(p.id, col, e.target.value)}
                        className="w-16 rounded-lg border border-ink-200 px-2 py-1.5"
                      />
                    </td>
                  ))}
                  <td className="py-2 pr-3">
                    <input
                      type="number"
                      min="1"
                      value={draft.probability_weight}
                      onChange={(e) => updateDraft(p.id, 'probability_weight', e.target.value)}
                      className="w-16 rounded-lg border border-ink-200 px-2 py-1.5"
                    />
                  </td>
                  <td className="py-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => saveRow(p.id)}
                        disabled={!dirty || savingId === p.id}
                        title="Save"
                        className="rounded-lg bg-brand-500 p-1.5 text-ink-900 disabled:opacity-40"
                      >
                        {savingId === p.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Save size={14} />
                        )}
                      </button>
                      <button
                        onClick={() => deleteRow(p.id)}
                        title="Delete"
                        className="rounded-lg bg-ink-100 p-1.5 text-ink-600 hover:bg-red-100 hover:text-red-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <form
        onSubmit={createPrize}
        className="mt-5 grid grid-cols-2 gap-2.5 border-t border-ink-100 pt-5 sm:grid-cols-6"
      >
        <input
          required
          placeholder="New prize name"
          value={newPrize.prize_name}
          onChange={(e) => setNewPrize((p) => ({ ...p, prize_name: e.target.value }))}
          className="col-span-2 rounded-lg border border-ink-200 px-2.5 py-2 text-sm sm:col-span-2"
        />
        <input
          placeholder="Image URL (optional)"
          value={newPrize.image_url}
          onChange={(e) => setNewPrize((p) => ({ ...p, image_url: e.target.value }))}
          className="col-span-2 rounded-lg border border-ink-200 px-2.5 py-2 text-sm sm:col-span-2"
        />
        <input
          type="number"
          min="0"
          placeholder="Day 1"
          value={newPrize.day1_stock}
          onChange={(e) => setNewPrize((p) => ({ ...p, day1_stock: e.target.value }))}
          className="rounded-lg border border-ink-200 px-2.5 py-2 text-sm"
        />
        <input
          type="number"
          min="0"
          placeholder="Day 2"
          value={newPrize.day2_stock}
          onChange={(e) => setNewPrize((p) => ({ ...p, day2_stock: e.target.value }))}
          className="rounded-lg border border-ink-200 px-2.5 py-2 text-sm"
        />
        <input
          type="number"
          min="0"
          placeholder="Day 3"
          value={newPrize.day3_stock}
          onChange={(e) => setNewPrize((p) => ({ ...p, day3_stock: e.target.value }))}
          className="rounded-lg border border-ink-200 px-2.5 py-2 text-sm"
        />
        <input
          type="number"
          min="1"
          placeholder="Weight"
          value={newPrize.probability_weight}
          onChange={(e) => setNewPrize((p) => ({ ...p, probability_weight: e.target.value }))}
          className="rounded-lg border border-ink-200 px-2.5 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={creating}
          className="col-span-2 flex items-center justify-center gap-1.5 rounded-lg bg-ink-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60 sm:col-span-6"
        >
          {creating ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
          Add Prize
        </button>
      </form>
    </div>
  );
}
