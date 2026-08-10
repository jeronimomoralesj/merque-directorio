'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  UserPlus, BadgeCheck, Calendar, Phone, Mail, Car,
  ShoppingBag, FileText, ChevronDown, ChevronUp,
  Check, X, Loader2, LogOut, ClipboardList, Gift,
  Share2, Copy, QrCode, Pencil,
} from 'lucide-react';
import QRCode from 'react-qr-code';
import { createClient } from '@/lib/supabaseClient';

const LOGO_URL = 'https://www.merquellantas.com/assets/images/logo/Logo-Merquellantas.png';

const CATEGORIAS = [
  'Llantas de pasajero',
  'Llantas de camioneta / SUV',
  'Llantas de carga',
  'Llantas de moto',
  'Montaje y balanceo',
  'Alineación',
  'Rines',
];

const EMPTY_FORM = {
  nombre: '',
  telefono: '',
  email: '',
  tipo: 'lead',
  fecha: new Date().toISOString().split('T')[0],
  vehiculos: '',
  compras_habituales: [],
  compras_otras: '',
  notas: '',
};

const INPUT = 'w-full rounded-xl border border-ink-200 bg-ink-50 px-3 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:bg-white focus:outline-none transition-colors';
const TEXTAREA = INPUT + ' resize-none';

