import React from 'react';
import { History } from 'lucide-react';
import { format } from 'date-fns';

export default function LastPerformance({ performance, dark = false }) {
  if (!performance) return null;

  const { sets, reps, weight, date } = performance;
  const parts = [];
  if (sets) parts.push(`${sets} sets`);
  if (reps) parts.push(`${reps} reps`);
  if (weight > 0) parts.push(`${weight}kg`);

  if (parts.length === 0) return null;

  const dateStr = date ? format(new Date(date), 'MMM d') : '';

  return (
    <div
      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
        dark ? 'bg-slate-700/50 text-slate-300' : 'bg-slate-100 text-slate-500'
      }`}
    >
      <History className="w-3 h-3 flex-shrink-0" />
      <span className="font-medium">Last:</span>
      <span>{parts.join(' · ')}</span>
      {dateStr && <span className="opacity-60">({dateStr})</span>}
    </div>
  );
}