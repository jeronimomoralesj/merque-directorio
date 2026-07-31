import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-ink-900 px-4 text-center">
      <p className="font-display text-6xl text-brand-500">404</p>
      <h1 className="mt-4 font-display text-xl text-white">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-ink-400">
        That page doesn&apos;t exist. Head back to the salesman directory.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-xl bg-brand-500 px-6 py-3 text-sm font-bold text-ink-900"
      >
        Back to Directory
      </Link>
    </main>
  );
}
