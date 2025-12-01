import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from 'lucide-react';
import { format, subDays, startOfWeek, addDays } from 'date-fns';

export default function FrequencyCalendar({ sessions }) {
  // Get last 12 weeks of data
  const weeks = 12;
  const today = new Date();
  const startDate = startOfWeek(subDays(today, weeks * 7));
  
  // Create a map of dates to session counts
  const sessionCounts = {};
  sessions.forEach(s => {
    const dateStr = format(new Date(s.started_at), 'yyyy-MM-dd');
    sessionCounts[dateStr] = (sessionCounts[dateStr] || 0) + 1;
  });

  // Generate calendar grid
  const calendarData = [];
  for (let week = 0; week < weeks; week++) {
    const weekData = [];
    for (let day = 0; day < 7; day++) {
      const date = addDays(startDate, week * 7 + day);
      const dateStr = format(date, 'yyyy-MM-dd');
      const count = sessionCounts[dateStr] || 0;
      const isFuture = date > today;
      weekData.push({
        date: dateStr,
        count,
        isFuture,
        label: format(date, 'MMM d')
      });
    }
    calendarData.push(weekData);
  }

  const getIntensityClass = (count, isFuture) => {
    if (isFuture) return 'bg-slate-100';
    if (count === 0) return 'bg-slate-200';
    if (count === 1) return 'bg-green-300';
    if (count === 2) return 'bg-green-400';
    return 'bg-green-500';
  };

  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-green-600" />
          Workout Frequency
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-1">
          <div className="flex flex-col gap-1 mr-2">
            {dayLabels.map((day, i) => (
              <div key={i} className="w-3 h-3 text-[10px] text-slate-400 flex items-center">
                {i % 2 === 1 ? day : ''}
              </div>
            ))}
          </div>
          <div className="flex gap-1 overflow-x-auto">
            {calendarData.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map((day, dayIndex) => (
                  <div
                    key={dayIndex}
                    className={`w-3 h-3 rounded-sm ${getIntensityClass(day.count, day.isFuture)}`}
                    title={`${day.label}: ${day.count} workout${day.count !== 1 ? 's' : ''}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 mt-4 text-xs text-slate-500">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-sm bg-slate-200" />
            <div className="w-3 h-3 rounded-sm bg-green-300" />
            <div className="w-3 h-3 rounded-sm bg-green-400" />
            <div className="w-3 h-3 rounded-sm bg-green-500" />
          </div>
          <span>More</span>
        </div>
      </CardContent>
    </Card>
  );
}