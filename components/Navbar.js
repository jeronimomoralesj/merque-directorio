'use client';

import Image from 'next/image';

const LOGO_URL =
  'https://www.merquellantas.com/assets/images/logo/Logo-Merquellantas.png';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-ink-800 bg-ink-900/95 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="relative h-1 w-1 overflow-hidden rounded-md p-1 sm:h-14 sm:w-14">
          <Image
            src={LOGO_URL}
            alt="Merquellantas"
            fill
            sizes="(max-width: 640px) 40px, 56px"
            className="object-contain brightness-0 invert"
            priority
          />
        </div>
      </nav>
    </header>
  );
}
