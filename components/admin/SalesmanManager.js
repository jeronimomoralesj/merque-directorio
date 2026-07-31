'use client';

import { useState } from 'react';
import { UserPlus, Loader2, CheckCircle2 } from 'lucide-react';

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  location: '',
  whatsapp_link: '',
  password: '',
  role: 'salesman',
};

export default function SalesmanManager({ onCreated }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/admin/create-salesman', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || 'Something went wrong.');
      } else {
        setSuccess(`${form.name} was registered successfully.`);
        setForm(EMPTY_FORM);
        onCreated?.();
      }
    } catch (_err) {
      setError('Network error \u2014 please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-ink-700">
        <UserPlus size={16} className="text-brand-500" />
        Register New Salesman
      </div>
      <p className="mt-1 text-xs text-ink-400">
        Creates their login credentials and directory profile in one step.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <input
          required
          placeholder="Full name"
          value={form.name}
          onChange={(e) => update('name', e.target.value)}
          className="rounded-lg border border-ink-200 px-3 py-2 text-sm"
        />
        <input
          required
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => update('email', e.target.value)}
          className="rounded-lg border border-ink-200 px-3 py-2 text-sm"
        />
        <input
          required
          placeholder="Phone"
          value={form.phone}
          onChange={(e) => update('phone', e.target.value)}
          className="rounded-lg border border-ink-200 px-3 py-2 text-sm"
        />
        <input
          required
          placeholder="Location / booth"
          value={form.location}
          onChange={(e) => update('location', e.target.value)}
          className="rounded-lg border border-ink-200 px-3 py-2 text-sm"
        />
        <input
          required
          placeholder="WhatsApp link (https://wa.me/…)"
          value={form.whatsapp_link}
          onChange={(e) => update('whatsapp_link', e.target.value)}
          className="rounded-lg border border-ink-200 px-3 py-2 text-sm sm:col-span-2"
        />
        <input
          required
          type="password"
          minLength={8}
          placeholder="Temporary password (min 8 chars)"
          value={form.password}
          onChange={(e) => update('password', e.target.value)}
          className="rounded-lg border border-ink-200 px-3 py-2 text-sm"
        />
        <select
          value={form.role}
          onChange={(e) => update('role', e.target.value)}
          className="rounded-lg border border-ink-200 px-3 py-2 text-sm"
        >
          <option value="salesman">Salesman</option>
          <option value="admin">Admin</option>
        </select>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 sm:col-span-2">
            {error}
          </p>
        )}
        {success && (
          <p className="flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 sm:col-span-2">
            <CheckCircle2 size={15} />
            {success}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-bold text-ink-900 disabled:opacity-60 sm:col-span-2"
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
          Register Salesman
        </button>
      </form>
    </div>
  );
}
