import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { format, subDays, subMonths } from 'date-fns';

export default function VolumeChart({ sessions, timeRange = 'month' }) {
  const getVolumeData = () => {
    const data = [];
    let days = 7;
    
    if (timeRange === 'month') days = 30;
    else if (timeRange === '3months') days = 90;
    else if (timeRange === 'year') days = 365;
    else if (timeRange === 'all') days = 365;

    const groupBy = days > 30 ? 'week' : 'day';
    
    if (groupBy === 'day') {
      for (let i = days - 1; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const daySessions = sessions.filter(s => 
          format(new Date(s.started_at), 'yyyy-MM-dd') === dateStr
        );
        data.push({
          name: format(date, days > 14 ? 'MM/dd' : 'EEE'),
          volume: daySessions.reduce((acc, s) => acc + (s.total_volume || 0), 0),
          sessions: daySessions.length
        });
      }
    } else {
      // Group by week
      const weeks = Math.ceil(days / 7);
      for (let i = weeks - 1; i >= 0; i--) {
        const weekStart = subDays(new Date(), i * 7 + 6);
        const weekEnd = subDays(new Date(), i * 7);
        const weekSessions = sessions.filter(s => {
          const sessionDate = new Date(s.started_at);
          return sessionDate >= weekStart && sessionDate <= weekEnd;
        });
        data.push({
          name: format(weekStart, 'MM/dd'),
          volume: weekSessions.reduce((acc, s) => acc + (s.total_volume || 0), 0),
          sessions: weekSessions.length
        });
      }
    }
    
    return data;
  };

  const volumeData = getVolumeData();

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-600" />
          Volume Over Time
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={volumeData}>
              <defs>
                <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: 'none', 
                  borderRadius: '8px',
                  color: 'white'
                }}
                formatter={(value) => [`${value.toLocaleString()} kg`, 'Volume']}
              />
              <Area 
                type="monotone" 
                dataKey="volume" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                fill="url(#volumeGradient)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}