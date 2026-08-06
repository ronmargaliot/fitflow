import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Dumbbell, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ResumeWorkoutButton({ currentUser }) {
  const queryClient = useQueryClient();

  const { data: activeState } = useQuery({
    queryKey: ['activeState-all', currentUser?.email],
    queryFn: async () => {
      const states = await base44.entities.ActiveWorkoutState.filter({
        created_by: currentUser?.email
      });
      return states[0] || null;
    },
    enabled: !!currentUser?.email,
    refetchInterval: 15000
  });

  const handleCancelWorkout = async () => {
    if (!activeState) return;
    await base44.entities.ActiveWorkoutState.delete(activeState.id);
    queryClient.invalidateQueries({ queryKey: ['activeState-all'] });
  };

  return (
    <AnimatePresence>
      {activeState && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="flex items-center gap-2 bg-slate-900 text-white rounded-full shadow-2xl border border-slate-700 pl-4 pr-1.5 py-1.5">
            <Dumbbell className="w-4 h-4 text-green-400 flex-shrink-0" />
            <span className="text-sm font-medium whitespace-nowrap">
              Workout in progress
            </span>
            <Link to={createPageUrl(`ActiveWorkout?id=${activeState.workout_id}`)}>
              <Button
                size="sm"
                className="h-7 rounded-full bg-green-600 hover:bg-green-700 px-3 text-xs"
              >
                Resume
              </Button>
            </Link>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 rounded-full p-0 text-slate-400 hover:text-red-400 hover:bg-slate-800"
              onClick={handleCancelWorkout}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}