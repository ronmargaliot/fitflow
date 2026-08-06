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
          className="fixed top-3 inset-x-3 z-50 flex justify-center"
        >
          <div className="flex items-center gap-2 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700 pl-4 pr-2 py-2 max-w-full">
            <Link
              to={createPageUrl(`ActiveWorkout?id=${activeState.workout_id}`)}
              className="flex items-center gap-2 flex-shrink-0"
            >
              <Dumbbell className="w-6 h-6 text-green-400 flex-shrink-0" />
              <span className="text-base font-semibold whitespace-nowrap pr-2">
                Workout in progress
              </span>
            </Link>
            <Link to={createPageUrl(`ActiveWorkout?id=${activeState.workout_id}`)} className="flex-shrink-0">
              <Button
                className="h-11 rounded-xl bg-green-600 hover:bg-green-700 px-6 text-base font-semibold"
              >
                Resume
              </Button>
            </Link>
            <Button
              variant="ghost"
              className="h-11 w-11 rounded-xl p-0 text-slate-400 hover:text-red-400 hover:bg-slate-800 flex-shrink-0"
              onClick={handleCancelWorkout}
            >
              <X className="w-6 h-6" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}