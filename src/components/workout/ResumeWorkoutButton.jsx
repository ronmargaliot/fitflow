import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Dumbbell, X } from 'lucide-react';

export default function ResumeWorkoutButton({ currentUser }) {
  const queryClient = useQueryClient();

  const { data: activeState } = useQuery({
    queryKey: ['activeState-all', currentUser?.id],
    queryFn: async () => {
      const states = await base44.entities.ActiveWorkoutState.filter({
        created_by_id: currentUser?.id
      });
      return states[0] || null;
    },
    enabled: !!currentUser?.id,
    refetchInterval: 15000
  });

  const handleCancelWorkout = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!activeState) return;
    await base44.entities.ActiveWorkoutState.delete(activeState.id);
    queryClient.invalidateQueries({ queryKey: ['activeState-all'] });
  };

  if (!activeState) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-slate-900 border-b border-slate-700 shadow-lg">
      <div className="max-w-2xl mx-auto flex items-center gap-2 px-3 py-2">
        <Link
          to={createPageUrl(`ActiveWorkout?id=${activeState.workout_id}`)}
          className="flex items-center gap-2 flex-1 min-w-0"
        >
          <Dumbbell className="w-5 h-5 text-green-400 flex-shrink-0" />
          <span className="text-sm font-semibold text-white truncate">
            Workout in progress
          </span>
        </Link>
        <Link to={createPageUrl(`ActiveWorkout?id=${activeState.workout_id}`)} className="flex-shrink-0">
          <span className="inline-flex items-center justify-center h-9 px-4 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold">
            Resume
          </span>
        </Link>
        <button
          type="button"
          className="flex items-center justify-center h-9 w-9 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 flex-shrink-0"
          onClick={handleCancelWorkout}
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}