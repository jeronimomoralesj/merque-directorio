'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, ArrowRight, Check, X, Loader2,
  ClipboardList, Gift, RotateCcw, UserPlus, BadgeCheck,
  Calendar,
} from 'lucide-react';
import { createClient } from '@/lib/supabaseClient';
import { QUIZ_QUESTIONS, QUIZ_PASS_THRESHOLD } from './quizData';

// ── Same constants as CRMDashboard ────────────────────────────────────────
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

const INPUT =
  'w-full rounded-xl border border-ink-200 bg-ink-50 px-3 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:bg-white focus:outline-none transition-colors';
const TEXTAREA = INPUT + ' resize-none';

export default function QuizPage() {
  const router = useRouter();
  const supabase = createClient();

  // step: 'intro' | 'questions' | 'contact' | 'result'
  const [step, setStep] = useState('intro');
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [result, setResult] = useState(null);

  const total = QUIZ_QUESTIONS.length;
  const current = QUIZ_QUESTIONS[qIndex];
  const selectedOption = answers[current?.id];

  function handleSelect(optionId) {
    setAnswers((a) => ({ ...a, [current.id]: optionId }));
  }

  function handleNext() {
    if (!selectedOption) return;
    if (qIndex < total - 1) setQIndex((i) => i + 1);
    else setStep('contact');
  }

  function handlePrev() {
    if (qIndex > 0) setQIndex((i) => i - 1);
  }

  function resetQuiz() {
    setAnswers({});
    setQIndex(0);
    setForm({ ...EMPTY_FORM });
    setSubmitError('');
    setResult(null);
    setStep('intro');
  }

  function toggleCategoria(cat) {
    setForm((f) => ({
      ...f,
      compras_habituales: f.compras_habituales.includes(cat)
        ? f.compras_habituales.filter((c) => c !== cat)
        : [...f.compras_habituales, cat],
    }));
  }

  // ── Save: mirrors CRMDashboard.handleSubmit exactly ──────────────────────
  async function handleFinish(e) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSubmitError('Sesión expirada. Vuelva a iniciar sesión.');
        setSubmitting(false);
        return;
      }

      const { data: profile } = await supabase
        .from('salesmen')
        .select('name')
        .eq('email', user.email)
        .single();
      const salesmanName = profile?.name ?? user.email;

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

      // 1. Insert contact (identical to CRMDashboard)
      const { data: inserted, error: insertErr } = await supabase
        .from('contacts')
        .insert({
          salesman_email: user.email,
          salesman_name: salesmanName,
          ...payload,
        })
        .select('id')
        .single();

      if (insertErr) {
        console.error(insertErr);
        setSubmitError('No se pudo guardar el contacto. Intente de nuevo.');
        setSubmitting(false);
        return;
      }

      const contactId = inserted.id;

      // 2. Score the quiz
      const detailedAnswers = QUIZ_QUESTIONS.map((q) => ({
        question_id: q.id,
        question: q.question,
        selected: answers[q.id] ?? null,
        correct: answers[q.id] === q.correct,
        correct_answer: q.correct,
      }));
      const score = detailedAnswers.filter((a) => a.correct).length;
      const passed = score >= QUIZ_PASS_THRESHOLD;

      // 3. Save quiz response (best-effort; contact is already saved)
      const { error: quizErr } = await supabase.from('quiz_responses').insert({
        salesman_email: user.email,
        salesman_name: salesmanName,
        contact_id: contactId,
        contact_name: nombre,
        answers: detailedAnswers,
        score,
        total_questions: total,
        passed,
      });
      if (quizErr) console.error('quiz_responses insert failed:', quizErr.message);

      setResult({ score, total, passed, contactName: nombre, contactId });
      setStep('result');
    } catch (err) {
      console.error(err);
      setSubmitError('Algo salió mal. Intente de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="sticky top-0 z-20 border-b border-ink-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <button
            onClick={() => router.push('/crm')}
            className="flex items-center gap-1 rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-semibold text-ink-600 transition-colors hover:border-brand-500 hover:text-brand-600"
          >
            <ArrowLeft size={13} />
            Volver al CRM
          </button>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-400">
              CRM Convención
            </p>
            <p className="truncate text-sm font-semibold text-ink-900 leading-tight">
              Quiz del cliente
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6">
        {step === 'intro' && (
          <IntroCard onStart={() => setStep('questions')} total={total} threshold={QUIZ_PASS_THRESHOLD} />
        )}

        {step === 'questions' && (
          <QuestionCard
            question={current}
            index={qIndex}
            total={total}
            selected={selectedOption}
            onSelect={handleSelect}
            onNext={handleNext}
            onPrev={handlePrev}
          />
        )}

        {step === 'contact' && (
          <ContactForm
            form={form}
            setForm={setForm}
            toggleCategoria={toggleCategoria}
            submitting={submitting}
            submitError={submitError}
            onBack={() => setStep('questions')}
            onSubmit={handleFinish}
          />
        )}

        {step === 'result' && result && (
          <ResultCard
            result={result}
            onRetry={resetQuiz}
            onRoulette={() => router.push(`/roulette?contactId=${result.contactId}`)}
            onBackToCRM={() => router.push('/crm')}
          />
        )}
      </main>
    </div>
  );
}

