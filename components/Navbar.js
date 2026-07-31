'use client';

import Image from 'next/image';

const LOGO_URL =
  'https://www.merquellantas.com/assets/images/logo/Logo-Merquellantas.png';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-ink-800 bg-ink-900/95 backdrop-blur">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/40 to-transparent" />
      <nav className="mx-auto flex max-w-6xl items-center justify-center px-4 py-3 sm:px-6">
        <div className="group relative flex h-12 w-32 items-center justify-center overflow-hidden rounded-lg transition-transform duration-200 ease-out hover:scale-[1.03] sm:h-16 sm:w-44">
          <Image
            src={LOGO_URL}
            alt="Merquellantas"
            fill
            sizes="(max-width: 640px) 128px, 176px"
            className="object-contain object-center brightness-0 invert transition-opacity duration-200 group-hover:opacity-90"
            priority
          />
        </div>
      </nav>
    </header>
  );
}