import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Filter, X, ChevronDown } from 'lucide-react';

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
  const [open, setOpen] = useState(false);
  const hasActiveFilters = filters.category || filters.bodyArea || filters.difficulty || (filters.sortBy && filters.sortBy !== 'recent');
  const activeCount = [filters.category, filters.bodyArea, filters.difficulty, filters.sortBy !== 'recent' ? 'sort' : null].filter(Boolean).length;

  const clearFilters = () => {
    onFilterChange({ category: '', bodyArea: '', difficulty: '', sortBy: 'recent' });
  };

  const FilterSelects = () => (
    <>
      <Select 
        value={filters.category || ''} 
        onValueChange={(v) => onFilterChange({ ...filters, category: v })}
      >
        <SelectTrigger className="w-full sm:w-[130px] h-9 text-sm">
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
        <SelectTrigger className="w-full sm:w-[130px] h-9 text-sm">
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
        <SelectTrigger className="w-full sm:w-[130px] h-9 text-sm">
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
        <SelectTrigger className="w-full sm:w-[130px] h-9 text-sm">
          <SelectValue placeholder="Sort By" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="recent">Most Recent</SelectItem>
          <SelectItem value="popular">Most Copied</SelectItem>
          <SelectItem value="liked">Most Liked</SelectItem>
          <SelectItem value="name">Name A-Z</SelectItem>
        </SelectContent>
      </Select>
    </>
  );

  return (
    <>
      {/* Mobile: Popover */}
      <div className="sm:hidden flex items-center gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9">
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {activeCount > 0 && (
                <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center bg-slate-900">
                  {activeCount}
                </Badge>
              )}
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-3" align="start">
            <div className="space-y-3">
              <FilterSelects />
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="w-full text-slate-500"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear All
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>
        
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-slate-500 h-9"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Desktop: Inline */}
      <div className="hidden sm:flex items-center gap-2 overflow-x-auto pb-1">
        <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
        <FilterSelects />
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
    </>
  );
}

export { CATEGORIES, BODY_AREAS, DIFFICULTIES };