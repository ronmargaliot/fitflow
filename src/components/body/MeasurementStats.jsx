import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { format, differenceInDays, subDays } from 'date-fns';

export default function MeasurementStats({ allPoints, timeFrame, metricKey, metricLabel, metricUnit, currentUser, onUpdateUser }) {
  const [editingGoal, setEditingGoal] = useState(false);
  const [editingSince, setEditingSince] = useState(false);
  const [goalInput, setGoalInput] = useState('');
  const [sinceInput, setSinceInput] = useState('');

  if (allPoints.length === 0) return null;

  const isWeight = metricKey === 'weight';
  const latest = allPoints[allPoints.length - 1];
  const goalWeight = currentUser?.goal_weight;
  const startDate = currentUser?.progress_start_date;

  // Filter by timeframe for period stats
  let periodPoints = allPoints;
  if (timeFrame === 'ytd') {
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);
    periodPoints = allPoints.filter(p => new Date(p.date) >= startOfYear);
  } else if (timeFrame !== 'all') {
    const cutoff = subDays(new Date(), parseInt(timeFrame));
    periodPoints = allPoints.filter(p => new Date(p.date) >= cutoff);
  }

  // Progress since start date
  let progressPoints = allPoints;
  let progressLabel = 'Since first';
  if (startDate) {
    progressPoints = allPoints.filter(p => new Date(p.date) >= new Date(startDate));
    progressLabel = `Since ${format(new Date(startDate), 'MMM d')}`;
  }
  const firstProgress = progressPoints[0];
  const totalChange = firstProgress && latest ? +(latest.value - firstProgress.value).toFixed(1) : 0;

  // Weekly rate
  let weeklyRate = '—';
  if (progressPoints.length >= 2 && firstProgress) {
    const days = differenceInDays(new Date(latest.date), new Date(firstProgress.date));
    if (days > 0) {
      weeklyRate = `${(totalChange / days * 7).toFixed(2)}`;
    }
  }

  // Period stats
  const periodValues = periodPoints.map(p => p.value);
  const min = periodValues.length ? Math.min(...periodValues).toFixed(1) : '—';
  const max = periodValues.length ? Math.max(...periodValues).toFixed(1) : '—';
  const avg = periodValues.length ? (periodValues.reduce((a, b) => a + b, 0) / periodValues.length).toFixed(1) : '—';

  const saveGoal = () => {
    const val = parseFloat(goalInput);
    if (!isNaN(val)) onUpdateUser({ goal_weight: val });
    setEditingGoal(false);
  };

  const saveSince = () => {
    if (sinceInput) onUpdateUser({ progress_start_date: sinceInput });
    setEditingSince(false);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      <div className="bg-slate-50 rounded-lg p-2.5">
        <p className="text-xs text-slate-400">Latest</p>
        <p className="text-sm font-semibold text-slate-900">{latest.value} {metricUnit}</p>
      </div>

      {isWeight && (
        <div className="bg-slate-50 rounded-lg p-2.5">
          <p className="text-xs text-slate-400">Target</p>
          {editingGoal ? (
            <div className="flex items-center gap-1">
              <Input
                type="number"
                step="0.1"
                autoFocus
                value={goalInput}
                onChange={e => setGoalInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveGoal()}
                onBlur={saveGoal}
                className="h-7 text-sm px-1.5"
              />
              <span className="text-xs text-slate-400">{metricUnit}</span>
            </div>
          ) : (
            <button
              onClick={() => { setGoalInput(goalWeight || ''); setEditingGoal(true); }}
              className="text-sm font-semibold text-slate-900 hover:text-indigo-600"
            >
              {goalWeight != null ? `${goalWeight} ${metricUnit}` : 'Set goal'}
            </button>
          )}
        </div>
      )}

      <div className="bg-slate-50 rounded-lg p-2.5">
        <p className="text-xs text-slate-400">{progressLabel}</p>
        {editingSince ? (
          <Input
            type="date"
            autoFocus
            value={sinceInput}
            onChange={e => setSinceInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && saveSince()}
            onBlur={saveSince}
            className="h-7 text-sm px-1.5"
          />
        ) : (
          <button
            onClick={() => { setSinceInput(startDate || ''); setEditingSince(true); }}
            className={`text-sm font-semibold hover:text-indigo-600 ${totalChange < 0 ? 'text-green-600' : totalChange > 0 ? 'text-red-500' : 'text-slate-900'}`}
          >
            {totalChange > 0 ? '+' : ''}{totalChange} {metricUnit}
          </button>
        )}
      </div>

      <div className="bg-slate-50 rounded-lg p-2.5">
        <p className="text-xs text-slate-400">Rate / week</p>
        <p className={`text-sm font-semibold ${weeklyRate === '—' ? 'text-slate-400' : parseFloat(weeklyRate) < 0 ? 'text-green-600' : 'text-red-500'}`}>
          {weeklyRate === '—' ? '—' : `${weeklyRate} ${metricUnit}`}
        </p>
      </div>

      <div className="bg-slate-50 rounded-lg p-2.5">
        <p className="text-xs text-slate-400">Period min</p>
        <p className="text-sm font-semibold text-slate-900">{min} {metricUnit}</p>
      </div>

      <div className="bg-slate-50 rounded-lg p-2.5">
        <p className="text-xs text-slate-400">Period max</p>
        <p className="text-sm font-semibold text-slate-900">{max} {metricUnit}</p>
      </div>

      <div className="bg-slate-50 rounded-lg p-2.5">
        <p className="text-xs text-slate-400">Period avg</p>
        <p className="text-sm font-semibold text-slate-900">{avg} {metricUnit}</p>
      </div>
    </div>
  );
}