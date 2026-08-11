'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { LogIn, Lock, Mail, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabaseClient';

const LOGO_URL =
  'https://www.merquellantas.com/assets/images/logo/Logo-Merquellantas.png';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !data.user) {
      setError('Incorrect email or password. Please try again.');
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from('salesmen')
      .select('role')
      .eq('email', data.user.email)
      .single();

    if (profileError || !profile) {
      setError('This account has no salesman profile. Contact an admin.');
      setLoading(false);
      return;
    }

    const nextParam = searchParams.get('next');
    const destination =
      profile.role === 'admin' ? '/admin' : (nextParam ?? '/crm');

    router.push(destination);
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink-900 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="relative h-16 w-16 overflow-hidden rounded-2xl bg-white p-2">
            <Image src={LOGO_URL} alt="Merquellantas" fill className="object-contain" priority />
          </div>
          <h1 className="mt-5 font-display text-xl text-white">Team Login</h1>
          <p className="mt-1.5 text-sm text-ink-400">
            For registered Merquellantas salesmen and admins only.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-ink-700 bg-ink-800 p-6"
        >
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-400">
              Email
            </label>
            <div className="relative">
              <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500" />
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@merquellantas.com"
                className="w-full rounded-xl border border-ink-600 bg-ink-900 py-3 pl-10 pr-3 text-sm text-white placeholder:text-ink-500 focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-400">
              Password
            </label>
            <div className="relative">
              <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500" />
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-ink-600 bg-ink-900 py-3 pl-10 pr-3 text-sm text-white placeholder:text-ink-500 focus:border-brand-500"
              />
            </div>
          </div>

          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-sm font-bold text-ink-900 transition-transform active:scale-[0.98] disabled:opacity-70"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <Link
          href="/"
          className="mt-6 block text-center text-sm text-ink-400 transition-colors hover:text-brand-500"
        >
          ← Back to the public directory
        </Link>
      </div>
    </main>
  );
}
