import React from 'react';
import { History } from 'lucide-react';
import { format } from 'date-fns';

export default function LastPerformance({ performance, dark = false }) {
  if (!performance) return null;

  const { sets, reps, weight, date, manual } = performance;
  const parts = [];
  if (sets) parts.push(`${sets} sets`);
  if (reps) parts.push(`${reps} reps`);
  if (weight > 0) parts.push(`${weight}kg`);

  if (parts.length === 0) return null;

  const suffix = manual
    ? '· custom'
    : date
      ? `· ${format(new Date(date), 'MMM d')}`
      : '';

  return (
    <div
      className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full whitespace-nowrap leading-none ${
        dark ? 'bg-slate-700/50 text-slate-300' : 'bg-slate-100 text-slate-500'
      }`}
    >
      <History className="w-3 h-3 flex-shrink-0" />
      <span className="font-medium">Last:</span>
      <span>{parts.join(' · ')}</span>
      {suffix && <span className="opacity-60">{suffix}</span>}
    </div>
  );
}