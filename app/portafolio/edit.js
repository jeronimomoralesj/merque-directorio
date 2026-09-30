'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, ImagePlus, Loader2, CircleAlert, Star, Trash2, Percent } from 'lucide-react';
import { createClient } from '@/lib/supabaseClient';

const BUCKET = 'portfolio';
const MAX_IMAGES = 5;
const MAX_MB = 5;

const inputClass =
  'w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 font-normal text-slate-900 placeholder:text-slate-400 focus:border-[#F59E33] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F59E33]/40';

function pathFromUrl(url) {
  const marker = `/${BUCKET}/`;
  const i = url.indexOf(marker);
  return i === -1 ? null : decodeURIComponent(url.slice(i + marker.length).split('?')[0]);
}

// Strip everything except digits (so "450.000" or "450,000" both work)
const onlyDigits = (v) => v.replace(/\D/g, '');
const formatCOP = (v) => {
  const digits = onlyDigits(v);
  return digits ? Number(digits).toLocaleString('es-CO') : '';
};

export default function EditTire({ tire, onClose }) {
  const router = useRouter();
  const [title, setTitle] = useState(tire.title);
  const [description, setDescription] = useState(tire.description ?? '');
  const [price, setPrice] = useState(() => String(tire.price ?? ''));
  const [discount, setDiscount] = useState(!!tire.discount);
  const [items, setItems] = useState(() =>
    (tire.images ?? []).map((url) => ({ id: url, url, file: null }))
  );
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');

  const itemsRef = useRef(items);
  itemsRef.current = items;
  useEffect(() => () => itemsRef.current.forEach((i) => i.file && URL.revokeObjectURL(i.url)), []);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !busy && onClose();
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [busy, onClose]);

  function addFiles(e) {
    setError('');
    const incoming = Array.from(e.target.files || []);
    e.target.value = '';
    const valid = incoming.filter((f) => f.type.startsWith('image/') && f.size <= MAX_MB * 1024 * 1024);
    if (valid.length !== incoming.length) setError(`Solo imágenes de hasta ${MAX_MB} MB.`);
    const room = MAX_IMAGES - items.length;
    if (valid.length > room) setError(`Máximo ${MAX_IMAGES} imágenes.`);
    setItems((prev) => [
      ...prev,
      ...valid.slice(0, room).map((file) => ({ id: crypto.randomUUID(), url: URL.createObjectURL(file), file })),
    ]);
  }

  function removeItem(id) {
    setItems((prev) => {
      const gone = prev.find((i) => i.id === id);
      if (gone?.file) URL.revokeObjectURL(gone.url);
      return prev.filter((i) => i.id !== id);
    });
  }

  function makeCover(id) {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id);
      return [item, ...prev.filter((i) => i.id !== id)];
    });
  }

  async function handleSave(e) {
    e.preventDefault();
    if (items.length === 0) return setError('La llanta necesita al menos una imagen.');
    const numericPrice = Number(onlyDigits(price));
    if (!numericPrice) return setError('Ingresa un precio válido.');
    setBusy(true);
    setError('');

    const supabase = createClient();
    const uploaded = [];

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Debes iniciar sesión.');

      const finalUrls = await Promise.all(
        items.map(async ({ url, file }) => {
          if (!file) return url;
          const ext = file.name.split('.').pop().toLowerCase();
          const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
          const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
            contentType: file.type,
            cacheControl: '31536000',
          });
          if (upErr) throw upErr;
          uploaded.push(path);
          return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
        })
      );

      const { data, error: updErr } = await supabase
        .from('tires')
        .update({
          title: title.trim(),
          description: description.trim(),
          price: numericPrice,
          discount,
          images: finalUrls,
        })
        .eq('id', tire.id)
        .select('id');
      if (updErr) throw updErr;
      if (!data?.length) throw new Error('No se pudo actualizar. ¿Tienes permiso sobre esta llanta?');

      const kept = new Set(finalUrls);
      const removed = (tire.images ?? []).filter((u) => !kept.has(u)).map(pathFromUrl).filter(Boolean);
      if (removed.length) await supabase.storage.from(BUCKET).remove(removed);

      router.refresh();
      onClose();
    } catch (err) {
      if (uploaded.length) await supabase.storage.from(BUCKET).remove(uploaded);
      setError(err.message || 'No se pudo guardar. Intenta de nuevo.');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    setError('');
    const supabase = createClient();
    try {
      const { data, error: delErr } = await supabase.from('tires').delete().eq('id', tire.id).select('id');
      if (delErr) throw delErr;
      if (!data?.length) throw new Error('No se pudo eliminar. ¿Tienes permiso sobre esta llanta?');

      const paths = (tire.images ?? []).map(pathFromUrl).filter(Boolean);
      if (paths.length) await supabase.storage.from(BUCKET).remove(paths);

      router.refresh();
      onClose();
    } catch (err) {
      setError(err.message || 'No se pudo eliminar.');
      setConfirmDelete(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 sm:items-center sm:p-4" onClick={() => !busy && onClose()}>
      <form
        onSubmit={handleSave}
        onClick={(e) => e.stopPropagation()}
        className="grid max-h-[95vh] w-full max-w-lg gap-4 overflow-y-auto rounded-t-3xl bg-white p-6 text-slate-900 sm:rounded-3xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold italic">Editar llanta</h2>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Cerrar" className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-900">
            <X className="h-6 w-6" />
          </button>
        </div>

        <label className="grid gap-1 text-sm font-semibold">
          Título
          <input required maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
        </label>

        <label className="grid gap-1 text-sm font-semibold">
          Precio (COP)
          <input
            required
            type="text"
            inputMode="numeric"
            value={formatCOP(price)}
            onChange={(e) => setPrice(onlyDigits(e.target.value))}
            placeholder="450.000"
            className={inputClass}
          />
        </label>

        {/* Discount toggle */}
        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <span className="flex items-center gap-2 text-sm font-semibold">
            <Percent className="h-4 w-4 text-[#C26A00]" />
            Aplicar precio en súper descuento
          </span>
          <input
            type="checkbox"
            checked={discount}
            onChange={(e) => setDiscount(e.target.checked)}
            className="h-5 w-5 accent-[#F59E33]"
          />
        </label>
        {discount && (
          <p className="text-xs text-slate-500">
            Se mostrará “Precio en súper descuento” y un precio original de{' '}
            <strong>{formatCOP(String(Math.round(Number(onlyDigits(price)) * 1.13)))}</strong> (13% sobre el precio mostrado).
          </p>
        )}

        <label className="grid gap-1 text-sm font-semibold">
          Descripción
          <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} />
        </label>

        <div className="grid gap-2 text-sm font-semibold">
          <span>Imágenes ({items.length}/{MAX_IMAGES})</span>
          <div className="flex flex-wrap gap-3">
            {items.map((it, i) => (
              <div key={it.id} className="relative h-24 w-24">
                <img src={it.url} alt={`Imagen ${i + 1}`} className="h-full w-full rounded-xl object-cover" />
                {i === 0 && (
                  <span className="absolute bottom-1 left-1 rounded-full bg-[#F59E33] px-2 py-0.5 text-[10px] font-bold text-slate-900">Portada</span>
                )}
                {it.file && (
                  <span className="absolute left-1 top-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">Nueva</span>
                )}
                <button type="button" onClick={() => removeItem(it.id)} aria-label={`Quitar imagen ${i + 1}`} className="absolute -right-1.5 -top-1.5 rounded-full bg-slate-900 p-1 text-white hover:bg-red-600">
                  <X className="h-3.5 w-3.5" />
                </button>
                {i > 0 && (
                  <button type="button" onClick={() => makeCover(it.id)} aria-label={`Usar imagen ${i + 1} como portada`} title="Usar como portada" className="absolute bottom-1 right-1 rounded-full bg-white p-1 text-slate-700 shadow hover:bg-[#F59E33]">
                    <Star className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
            {items.length < MAX_IMAGES && (
              <label className="flex h-24 w-24 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-slate-300 text-slate-400 hover:border-[#F59E33] hover:text-[#C26A00]">
                <ImagePlus className="h-6 w-6" />
                <input type="file" accept="image/*" multiple hidden onChange={addFiles} />
              </label>
            )}
          </div>
        </div>

        {error && (
          <p className="flex items-center gap-2 text-sm text-red-700">
            <CircleAlert className="h-4 w-4 shrink-0" /> {error}
          </p>
        )}

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          {confirmDelete ? (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-semibold text-red-700">¿Eliminar llanta y sus fotos?</span>
              <button type="button" disabled={busy} onClick={handleDelete} className="rounded-xl bg-red-600 px-3 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-50">
                Sí, eliminar
              </button>
              <button type="button" disabled={busy} onClick={() => setConfirmDelete(false)} className="rounded-xl border border-slate-300 px-3 py-2 font-semibold hover:bg-slate-100">
                No
              </button>
            </div>
          ) : (
            <button type="button" disabled={busy} onClick={() => setConfirmDelete(true)} className="inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50">
              <Trash2 className="h-4 w-4" /> Eliminar llanta
            </button>
          )}

          <div className="flex justify-end gap-2">
            <button type="button" disabled={busy} onClick={onClose} className="rounded-2xl border border-slate-300 px-5 py-3 font-semibold hover:bg-slate-100 disabled:opacity-50">
              Cancelar
            </button>
            <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-2xl bg-[#F59E33] px-5 py-3 font-semibold text-slate-900 hover:bg-[#E68E1F] disabled:cursor-not-allowed disabled:opacity-50">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {busy ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}