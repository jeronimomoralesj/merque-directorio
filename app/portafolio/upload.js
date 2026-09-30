'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X, ImagePlus, Loader2, CircleAlert, Percent } from 'lucide-react';
import { createClient } from '@/lib/supabaseClient';

const MAX_IMAGES = 5;
const MAX_MB = 5;

const inputClass =
  'w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 font-normal text-slate-900 placeholder:text-slate-400 focus:border-[#F59E33] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F59E33]/40';

const onlyDigits = (v) => v.replace(/\D/g, '');
const formatCOP = (v) => {
  const digits = onlyDigits(v);
  return digits ? Number(digits).toLocaleString('es-CO') : '';
};

export default function Upload() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [discount, setDiscount] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => () => files.forEach((f) => URL.revokeObjectURL(f.url)), [files]);

  async function addFiles(e) {
  setError('');
  const incoming = Array.from(e.target.files || []);
  e.target.value = '';

  const valid = incoming.filter(
    (f) => f.type.startsWith('image/') && f.size <= MAX_MB * 1024 * 1024
  );
  if (valid.length !== incoming.length) setError(`Solo imágenes de hasta ${MAX_MB} MB.`);

  const room = MAX_IMAGES - items.length; // use `files` in upload.jsx
  if (valid.length > room) setError(`Máximo ${MAX_IMAGES} imágenes.`);

  // Snapshot bytes NOW so the file can't go stale later
  const kept = valid.slice(0, room);
  const snapped = await Promise.all(
    kept.map(async (file) => {
      const buf = await file.arrayBuffer();
      // A fresh File built from an in-memory buffer — immune to file changes
      const copy = new File([buf], file.name, {
        type: file.type || 'image/jpeg',
        lastModified: Date.now(),
      });
      return { id: crypto.randomUUID(), url: URL.createObjectURL(copy), file: copy };
    })
  );

  setItems((prev) => [...prev, ...snapped]);   // in edit-tire.jsx
  // setFiles((prev) => [...prev, ...snapped]); // in upload.jsx
}

  function removeFile(i) {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
  }

  function reset() {
    setFiles([]); setTitle(''); setDescription(''); setPrice(''); setDiscount(false); setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (files.length === 0) return setError('Agrega al menos una imagen.');
    const numericPrice = Number(onlyDigits(price));
    if (!numericPrice) return setError('Ingresa un precio válido.');
    setBusy(true);
    setError('');

    const supabase = createClient();
    const uploadedPaths = [];

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Debes iniciar sesión.');

      const urls = await Promise.all(
        files.map(async ({ file }) => {
          const ext = file.name.split('.').pop().toLowerCase();
          const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
          const { error: upErr } = await supabase.storage.from('portfolio').upload(path, file, {
            contentType: file.type,
            cacheControl: '31536000',
          });
          if (upErr) throw upErr;
          uploadedPaths.push(path);
          return supabase.storage.from('portfolio').getPublicUrl(path).data.publicUrl;
        })
      );

      const { error: insErr } = await supabase.from('tires').insert({
        title: title.trim(),
        description: description.trim(),
        price: numericPrice,
        discount,
        images: urls,
      });
      if (insErr) throw insErr;

      reset();
      setOpen(false);
      router.refresh();
    } catch (err) {
      if (uploadedPaths.length) await supabase.storage.from('portfolio').remove(uploadedPaths);
      setError(err.message || 'No se pudo guardar. Intenta de nuevo.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#F59E33] px-5 py-3 font-semibold text-slate-900 shadow-md shadow-[#F59E33]/30 transition hover:bg-[#E68E1F] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
      >
        <Plus className="h-5 w-5" /> Agregar llanta
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 sm:items-center sm:p-4"
          onClick={() => !busy && setOpen(false)}
        >
          <form
            onSubmit={handleSubmit}
            onClick={(e) => e.stopPropagation()}
            className="grid max-h-[95vh] w-full max-w-lg gap-4 overflow-y-auto rounded-t-3xl bg-white p-6 text-slate-900 sm:rounded-3xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold italic">Nueva llanta</h2>
              <button type="button" onClick={() => setOpen(false)} disabled={busy} aria-label="Cerrar" className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-900">
                <X className="h-6 w-6" />
              </button>
            </div>

            <label className="grid gap-1 text-sm font-semibold">
              Título
              <input required maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Michelin Pilot Sport 4 225/45 R17" className={inputClass} />
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
            {discount && price && (
              <p className="text-xs text-slate-500">
                Se mostrará “Precio en súper descuento” y un precio original de{' '}
                <strong>{formatCOP(String(Math.round(Number(onlyDigits(price)) * 1.13)))}</strong> (13% sobre el precio mostrado).
              </p>
            )}

            <label className="grid gap-1 text-sm font-semibold">
              Descripción
              <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Estado, medidas, kilometraje, garantía…" className={inputClass} />
            </label>

            <div className="grid gap-2 text-sm font-semibold">
              <span>Imágenes ({files.length}/{MAX_IMAGES}) — la primera es la portada</span>
              <div className="flex flex-wrap gap-2">
                {files.map((f, i) => (
                  <div key={f.url} className="relative h-20 w-20">
                    <img src={f.url} alt={`Imagen ${i + 1}`} className="h-full w-full rounded-xl object-cover" />
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      aria-label={`Quitar imagen ${i + 1}`}
                      className="absolute -right-1.5 -top-1.5 rounded-full bg-slate-900 p-0.5 text-white hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {files.length < MAX_IMAGES && (
                  <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-slate-300 text-slate-400 hover:border-[#F59E33] hover:text-[#C26A00]">
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

            <div className="flex justify-end gap-2">
              <button type="button" disabled={busy} onClick={() => setOpen(false)} className="rounded-2xl border border-slate-300 px-5 py-3 font-semibold hover:bg-slate-100 disabled:opacity-50">
                Cancelar
              </button>
              <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-2xl bg-[#F59E33] px-5 py-3 font-semibold text-slate-900 hover:bg-[#E68E1F] disabled:cursor-not-allowed disabled:opacity-50">
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                {busy ? 'Subiendo…' : 'Publicar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}