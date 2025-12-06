import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Dumbbell } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

export default function ExerciseProgressCard({ exerciseName, sessions }) {
  if (!sessions || sessions.length === 0) return null;

  // Extract exercise data from sessions
  const exerciseData = sessions
    .map(session => {
      const exercise = session.exercises_completed?.find(ex => 
        ex.name.toLowerCase().includes(exerciseName.toLowerCase())
      );
      if (!exercise) return null;
      
      return {
        date: new Date(session.finished_at || session.started_at),
        volume: (exercise.sets_completed || 0) * (parseInt(exercise.reps) || 0) * (exercise.weight || 0),
        weight: exercise.weight || 0,
        reps: parseInt(exercise.reps) || 0,
        sets: exercise.sets_completed || 0
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.date - b.date);

  if (exerciseData.length === 0) return null;

  const latest = exerciseData[exerciseData.length - 1];
  const previous = exerciseData.length > 1 ? exerciseData[exerciseData.length - 2] : null;
  
  // Calculate trends
  const weightTrend = previous ? latest.weight - previous.weight : 0;
  const volumeTrend = previous ? latest.volume - previous.volume : 0;

  // Personal records
  const maxWeight = Math.max(...exerciseData.map(d => d.weight));
  const maxVolume = Math.max(...exerciseData.map(d => d.volume));
  const totalSets = exerciseData.reduce((sum, d) => sum + d.sets, 0);

  // Chart data (last 10 sessions)
  const chartData = exerciseData.slice(-10).map(d => ({
    date: format(d.date, 'MMM d'),
    volume: d.volume,
    weight: d.weight
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Dumbbell className="w-5 h-5 text-indigo-600" />
          {exerciseName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-2 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-500 mb-1">Sessions</p>
            <p className="text-lg font-bold text-slate-900">{exerciseData.length}</p>
          </div>
          <div className="text-center p-2 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-500 mb-1">Total Sets</p>
            <p className="text-lg font-bold text-slate-900">{totalSets}</p>
          </div>
          <div className="text-center p-2 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-500 mb-1">Max Weight</p>
            <p className="text-lg font-bold text-indigo-600">{maxWeight}kg</p>
          </div>
        </div>

        {/* Latest Performance */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">Latest Session</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="font-mono">
              {latest.sets} × {latest.reps} @ {latest.weight}kg
            </Badge>
            {weightTrend !== 0 && (
              <Badge className={weightTrend > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                {weightTrend > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                {Math.abs(weightTrend)}kg
              </Badge>
            )}
          </div>
        </div>

        {/* Progress Chart */}
        {chartData.length > 1 && (
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  formatter={(value, name) => [
                    name === 'volume' ? `${value} total` : `${value}kg`,
                    name === 'volume' ? 'Volume' : 'Weight'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="weight" 
                  stroke="#6366f1" 
                  strokeWidth={2}
                  dot={{ fill: '#6366f1', r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Personal Record */}
        <div className="p-3 bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg border border-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-amber-700 font-medium">Personal Record</p>
              <p className="text-lg font-bold text-amber-900">{maxWeight}kg</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-amber-700 font-medium">Max Volume</p>
              <p className="text-lg font-bold text-amber-900">{maxVolume}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}