import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Plus, Dumbbell, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import WorkoutCard from '@/components/workout/WorkoutCard';
import EditWorkoutModal from '@/components/workout/EditWorkoutModal';

export default function Home() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: workouts = [], isLoading } = useQuery({
    queryKey: ['workouts'],
    queryFn: () => base44.entities.Workout.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Workout.create({ ...data, exercises: [] }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    }
  });

  const handleCreateWorkout = (data) => {
    createMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-10 backdrop-blur-xl bg-white/80 border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                <Dumbbell className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Workout Tracker</h1>
                <p className="text-xs text-slate-500">Track your progress</p>
              </div>
            </div>
            
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="bg-slate-900 hover:bg-slate-800 shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Workout
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : workouts.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Dumbbell className="w-10 h-10 text-slate-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">No workouts yet</h2>
            <p className="text-slate-500 mb-6">Create your first workout to get started</p>
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="bg-slate-900 hover:bg-slate-800"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Workout
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {workouts.map((workout, index) => (
                <motion.div
                  key={workout.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link to={createPageUrl(`WorkoutDetail?id=${workout.id}`)}>
                    <WorkoutCard workout={workout} />
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      <EditWorkoutModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleCreateWorkout}
      />
    </div>
  );
}