import React, { useMemo, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachWeekOfInterval, eachMonthOfInterval, isWithinInterval } from 'date-fns';

export default function WeeklyComparison({ allPoints, metricLabel, metricUnit }) {
  const [mode, setMode] = useState('week');

  const groups = useMemo(() => {
    if (allPoints.length === 0) return [];
    const start = new Date(allPoints[0].date);
    const end = new Date(allPoints[allPoints.length - 1].date);

    const periods = mode === 'week'
      ? eachWeekOfInterval({ start, end }, { weekStartsOn: 1 })
      : eachMonthOfInterval({ start, end });

    return periods.map((periodStart) => {
      const periodEnd = mode === 'week' ? endOfWeek(periodStart, { weekStartsOn: 1 }) : endOfMonth(periodStart);
      const inPeriod = allPoints.filter(p => isWithinInterval(new Date(p.date), { start: periodStart, end: periodEnd }));
      if (inPeriod.length === 0) return null;
      const values = inPeriod.map(p => p.value);
      const avg = +(values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
      return {
        label: format(periodStart, mode === 'week' ? 'MMM d' : 'MMM yy'),
        avg,
        min: +Math.min(...values).toFixed(1),
        max: +Math.max(...values).toFixed(1),
        count: values.length,
      };
    }).filter(Boolean).reverse();
  }, [allPoints, mode]);

  if (allPoints.length === 0) return null;

  return (
    <Card className="border-slate-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-900">Comparison</h3>
          <div className="flex gap-1">
            <button onClick={() => setMode('week')} className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${mode === 'week' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}>Weekly</button>
            <button onClick={() => setMode('month')} className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${mode === 'month' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}>Monthly</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-400 border-b border-slate-100">
                <th className="text-left py-1.5 font-medium">Period</th>
                <th className="text-right py-1.5 font-medium">Avg</th>
                <th className="text-right py-1.5 font-medium">Min</th>
                <th className="text-right py-1.5 font-medium">Max</th>
                <th className="text-right py-1.5 font-medium">Δ vs prev</th>
                <th className="text-right py-1.5 font-medium">Entries</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g, i) => {
                const prev = groups[i + 1];
                const delta = prev ? +(g.avg - prev.avg).toFixed(1) : null;
                return (
                  <tr key={i} className="border-b border-slate-50">
                    <td className="py-1.5 text-slate-700">{g.label}</td>
                    <td className="py-1.5 text-right font-medium text-slate-900">{g.avg}</td>
                    <td className="py-1.5 text-right text-slate-500">{g.min}</td>
                    <td className="py-1.5 text-right text-slate-500">{g.max}</td>
                    <td className={`py-1.5 text-right font-medium ${delta == null ? 'text-slate-300' : delta < 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {delta == null ? '—' : `${delta > 0 ? '+' : ''}${delta}`}
                    </td>
                    <td className="py-1.5 text-right text-slate-400">{g.count}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}