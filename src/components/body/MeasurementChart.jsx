import React, { useMemo, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { format, subDays } from 'date-fns';
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

function computeChartData(records, metricKey, timeFrame) {
  const points = records
    .map(r => ({
      date: r.date,
      value: metricKey === 'weight' ? r.weight_kg : (r.measurements?.[metricKey] ?? null),
    }))
    .filter(p => p.value != null && p.value > 0)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (points.length === 0) return [];

  let filtered = points;
  if (timeFrame === 'ytd') {
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);
    filtered = points.filter(p => new Date(p.date) >= startOfYear);
  } else if (timeFrame !== 'all') {
    const cutoff = subDays(new Date(), parseInt(timeFrame));
    filtered = points.filter(p => new Date(p.date) >= cutoff);
  }
  if (filtered.length === 0) return [];

  // Linear regression trend line
  const n = filtered.length;
  const xs = filtered.map((_, i) => i);
  const ys = filtered.map(p => p.value);
  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = ys.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((acc, x, i) => acc + x * ys[i], 0);
  const sumXX = xs.reduce((acc, x) => acc + x * x, 0);
  const denom = n * sumXX - sumX * sumX;
  const slope = denom !== 0 ? (n * sumXY - sumX * sumY) / denom : 0;
  const intercept = (sumY - slope * sumX) / n;

  // Calendar-window running averages
  const runningAvg = (idx, days) => {
    const currentDate = new Date(filtered[idx].date);
    const cutoff = subDays(currentDate, days);
    let sum = 0, count = 0;
    for (let i = 0; i <= idx; i++) {
      if (new Date(filtered[i].date) >= cutoff) {
        sum += filtered[i].value;
        count++;
      }
    }
    return count > 0 ? +(sum / count).toFixed(2) : null;
  };

  return filtered.map((p, i) => ({
    date: p.date,
    raw: p.value,
    trend: +(intercept + slope * i).toFixed(2),
    avg7: runningAvg(i, 7),
    avg30: runningAvg(i, 30),
  }));
}

function CustomTooltip({ active, payload, label, unit, showMap }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-2 shadow-lg text-xs">
      <p className="font-semibold text-slate-900 mb-1">{format(new Date(label), 'MMM d, yyyy')}</p>
      {payload.map((entry, i) => {
        if (entry.dataKey !== 'raw' && !showMap[entry.dataKey]) return null;
        if (entry.value == null) return null;
        return (
          <p key={i} style={{ color: entry.color }}>
            {entry.name}: {entry.value} {unit}
          </p>
        );
      })}
    </div>
  );
}

function Toggle({ active, onClick, color, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
        active ? 'bg-slate-100 text-slate-700' : 'bg-slate-50 text-slate-400'
      }`}
    >
      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: active ? color : '#cbd5e1' }} />
      {label}
    </button>
  );
}

function Stat({ label, value }) {
  return (
    <div className="text-center">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export default function MeasurementChart({ records, metricKey, metricLabel, metricUnit, timeFrame, goalWeight, annotations = [] }) {
  const [showRaw, setShowRaw] = useState(true);
  const [showTrend, setShowTrend] = useState(true);
  const [showAvg7, setShowAvg7] = useState(true);
  const [showAvg30, setShowAvg30] = useState(true);

  const data = useMemo(() => computeChartData(records, metricKey, timeFrame), [records, metricKey, timeFrame]);
  const showMap = { raw: showRaw, trend: showTrend, avg7: showAvg7, avg30: showAvg30 };

  if (data.length === 0) {
    return (
      <Card className="border-slate-200">
        <CardContent className="p-8 text-center">
          <p className="text-slate-400 text-sm">No {metricLabel.toLowerCase()} data for this period yet.</p>
          <p className="text-slate-400 text-xs mt-1">Log an entry above to start tracking.</p>
        </CardContent>
      </Card>
    );
  }

  const latest = data[data.length - 1];

  // Expand Y-axis domain to include goal line if set
  const allValues = data.map(d => d.raw).filter(v => v != null);
  let yDomain = ['dataMin', 'dataMax'];
  if (goalWeight != null && allValues.length > 0) {
    const dataMin = Math.min(...allValues);
    const dataMax = Math.max(...allValues);
    const min = Math.min(dataMin, goalWeight);
    const max = Math.max(dataMax, goalWeight);
    const padding = (max - min) * 0.1;
    yDomain = [+(min - padding).toFixed(1), +(max + padding).toFixed(1)];
  }

  return (
    <Card className="border-slate-200">
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-2 mb-3">
          <Toggle active={showRaw} onClick={() => setShowRaw(!showRaw)} color="#6366f1" label="Raw" />
          <Toggle active={showTrend} onClick={() => setShowTrend(!showTrend)} color="#f59e0b" label="Trend" />
          <Toggle active={showAvg7} onClick={() => setShowAvg7(!showAvg7)} color="#10b981" label="7D Avg" />
          <Toggle active={showAvg30} onClick={() => setShowAvg30(!showAvg30)} color="#8b5cf6" label="30D Avg" />
        </div>

        <div className="h-64 lg:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tickFormatter={d => format(new Date(d), 'MMM d')}
                tick={{ fontSize: 10, fill: '#94a3b8' }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} domain={yDomain} />
              <Tooltip content={<CustomTooltip unit={metricUnit} showMap={showMap} />} />
              {showRaw && <Line type="monotone" dataKey="raw" name={metricLabel} stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />}
              {showTrend && <Line type="linear" dataKey="trend" name="Trend" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={false} />}
              {showAvg7 && <Line type="monotone" dataKey="avg7" name="7D Avg" stroke="#10b981" strokeWidth={1.5} dot={false} />}
              {showAvg30 && <Line type="monotone" dataKey="avg30" name="30D Avg" stroke="#8b5cf6" strokeWidth={1.5} dot={false} />}
              {goalWeight != null && (
                <ReferenceLine y={goalWeight} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Goal', fill: '#ef4444', fontSize: 10, position: 'insideTopRight' }} />
              )}
              {annotations.map(a => (
                <ReferenceLine key={a.id} x={a.date} stroke="#0ea5e9" strokeDasharray="2 2" label={{ value: a.label, fill: '#0ea5e9', fontSize: 9, position: 'top' }} />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100">
          <Stat label="Latest" value={`${latest.raw} ${metricUnit}`} />
          <Stat label="7D Avg" value={latest.avg7 != null ? `${latest.avg7} ${metricUnit}` : '—'} />
          <Stat label="30D Avg" value={latest.avg30 != null ? `${latest.avg30} ${metricUnit}` : '—'} />
        </div>
      </CardContent>
    </Card>
  );
}