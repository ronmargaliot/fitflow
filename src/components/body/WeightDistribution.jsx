import React, { useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function WeightDistribution({ records, metricKey, metricLabel, metricUnit }) {
  const data = useMemo(() => {
    const values = records
      .map(r => metricKey === 'weight' ? r.weight_kg : (r.measurements?.[metricKey] ?? null))
      .filter(v => v != null && v > 0);
    if (values.length < 2) return [];

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    if (range < 0.1) return [{ bin: min.toFixed(1), count: values.length }];

    const binCount = Math.min(12, Math.max(5, Math.ceil(Math.sqrt(values.length))));
    const binSize = range / binCount;
    const bins = Array.from({ length: binCount }, (_, i) => ({
      bin: (min + i * binSize + binSize / 2).toFixed(1),
      count: 0,
    }));

    values.forEach(v => {
      let idx = Math.floor((v - min) / binSize);
      if (idx >= binCount) idx = binCount - 1;
      bins[idx].count++;
    });

    return bins;
  }, [records, metricKey]);

  if (data.length === 0) return null;

  return (
    <Card className="border-slate-200">
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Distribution</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="bin" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ fontSize: '12px', borderRadius: '8px' }}
                formatter={(v) => [`${v} entries`, 'Count']}
                labelFormatter={(l) => `${l} ${metricUnit}`}
              />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-slate-400 mt-2 text-center">How often you've been at each {metricLabel.toLowerCase()} range</p>
      </CardContent>
    </Card>
  );
}