export default function CRMDashboard({ user, salesmanName, salesmanId }) {
  const router = useRouter();
  const [contacts, setContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [lastSaved, setLastSaved] = useState(null); // { id, nombre }
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [filter, setFilter] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const [profileUrl, setProfileUrl] = useState('');

  useEffect(() => {
    if (salesmanId) setProfileUrl(`${window.location.origin}/salesman/${salesmanId}`);
  }, [salesmanId]);

  async function handleCopyLink() {
    await navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleNativeShare() {
    await navigator.share({ title: `Perfil de ${salesmanName} — Merquellantas`, url: profileUrl });
  }

  const loadContacts = useCallback(async () => {
    setLoadingContacts(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('contacts')
      .select('*')
      .eq('salesman_email', user.email)
      .order('created_at', { ascending: false });
    if (data) setContacts(data);
    setLoadingContacts(false);
  }, [user.email]);

  useEffect(() => { loadContacts(); }, [loadContacts]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  function toggleCategoria(cat) {
    setForm(f => ({
      ...f,
      compras_habituales: f.compras_habituales.includes(cat)
        ? f.compras_habituales.filter(c => c !== cat)
        : [...f.compras_habituales, cat],
    }));
  }

  function handleEdit(contact) {
    setEditingId(contact.id);
    setForm({
      nombre: contact.nombre ?? '',
      telefono: contact.telefono ?? '',
      email: contact.email ?? '',
      tipo: contact.tipo ?? 'lead',
      fecha: contact.fecha ?? new Date().toISOString().split('T')[0],
      vehiculos: contact.vehiculos ?? '',
      compras_habituales: contact.compras_habituales ?? [],
      compras_otras: contact.compras_otras ?? '',
      notas: contact.notas ?? '',
    });
    setShowForm(true);
    setErrorMsg('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    const supabase = createClient();
    const nombre = form.nombre.trim();
    const payload = {
      nombre,
      telefono: form.telefono.trim(),
      email: form.email.trim() || null,
      tipo: form.tipo,
      fecha: form.fecha,
      vehiculos: form.vehiculos.trim() || null,
      compras_habituales: form.compras_habituales,
      compras_otras: form.compras_otras.trim() || null,
      notas: form.notas.trim() || null,
    };

    let savedId = editingId;
    if (editingId) {
      const { error } = await supabase
        .from('contacts')
        .update(payload)
        .eq('id', editingId)
        .eq('salesman_email', user.email);
      if (error) {
        setErrorMsg('Error al actualizar el contacto. Intente nuevamente.');
        setSubmitting(false);
        return;
      }
    } else {
      const { data: inserted, error } = await supabase
        .from('contacts')
        .insert({ salesman_email: user.email, salesman_name: salesmanName, ...payload })
        .select('id')
        .single();
      if (error) {
        setErrorMsg('Error al guardar el contacto. Intente nuevamente.');
        setSubmitting(false);
        return;
      }
      savedId = inserted.id;
    }

    setLastSaved({ id: savedId, nombre });
    setSuccessMsg('');
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setShowForm(false);
    await loadContacts();
    setSubmitting(false);
  }

  function handleCancel() {
    setShowForm(false);
    setErrorMsg('');
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const todayCount = contacts.filter(c => c.fecha === todayStr).length;
  const leadsCount = contacts.filter(c => c.tipo === 'lead').length;
  const clientesCount = contacts.filter(c => c.tipo === 'cliente_existente').length;
  const filtered = filter === 'all' ? contacts : contacts.filter(c => c.tipo === filter);

  return (
    <div className="min-h-screen bg-ink-50">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-ink-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl bg-white p-1 shadow-sm ring-1 ring-ink-200">
              <Image src={LOGO_URL} alt="Merquellantas" fill className="object-contain" priority />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-400">CRM Convención</p>
              <p className="truncate text-sm font-semibold text-ink-900 leading-tight">{salesmanName}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {salesmanId && (
              <button
                onClick={() => setShowShare(true)}
                className="flex items-center gap-1.5 rounded-lg border border-brand-500/40 bg-brand-500/10 px-3 py-1.5 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-500 hover:text-ink-900"
              >
                <QrCode size={13} />
                Mi QR
              </button>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-semibold text-ink-600 transition-colors hover:border-brand-500 hover:text-brand-600"
            >
              <LogOut size={13} />
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-5 px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Hoy" value={todayCount} colorClass="text-brand-600 bg-brand-50" icon={Calendar} />
          <StatCard label="Leads" value={leadsCount} colorClass="text-blue-600 bg-blue-50" icon={UserPlus} />
          <StatCard label="Clientes" value={clientesCount} colorClass="text-green-600 bg-green-50" icon={BadgeCheck} />
        </div>

        {/* Post-save roulette prompt */}
        {lastSaved && (
          <div className="rounded-2xl border border-brand-500/40 bg-brand-500/10 p-4">
            <div className="flex items-center gap-2">
              <Check size={16} className="shrink-0 text-green-600" />
              <p className="flex-1 text-sm font-semibold text-ink-900">
                Contacto <span className="text-brand-700">&ldquo;{lastSaved.nombre}&rdquo;</span> guardado.
              </p>
              <button
                onClick={() => setLastSaved(null)}
                className="text-ink-400 hover:text-ink-700 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <button
              onClick={() => router.push(`/roulette?contactId=${lastSaved.id}`)}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-sm font-bold text-ink-900 shadow-brand transition-transform active:scale-[0.98]"
            >
              <Gift size={16} />
              Girar la ruleta para {lastSaved.nombre}
            </button>
          </div>
        )}

        {/* Success banner (fallback) */}
        {successMsg && (
          <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <Check size={15} className="shrink-0 text-green-500" />
            {successMsg}
          </div>
        )}

        {/* CTA or form */}
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-500 py-4 text-sm font-bold text-ink-900 shadow-brand transition-transform active:scale-[0.98]"
          >
            <UserPlus size={18} />
            Registrar nuevo contacto
          </button>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-5 rounded-2xl border border-ink-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg text-ink-900">{editingId ? 'Editar contacto' : 'Nuevo contacto'}</h2>
              <button type="button" onClick={handleCancel} className="text-ink-400 hover:text-ink-900 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Tipo */}
            <div>
              <FieldLabel>Tipo de contacto</FieldLabel>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'lead', label: 'Lead nuevo', desc: 'Prospecto sin historial' },
                  { value: 'cliente_existente', label: 'Cliente existente', desc: 'Ya nos ha comprado' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, tipo: opt.value }))}
                    className={`flex flex-col items-start rounded-xl border p-3 text-left text-sm transition-all ${
                      form.tipo === opt.value
                        ? 'border-brand-500 bg-brand-50 text-brand-800'
                        : 'border-ink-200 text-ink-600 hover:border-ink-300'
                    }`}
                  >
                    <span className="font-semibold">{opt.label}</span>
                    <span className="text-xs opacity-70">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Fecha */}
            <div>
              <FieldLabel>Fecha de contacto</FieldLabel>
              <input
                type="date"
                required
                value={form.fecha}
                onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
                className={INPUT}
              />
            </div>

            {/* Nombre */}
            <div>
              <FieldLabel>Nombre completo *</FieldLabel>
              <input
                type="text"
                required
                placeholder="Ej. Carlos Rodríguez"
                value={form.nombre}
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                className={INPUT}
              />
            </div>

            {/* Teléfono */}
            <div>
              <FieldLabel>Teléfono *</FieldLabel>
              <input
                type="tel"
                required
                placeholder="Ej. 3101234567"
                value={form.telefono}
                onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
                className={INPUT}
              />
            </div>

            {/* Correo */}
            <div>
              <FieldLabel>Correo electrónico (opcional)</FieldLabel>
              <input
                type="email"
                placeholder="Ej. carlos@email.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className={INPUT}
              />
            </div>

            {/* Vehículos */}
            <div>
              <FieldLabel>Vehículos y medidas de llanta</FieldLabel>
              <textarea
                rows={2}
                placeholder={'Ej. Toyota Corolla 2019 — 195/65R15\nChevrolet Captiva 2021 — 235/55R18'}
                value={form.vehiculos}
                onChange={e => setForm(f => ({ ...f, vehiculos: e.target.value }))}
                className={TEXTAREA}
              />
            </div>

            {/* Compras habituales */}
            <div>
              <FieldLabel>¿Qué compra habitualmente?</FieldLabel>
              <div className="mt-2 flex flex-wrap gap-2">
                {CATEGORIAS.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategoria(cat)}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition-all ${
                      form.compras_habituales.includes(cat)
                        ? 'border-brand-500 bg-brand-500 text-ink-900'
                        : 'border-ink-200 text-ink-500 hover:border-ink-300'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder="Otro producto o categoría..."
                value={form.compras_otras}
                onChange={e => setForm(f => ({ ...f, compras_otras: e.target.value }))}
                className={INPUT + ' mt-2'}
              />
            </div>

            {/* Notas */}
            <div>
              <FieldLabel>Notas adicionales (opcional)</FieldLabel>
              <textarea
                rows={3}
                placeholder="Comentarios, necesidades específicas, próximo seguimiento..."
                value={form.notas}
                onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                className={TEXTAREA}
              />
            </div>

            {errorMsg && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                {errorMsg}
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 rounded-xl border border-ink-200 py-3 text-sm font-semibold text-ink-600 transition-colors hover:bg-ink-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex flex-[2] items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-sm font-bold text-ink-900 transition-transform active:scale-[0.98] disabled:opacity-70"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                {submitting ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Guardar contacto'}
              </button>
            </div>
          </form>
        )}

        {/* Contact list */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-base text-ink-900">
              Contactos registrados
              {contacts.length > 0 && (
                <span className="ml-2 text-sm font-normal text-ink-400">({contacts.length})</span>
              )}
            </h2>
            <div className="flex gap-1 rounded-lg border border-ink-200 bg-white p-1">
              {[
                { id: 'all', label: 'Todos' },
                { id: 'lead', label: 'Leads' },
                { id: 'cliente_existente', label: 'Clientes' },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setFilter(id)}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                    filter === id ? 'bg-brand-500 text-ink-900' : 'text-ink-500 hover:bg-ink-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {loadingContacts ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-brand-500" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-200 bg-white py-12 text-center">
              <ClipboardList size={32} className="mb-3 text-ink-300" />
              <p className="text-sm text-ink-400">Sin contactos en esta categoría</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(c => <ContactCard key={c.id} contact={c} onEdit={handleEdit} />)}
            </div>
          )}
        </section>
      </main>

      {/* Share / QR modal */}
      {showShare && profileUrl && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/60 p-4 backdrop-blur-sm sm:items-center"
          onClick={() => setShowShare(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-display text-lg text-ink-900">Comparte tu perfil</h3>
              <button onClick={() => setShowShare(false)} className="text-ink-400 transition-colors hover:text-ink-700">
                <X size={20} />
              </button>
            </div>

            {/* QR code */}
            <div className="mb-4 flex justify-center rounded-2xl border border-ink-100 bg-white p-5">
              <QRCode value={profileUrl} size={180} />
            </div>

            {/* Copyable link */}
            <div className="mb-3 flex items-center gap-2 rounded-xl border border-ink-200 bg-ink-50 px-3 py-2.5">
              <p className="flex-1 truncate text-xs text-ink-500">{profileUrl}</p>
              <button
                onClick={handleCopyLink}
                title="Copiar enlace"
                className="shrink-0 rounded-lg p-1 text-ink-400 transition-colors hover:bg-ink-200 hover:text-ink-700"
              >
                {copied ? <Check size={15} className="text-green-500" /> : <Copy size={15} />}
              </button>
            </div>

            <button
              onClick={handleCopyLink}
              className="mb-2 flex w-full items-center justify-center gap-2 rounded-xl border border-ink-200 py-3 text-sm font-semibold text-ink-700 transition-colors hover:bg-ink-50"
            >
              {copied ? <Check size={15} className="text-green-500" /> : <Copy size={15} />}
              {copied ? '¡Enlace copiado!' : 'Copiar enlace'}
            </button>

            {'share' in navigator && (
              <button
                onClick={handleNativeShare}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-sm font-bold text-ink-900 shadow-brand transition-transform active:scale-[0.98]"
              >
                <Share2 size={15} />
                Compartir
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, colorClass, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-4">
      <div className={`mb-2 inline-flex rounded-lg p-1.5 ${colorClass}`}>
        <Icon size={15} />
      </div>
      <p className="font-display text-2xl text-ink-900">{value}</p>
      <p className="text-xs text-ink-400">{label}</p>
    </div>
  );
}

function ContactCard({ contact, onEdit }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const isCliente = contact.tipo === 'cliente_existente';

  return (
    <div className="overflow-hidden rounded-2xl border border-ink-200 bg-white">
      <div className="flex items-start gap-3 p-4">
        <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
          isCliente ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
        }`}>
          {isCliente ? <BadgeCheck size={18} /> : <UserPlus size={18} />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate font-semibold text-ink-900">{contact.nombre}</h3>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
              isCliente ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
            }`}>
              {isCliente ? 'Cliente' : 'Lead'}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-ink-400">
            <span className="flex items-center gap-1"><Phone size={10} />{contact.telefono}</span>
            {contact.email && <span className="flex items-center gap-1"><Mail size={10} />{contact.email}</span>}
            <span className="flex items-center gap-1"><Calendar size={10} />{contact.fecha}</span>
          </div>
        </div>
        <button
          onClick={() => setExpanded(e => !e)}
          className="shrink-0 text-ink-300 transition-colors hover:text-ink-600"
          aria-label={expanded ? 'Contraer' : 'Expandir'}
        >
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {expanded && (
        <div className="space-y-3 border-t border-ink-100 px-4 pb-4 pt-3">
          {contact.vehiculos && (
            <DetailRow icon={Car} label="Vehículos y medidas">
              <p className="whitespace-pre-wrap text-sm text-ink-700">{contact.vehiculos}</p>
            </DetailRow>
          )}
          {contact.compras_habituales?.length > 0 && (
            <DetailRow icon={ShoppingBag} label="Compra habitualmente">
              <div className="flex flex-wrap gap-1.5">
                {contact.compras_habituales.map(c => (
                  <span key={c} className="rounded-full bg-ink-100 px-2 py-0.5 text-xs text-ink-600">{c}</span>
                ))}
              </div>
            </DetailRow>
          )}
          {contact.compras_otras && (
            <DetailRow icon={ShoppingBag} label="Otros productos">
              <p className="text-sm text-ink-700">{contact.compras_otras}</p>
            </DetailRow>
          )}
          {contact.notas && (
            <DetailRow icon={FileText} label="Notas">
              <p className="whitespace-pre-wrap text-sm text-ink-700">{contact.notas}</p>
            </DetailRow>
          )}
          <div className="mt-1 flex gap-2">
            <button
              onClick={() => onEdit(contact)}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-ink-200 py-2.5 text-sm font-semibold text-ink-600 transition-colors hover:border-ink-400 hover:bg-ink-50"
            >
              <Pencil size={14} />
              Editar
            </button>
            <button
              onClick={() => router.push(`/roulette?contactId=${contact.id}`)}
              className="flex flex-[2] items-center justify-center gap-2 rounded-xl border border-brand-500/40 bg-brand-500/10 py-2.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-500 hover:text-ink-900"
            >
              <Gift size={15} />
              Girar ruleta
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ icon: Icon, label, children }) {
  return (
    <div>
      <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-ink-400">
        <Icon size={11} />
        {label}
      </p>
      {children}
    </div>
  );
}

function FieldLabel({ children }) {
  return (
    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-500">
      {children}
    </label>
  );
}
