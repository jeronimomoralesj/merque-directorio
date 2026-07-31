import Link from 'next/link';
import { MapPin, ArrowUpRight } from 'lucide-react';

export default function SalesmanCard({ salesman }) {
  const initials = salesman.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <Link
      href={`/salesman/${salesman.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white p-5 transition-all duration-200 hover:-translate-y-1 hover:border-brand-500 hover:shadow-brand"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-ink-900 text-lg font-display text-brand-500">
          {initials}
        </div>
        <div className="min-w-0">
          <h3 className="truncate font-display text-base text-ink-900">{salesman.name}</h3>
          <p className="mt-1 flex items-center gap-1 text-sm text-ink-500">
            <MapPin size={14} className="shrink-0 text-brand-500" />
            <span className="truncate">{salesman.location}</span>
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-ink-100 pt-4">
        <span className="text-sm font-semibold text-ink-700 transition-colors group-hover:text-brand-600">
          View Profile
        </span>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-100 text-ink-700 transition-all group-hover:bg-brand-500 group-hover:text-ink-900">
          <ArrowUpRight size={16} />
        </span>
      </div>
    </Link>
  );
}
