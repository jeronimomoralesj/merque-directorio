'use client';

import { useState } from 'react';
import { Save, Trash2, Loader2, Users, Upload } from 'lucide-react';
import { createClient } from '@/lib/supabaseClient';

function compressImage(file, maxWidth = 300, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img');
    const reader = new FileReader();
    reader.onload = (e) => {
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function SalesmanList({ initialSalesmen }) {
  const [salesmen, setSalesmen] = useState(initialSalesmen);
  const [drafts, setDrafts] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');

  function updateDraft(id, field, value) {
    setDrafts((prev) => ({
      ...prev,
      [id]: { ...salesmen.find((s) => s.id === id), ...prev[id], [field]: value },
    }));
  }

  async function handlePhotoChange(id, file) {
    if (!file) return;
    try {
      const photo_base64 = await compressImage(file);
      updateDraft(id, 'photo_base64', photo_base64);
    } catch {
      setError('Could not process that image.');
    }
  }

  async function saveRow(id) {
  const draft = drafts[id];
  if (!draft) return;
  setSavingId(id);
  setError('');
  const supabase = createClient();
  const { data, error: updateError } = await supabase
    .from('salesmen')
    .update({
      name: draft.name,
      email: draft.email,
      phone: draft.phone,
      location: draft.location,
      whatsapp_link: draft.whatsapp_link,
      role: draft.role,
      photo_base64: draft.photo_base64,
    })
    .eq('id', id)
    .select();

  if (updateError) {
    setError(updateError.message);
  } else if (!data || data.length === 0) {
    setError('Update was blocked — you may not have admin permissions, or the row no longer exists.');
  } else {
    setSalesmen((prev) => prev.map((s) => (s.id === id ? { ...s, ...draft } : s)));
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }
  setSavingId(null);
}

  async function deleteRow(id, name) {
    if (!confirm(`Delete ${name}? This removes their directory profile (login access, if any, is not affected).`)) return;
    setDeletingId(id);
    setError('');
    const supabase = createClient();
    const { error: deleteError } = await supabase.from('salesmen').delete().eq('id', id);
    if (deleteError) {
      setError(deleteError.message);
    } else {
      setSalesmen((prev) => prev.filter((s) => s.id !== id));
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
    setDeletingId(null);
  }

  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-ink-700">
        <Users size={16} className="text-brand-500" />
        Manage Salesmen
      </div>
      <p className="mt-1 text-xs text-ink-400">
        Edit info, swap photos, or remove profiles. Changes save instantly to Supabase.
      </p>

      {error && (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="mt-4 space-y-3">
        {salesmen.length === 0 ? (
          <p className="text-sm text-ink-400">No salesmen registered yet.</p>
        ) : (
          salesmen.map((s) => {
            const draft = drafts[s.id] || s;
            const dirty = Boolean(drafts[s.id]);
            return (
              <div
                key={s.id}
                className="flex flex-col gap-3 rounded-xl border border-ink-100 bg-ink-50 p-3 sm:flex-row sm:items-start"
              >
                <div className="flex shrink-0 flex-col items-center gap-1.5">
                  {draft.photo_base64 ? (
                    <img
                      src={draft.photo_base64}
                      alt={draft.name}
                      className="h-14 w-14 rounded-xl object-cover ring-2 ring-white"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-ink-900 text-sm font-bold text-white ring-2 ring-white">
                      {draft.name?.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <label className="flex cursor-pointer items-center gap-1 text-[11px] font-medium text-brand-600 hover:underline">
                    <Upload size={11} />
                    Photo
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handlePhotoChange(s.id, e.target.files[0])}
                    />
                  </label>
                </div>

                <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
                  <input
                    value={draft.name}
                    onChange={(e) => updateDraft(s.id, 'name', e.target.value)}
                    placeholder="Name"
                    className="rounded-lg border border-ink-200 px-2.5 py-1.5 text-sm"
                  />
                  <input
                    value={draft.email}
                    onChange={(e) => updateDraft(s.id, 'email', e.target.value)}
                    placeholder="Email"
                    className="rounded-lg border border-ink-200 px-2.5 py-1.5 text-sm"
                  />
                  <input
                    value={draft.phone || ''}
                    onChange={(e) => updateDraft(s.id, 'phone', e.target.value)}
                    placeholder="Phone"
                    className="rounded-lg border border-ink-200 px-2.5 py-1.5 text-sm"
                  />
                  <input
                    value={draft.location || ''}
                    onChange={(e) => updateDraft(s.id, 'location', e.target.value)}
                    placeholder="Location / booth"
                    className="rounded-lg border border-ink-200 px-2.5 py-1.5 text-sm"
                  />
                  <input
                    value={draft.whatsapp_link || ''}
                    onChange={(e) => updateDraft(s.id, 'whatsapp_link', e.target.value)}
                    placeholder="WhatsApp link"
                    className="rounded-lg border border-ink-200 px-2.5 py-1.5 text-sm sm:col-span-2"
                  />
                  <select
                    value={draft.role}
                    onChange={(e) => updateDraft(s.id, 'role', e.target.value)}
                    className="rounded-lg border border-ink-200 px-2.5 py-1.5 text-sm"
                  >
                    <option value="salesman">Salesman</option>
                    <option value="admin">Admin</option>
                  </select>
                  <div className="flex items-center gap-2 text-xs text-ink-400">
                    <span>{draft.profile_views || 0} views</span>
                    <span>·</span>
                    <span>{draft.whatsapp_clicks || 0} clicks</span>
                  </div>
                </div>

                <div className="flex shrink-0 gap-1.5 sm:flex-col">
                  <button
                    onClick={() => saveRow(s.id)}
                    disabled={!dirty || savingId === s.id}
                    title="Save"
                    className="rounded-lg bg-brand-500 p-1.5 text-ink-900 disabled:opacity-40"
                  >
                    {savingId === s.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Save size={14} />
                    )}
                  </button>
                  <button
                    onClick={() => deleteRow(s.id, s.name)}
                    disabled={deletingId === s.id}
                    title="Delete"
                    className="rounded-lg bg-ink-100 p-1.5 text-ink-600 hover:bg-red-100 hover:text-red-600 disabled:opacity-40"
                  >
                    {deletingId === s.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}