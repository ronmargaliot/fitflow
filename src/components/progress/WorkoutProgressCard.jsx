import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dumbbell, TrendingUp, Clock, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';

export default function WorkoutProgressCard({ workout, sessions }) {
  const workoutSessions = sessions.filter(s => s.workout_id === workout.id);
  
  if (workoutSessions.length === 0) return null;

  // Calculate stats
  const totalSessions = workoutSessions.length;
  const avgDuration = Math.round(
    workoutSessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0) / totalSessions / 60
  );
  const totalVolume = workoutSessions.reduce((acc, s) => acc + (s.total_volume || 0), 0);
  const completionRate = Math.round(
    (workoutSessions.filter(s => s.is_complete).length / totalSessions) * 100
  );

  // Progress data for chart (last 10 sessions)
  const progressData = workoutSessions
    .slice(0, 10)
    .reverse()
    .map((s, i) => ({
      name: format(new Date(s.started_at), 'MM/dd'),
      volume: s.total_volume || 0,
      sets: s.completed_sets || 0
    }));

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: workout.color || '#6366f1' }}
            />
            {workout.name}
          </CardTitle>
          <Badge variant="secondary">{totalSessions} sessions</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-2 bg-slate-50 rounded-lg">
            <Clock className="w-4 h-4 mx-auto text-slate-400 mb-1" />
            <p className="text-lg font-bold text-slate-900">{avgDuration}m</p>
            <p className="text-xs text-slate-500">Avg Duration</p>
          </div>
          <div className="text-center p-2 bg-slate-50 rounded-lg">
            <BarChart3 className="w-4 h-4 mx-auto text-slate-400 mb-1" />
            <p className="text-lg font-bold text-slate-900">{(totalVolume/1000).toFixed(1)}k</p>
            <p className="text-xs text-slate-500">Total Volume</p>
          </div>
          <div className="text-center p-2 bg-slate-50 rounded-lg">
            <TrendingUp className="w-4 h-4 mx-auto text-slate-400 mb-1" />
            <p className="text-lg font-bold text-slate-900">{completionRate}%</p>
            <p className="text-xs text-slate-500">Completion</p>
          </div>
        </div>

        {progressData.length > 1 && (
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progressData}>
                <XAxis dataKey="name" tick={false} axisLine={false} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '12px'
                  }}
                  formatter={(value) => [`${value.toLocaleString()} kg`, 'Volume']}
                />
                <Line 
                  type="monotone" 
                  dataKey="volume" 
                  stroke={workout.color || '#6366f1'} 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}