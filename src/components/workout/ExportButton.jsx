import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileJson, FileText } from 'lucide-react';
import { toast } from 'sonner';

function flattenExercises(exercises = []) {
  const rows = [];
  for (const ex of exercises) {
    if (ex.exercise_type === 'superset' && ex.superset_exercises?.length) {
      for (const sub of ex.superset_exercises) {
        rows.push({
          name: sub.name,
          type: sub.exercise_type || 'reps',
          sets: ex.sets || '',
          reps: sub.reps || '',
          duration_seconds: sub.duration_seconds || '',
          weight: sub.weight || '',
          rest_seconds: ex.rest || '',
          rest_after_exercise: ex.rest_after_exercise || '',
          notes: sub.notes || '',
          superset_parent: ex.name,
        });
      }
    } else {
      rows.push({
        name: ex.name,
        type: ex.exercise_type || 'reps',
        sets: ex.sets || '',
        reps: ex.reps || '',
        duration_seconds: ex.duration_seconds || '',
        weight: ex.weight || '',
        rest_seconds: ex.rest || '',
        rest_after_exercise: ex.rest_after_exercise || '',
        notes: ex.notes || '',
        superset_parent: '',
      });
    }
  }
  return rows;
}

function exportJSON(workout) {
  const data = {
    name: workout.name,
    description: workout.description || '',
    category: workout.category || '',
    difficulty: workout.difficulty || '',
    duration_minutes: workout.duration_minutes || '',
    body_areas: workout.body_areas || [],
    default_rest_seconds: workout.default_rest || '',
    location_suggestion: workout.location_suggestion || '',
    tips: workout.tips || '',
    exercises: (workout.exercises || []).map(ex => ({
      name: ex.name,
      type: ex.exercise_type,
      sets: ex.sets,
      reps: ex.reps,
      duration_seconds: ex.duration_seconds,
      weight: ex.weight,
      rest_seconds: ex.rest,
      rest_after_exercise: ex.rest_after_exercise,
      notes: ex.notes,
      ...(ex.exercise_type === 'superset' ? { superset_exercises: ex.superset_exercises } : {})
    }))
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  download(blob, `${workout.name}.json`);
}

function exportCSV(workout) {
  const rows = flattenExercises(workout.exercises);
  const headers = ['name', 'type', 'sets', 'reps', 'duration_seconds', 'weight', 'rest_seconds', 'rest_after_exercise', 'notes', 'superset_parent'];
  
  // Meta rows at top
  const meta = [
    `Workout,${escape(workout.name)}`,
    `Description,${escape(workout.description || '')}`,
    `Category,${escape(workout.category || '')}`,
    `Difficulty,${escape(workout.difficulty || '')}`,
    `Duration (min),${workout.duration_minutes || ''}`,
    `Body Areas,${(workout.body_areas || []).join(' | ')}`,
    `Tips,${escape(workout.tips || '')}`,
    '',
    headers.join(','),
    ...rows.map(r => headers.map(h => escape(String(r[h] ?? ''))).join(','))
  ];

  const blob = new Blob([meta.join('\n')], { type: 'text/csv' });
  download(blob, `${workout.name}.csv`);
}

function escape(val) {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ExportButton({ workout, variant = "default" }) {
  const handleJSON = (e) => {
    e.preventDefault();
    e.stopPropagation();
    exportJSON(workout);
    toast.success('Exported as JSON');
  };

  const handleCSV = (e) => {
    e.preventDefault();
    e.stopPropagation();
    exportCSV(workout);
    toast.success('Exported as CSV');
  };

  if (variant === "icon") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
          <Button variant="ghost" size="sm" className="h-8 gap-1 px-2">
            <Download className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem onClick={handleJSON}>
            <FileJson className="w-4 h-4 mr-2" />
            Export as JSON
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleCSV}>
            <FileText className="w-4 h-4 mr-2" />
            Export as CSV
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="w-4 h-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleJSON}>
          <FileJson className="w-4 h-4 mr-2" />
          Export as JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCSV}>
          <FileText className="w-4 h-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}