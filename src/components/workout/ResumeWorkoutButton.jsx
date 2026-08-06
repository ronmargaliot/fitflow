import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, X } from 'lucide-react';

export default function ResumeWorkoutButton({ currentUser }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isCancelling, setIsCancelling] = useState(false);
  const isResumingRef = useRef(false);

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

  const goToWorkout = () => {
    if (!activeState || isResumingRef.current || isCancelling) return;
    isResumingRef.current = true;
    // Force re-render to show pressed state
    setIsCancelling(false);
    navigate(`/ActiveWorkout?id=${activeState.workout_id}`);
  };

  const handleCancelWorkout = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!activeState || isCancelling) return;
    setIsCancelling(true);
    try {
      await base44.entities.ActiveWorkoutState.delete(activeState.id);
      queryClient.invalidateQueries({ queryKey: ['activeState-all'] });
    } catch (err) {
      console.error('Failed to cancel workout:', err);
    } finally {
      setIsCancelling(false);
    }
  };

  if (!activeState) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-slate-900 border-b border-slate-700 shadow-lg">
      <div className="max-w-2xl mx-auto flex items-center gap-2 px-3 py-2">
        <button
          type="button"
          onClick={goToWorkout}
          className="flex items-center gap-2 flex-1 min-w-0 text-left active:opacity-70 transition-opacity"
        >
          <Dumbbell className="w-5 h-5 text-green-400 flex-shrink-0" />
          <span className="text-sm font-semibold text-white truncate">
            Workout in progress
          </span>
        </button>
        <button
          type="button"
          onClick={goToWorkout}
          className="inline-flex items-center justify-center h-11 px-5 rounded-lg bg-green-600 active:bg-green-800 active:scale-95 text-white text-sm font-semibold flex-shrink-0 transition-all"
        >
          Resume
        </button>
        <button
          type="button"
          disabled={isCancelling}
          onClick={handleCancelWorkout}
          className="flex items-center justify-center h-11 w-11 rounded-lg text-slate-400 active:text-red-400 active:bg-slate-800 flex-shrink-0 transition-all disabled:opacity-50"
        >
          {isCancelling ? (
            <div className="w-5 h-5 border-2 border-slate-500 border-t-white rounded-full animate-spin" />
          ) : (
            <X className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
}