/* ───────────────────────── Sub-components ───────────────────────── */

function IntroCard({ onStart, total, threshold }) {
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-6 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600">
        <ClipboardList size={28} />
      </div>
      <h1 className="font-display text-2xl text-ink-900">Quiz rápido</h1>
      <p className="mx-auto mt-2 max-w-sm text-sm text-ink-500">
        Responde {total} preguntas de conocimiento. Si aciertas {threshold} o más,
        el cliente podrá girar la ruleta de premios.
      </p>
      <button
        onClick={onStart}
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3 text-sm font-bold text-ink-900 shadow-brand transition-transform active:scale-[0.98]"
      >
        Comenzar quiz
        <ArrowRight size={16} />
      </button>
    </div>
  );
}

function QuestionCard({ question, index, total, selected, onSelect, onNext, onPrev }) {
  const isLast = index === total - 1;
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-ink-400">
          Pregunta {index + 1} de {total}
        </span>
        <div className="flex gap-1">
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-6 rounded-full ${
                i < index ? 'bg-brand-500' : i === index ? 'bg-brand-500/50' : 'bg-ink-200'
              }`}
            />
          ))}
        </div>
      </div>

      <h2 className="mb-5 text-lg font-semibold text-ink-900">{question.question}</h2>

      <div className="space-y-2">
        {question.options.map((opt) => {
          const active = selected === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSelect(opt.id)}
              className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all ${
                active
                  ? 'border-brand-500 bg-brand-50 text-brand-800'
                  : 'border-ink-200 text-ink-700 hover:border-ink-300 hover:bg-ink-50'
              }`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                  active ? 'border-brand-500 bg-brand-500 text-ink-900' : 'border-ink-300 text-ink-500'
                }`}
              >
                {opt.id.toUpperCase()}
              </span>
              <span className="flex-1">{opt.label}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex gap-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={index === 0}
          className="flex items-center justify-center gap-2 rounded-xl border border-ink-200 px-4 py-3 text-sm font-semibold text-ink-600 transition-colors hover:bg-ink-50 disabled:opacity-40"
        >
          <ArrowLeft size={15} />
          Atrás
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!selected}
          className="flex flex-[2] items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-sm font-bold text-ink-900 shadow-brand transition-transform active:scale-[0.98] disabled:opacity-50"
        >
          {isLast ? 'Finalizar quiz' : 'Siguiente'}
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}

/* ───────────────────── Full CRM contact form ───────────────────── */

function FieldLabel({ children }) {
  return (
    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-500">
      {children}
    </label>
  );
}

function ContactForm({ form, setForm, toggleCategoria, submitting, submitError, onBack, onSubmit }) {
  return (
    <form
      onSubmit={onSubmit}
      className="space-y-5 rounded-2xl border border-ink-200 bg-white p-5 shadow-sm"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600">
          <UserPlus size={20} />
        </div>
        <div>
          <h2 className="font-display text-lg text-ink-900">Datos del cliente</h2>
          <p className="text-xs text-ink-500">Se guardará como nuevo contacto en el CRM.</p>
        </div>
      </div>

      {/* Tipo */}
      <div>
        <FieldLabel>Tipo de contacto</FieldLabel>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: 'lead', label: 'Lead nuevo', desc: 'Prospecto sin historial' },
            { value: 'cliente_existente', label: 'Cliente existente', desc: 'Ya nos ha comprado' },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setForm((f) => ({ ...f, tipo: opt.value }))}
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
          onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))}
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
          onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
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
          onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
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
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
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
          onChange={(e) => setForm((f) => ({ ...f, vehiculos: e.target.value }))}
          className={TEXTAREA}
        />
      </div>

      {/* Compras habituales */}
      <div>
        <FieldLabel>¿Qué compra habitualmente?</FieldLabel>
        <div className="mt-2 flex flex-wrap gap-2">
          {CATEGORIAS.map((cat) => (
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
          onChange={(e) => setForm((f) => ({ ...f, compras_otras: e.target.value }))}
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
          onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))}
          className={TEXTAREA}
        />
      </div>

      {submitError && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {submitError}
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className="flex items-center justify-center gap-2 rounded-xl border border-ink-200 px-4 py-3 text-sm font-semibold text-ink-600 transition-colors hover:bg-ink-50 disabled:opacity-40"
        >
          <ArrowLeft size={15} />
          Atrás
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex flex-[2] items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-sm font-bold text-ink-900 shadow-brand transition-transform active:scale-[0.98] disabled:opacity-70"
        >
          {submitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          {submitting ? 'Guardando…' : 'Guardar y ver resultado'}
        </button>
      </div>
    </form>
  );
}

function ResultCard({ result, onRetry, onRoulette, onBackToCRM }) {
  const { score, total, passed, contactName } = result;

  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-6 text-center shadow-sm">
      <div
        className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl ${
          passed ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
        }`}
      >
        {passed ? <BadgeCheck size={32} /> : <X size={32} />}
      </div>

      <h2 className="font-display text-2xl text-ink-900">
        {passed ? '¡Aprobado!' : 'No alcanzó el mínimo'}
      </h2>
      <p className="mt-2 text-sm text-ink-500">
        {contactName} acertó <span className="font-bold text-ink-900">{score}</span> de {total} preguntas.
      </p>

      {passed ? (
        <>
          <p className="mt-4 text-sm text-ink-600">Puede girar la ruleta de premios.</p>
          <button
            onClick={onRoulette}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-4 text-base font-display text-ink-900 shadow-brand transition-transform active:scale-[0.98]"
          >
            <Gift size={18} />
            Girar la ruleta para {contactName}
          </button>
        </>
      ) : (
        <p className="mt-4 text-sm text-ink-600">
          El contacto quedó registrado. Puede intentarlo de nuevo con otro cliente.
        </p>
      )}

      <div className="mt-4 flex gap-2">
        <button
          onClick={onRetry}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-ink-200 py-3 text-sm font-semibold text-ink-600 transition-colors hover:bg-ink-50"
        >
          <RotateCcw size={15} />
          Nuevo quiz
        </button>
        <button
          onClick={onBackToCRM}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-ink-200 py-3 text-sm font-semibold text-ink-600 transition-colors hover:bg-ink-50"
        >
          <Calendar size={15} />
          Volver al CRM
        </button>
      </div>
    </div>
  );
}