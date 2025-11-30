import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, X } from 'lucide-react';

const CATEGORIES = [
  { value: 'strength', label: 'Strength' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'hiit', label: 'HIIT' },
  { value: 'yoga', label: 'Yoga' },
  { value: 'stretching', label: 'Stretching' },
  { value: 'calisthenics', label: 'Calisthenics' },
  { value: 'crossfit', label: 'CrossFit' },
  { value: 'other', label: 'Other' },
];

const BODY_AREAS = [
  { value: 'chest', label: 'Chest' },
  { value: 'back', label: 'Back' },
  { value: 'legs', label: 'Legs' },
  { value: 'arms', label: 'Arms' },
  { value: 'shoulders', label: 'Shoulders' },
  { value: 'core', label: 'Core' },
  { value: 'full_body', label: 'Full Body' },
];

const DIFFICULTIES = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

export default function WorkoutFilters({ filters, onFilterChange }) {
  const hasActiveFilters = filters.category || filters.bodyArea || filters.difficulty || filters.sortBy !== 'recent';

  const clearFilters = () => {
    onFilterChange({ category: '', bodyArea: '', difficulty: '', sortBy: 'recent' });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <div className="flex items-center gap-2 text-slate-500">
          <Filter className="w-4 h-4" />
        </div>
        
        <Select 
          value={filters.category || ''} 
          onValueChange={(v) => onFilterChange({ ...filters, category: v })}
        >
          <SelectTrigger className="w-[130px] h-9 text-sm">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>All Categories</SelectItem>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select 
          value={filters.bodyArea || ''} 
          onValueChange={(v) => onFilterChange({ ...filters, bodyArea: v })}
        >
          <SelectTrigger className="w-[130px] h-9 text-sm">
            <SelectValue placeholder="Body Area" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>All Areas</SelectItem>
            {BODY_AREAS.map((area) => (
              <SelectItem key={area.value} value={area.value}>{area.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select 
          value={filters.difficulty || ''} 
          onValueChange={(v) => onFilterChange({ ...filters, difficulty: v })}
        >
          <SelectTrigger className="w-[130px] h-9 text-sm">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>All Levels</SelectItem>
            {DIFFICULTIES.map((diff) => (
              <SelectItem key={diff.value} value={diff.value}>{diff.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select 
          value={filters.sortBy || 'recent'} 
          onValueChange={(v) => onFilterChange({ ...filters, sortBy: v })}
        >
          <SelectTrigger className="w-[130px] h-9 text-sm">
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most Recent</SelectItem>
            <SelectItem value="popular">Most Popular</SelectItem>
            <SelectItem value="name">Name A-Z</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-slate-500 hover:text-slate-700 flex-shrink-0"
          >
            <X className="w-4 h-4 mr-1" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}

export { CATEGORIES, BODY_AREAS, DIFFICULTIES };