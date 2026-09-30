'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X, ImagePlus, Loader2, CircleAlert } from 'lucide-react';
import { createClient } from '@/lib/supabaseClient'; // adjust path to your lib

const MAX_IMAGES = 5;
const MAX_MB = 5;

const inputClass =
  'w-full border border-slate-300 bg-white px-3 py-2 font-normal text-slate-900 placeholder:text-slate-400 focus:border-sky-800 focus:outline-none focus:ring-2 focus:ring-sky-800/30';

export default function Upload() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState([]); // [{ file, url }]
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Free preview object URLs when they change / on unmount
  useEffect(() => () => files.forEach((f) => URL.revokeObjectURL(f.url)), [files]);

  function addFiles(e) {
    setError('');
    const incoming = Array.from(e.target.files || []);
    e.target.value = '';
    const valid = incoming.filter((f) => f.type.startsWith('image/') && f.size <= MAX_MB * 1024 * 1024);
    if (valid.length !== incoming.length) setError(`Solo imágenes de hasta ${MAX_MB} MB.`);
    const room = MAX_IMAGES - files.length;
    if (valid.length > room) setError(`Máximo ${MAX_IMAGES} imágenes.`);
    setFiles((prev) => [...prev, ...valid.slice(0, room).map((file) => ({ file, url: URL.createObjectURL(file) }))]);
  }

  function removeFile(i) {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
  }

  function reset() {
    setFiles([]); setTitle(''); setDescription(''); setPrice(''); setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (files.length === 0) return setError('Agrega al menos una imagen.');
    setBusy(true);
    setError('');

    const supabase = createClient();
    const uploadedPaths = [];

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Debes iniciar sesión.');

      // 1) Upload images in parallel to portfolio/<user_id>/<uuid>.<ext>
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

      // 2) Insert the row (first image = cover)
      const { error: insErr } = await supabase.from('tires').insert({
        title: title.trim(),
        description: description.trim(),
        price: Number(price),
        images: urls,
      });
      if (insErr) throw insErr;

      reset();
      setOpen(false);
      router.refresh(); // re-run the server component to show the new tire
    } catch (err) {
      // Don't leave orphaned files if something failed
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
        className="inline-flex items-center gap-2 bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-sky-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-800"
      >
        <Plus className="h-5 w-5" /> Agregar llanta
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4"
          onClick={() => !busy && setOpen(false)}
        >
          <form
            onSubmit={handleSubmit}
            onClick={(e) => e.stopPropagation()}
            className="grid max-h-[95vh] w-full max-w-lg gap-4 overflow-y-auto bg-slate-50 p-6 text-slate-900"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Nueva llanta</h2>
              <button type="button" onClick={() => setOpen(false)} disabled={busy} aria-label="Cerrar" className="text-slate-500 hover:text-slate-900">
                <X className="h-6 w-6" />
              </button>
            </div>

            <label className="grid gap-1 text-sm font-semibold">
              Título
              <input required maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Michelin Pilot Sport 4 225/45 R17" className={inputClass} />
            </label>

            <label className="grid gap-1 text-sm font-semibold">
              Precio (COP)
              <input required type="number" min="0" step="1000" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="450000" className={inputClass} />
            </label>

            <label className="grid gap-1 text-sm font-semibold">
              Descripción
              <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Estado, medidas, kilometraje, garantía…" className={inputClass} />
            </label>

            <div className="grid gap-2 text-sm font-semibold">
              <span>Imágenes ({files.length}/{MAX_IMAGES}) — la primera es la portada</span>
              <div className="flex flex-wrap gap-2">
                {files.map((f, i) => (
                  <div key={f.url} className="relative h-20 w-20">
                    <img src={f.url} alt={`Imagen ${i + 1}`} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      aria-label={`Quitar imagen ${i + 1}`}
                      className="absolute right-0.5 top-0.5 bg-slate-900 p-0.5 text-white hover:bg-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {files.length < MAX_IMAGES && (
                  <label className="flex h-20 w-20 cursor-pointer items-center justify-center border-2 border-dashed border-slate-400 text-slate-500 hover:border-sky-800 hover:text-sky-800">
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
              <button type="button" disabled={busy} onClick={() => setOpen(false)} className="border border-slate-900 px-5 py-2.5 font-semibold hover:bg-slate-200 disabled:opacity-50">
                Cancelar
              </button>
              <button type="submit" disabled={busy} className="inline-flex items-center gap-2 bg-slate-900 px-5 py-2.5 font-semibold text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50">
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