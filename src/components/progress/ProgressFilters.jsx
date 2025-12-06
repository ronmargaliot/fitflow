import React from 'react';
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Filter, X } from 'lucide-react';

const TIME_RANGES = [
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: '3months', label: 'Last 3 Months' },
  { value: 'year', label: 'This Year' },
  { value: 'all', label: 'All Time' },
];

export default function ProgressFilters({ filters, onFilterChange, workouts = [], exercises = [] }) {
  const hasActiveFilters = filters.timeRange !== 'all' || filters.workoutId || filters.exerciseName;

  const clearFilters = () => {
    onFilterChange({ timeRange: 'all', workoutId: '', exerciseName: '' });
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Filter className="w-4 h-4 text-slate-400" />
      
      <Select 
        value={filters.timeRange || 'all'} 
        onValueChange={(v) => onFilterChange({ ...filters, timeRange: v })}
      >
        <SelectTrigger className="w-[140px] h-9 text-sm">
          <Calendar className="w-4 h-4 mr-2 text-slate-400" />
          <SelectValue placeholder="Time Range" />
        </SelectTrigger>
        <SelectContent>
          {TIME_RANGES.map((range) => (
            <SelectItem key={range.value} value={range.value}>{range.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {workouts.length > 0 && (
        <Select 
          value={filters.workoutId || ''} 
          onValueChange={(v) => onFilterChange({ ...filters, workoutId: v, exerciseName: '' })}
        >
          <SelectTrigger className="w-[160px] h-9 text-sm">
            <SelectValue placeholder="All Workouts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>All Workouts</SelectItem>
            {workouts.map((w) => (
              <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {exercises.length > 0 && (
        <Select 
          value={filters.exerciseName || ''} 
          onValueChange={(v) => onFilterChange({ ...filters, exerciseName: v })}
        >
          <SelectTrigger className="w-[160px] h-9 text-sm">
            <SelectValue placeholder="All Exercises" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>All Exercises</SelectItem>
            {exercises.map((ex) => (
              <SelectItem key={ex} value={ex}>{ex}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="text-slate-500 hover:text-slate-700 h-9"
        >
          <X className="w-4 h-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}