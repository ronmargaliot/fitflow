import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, Plus, Loader2, Settings, Trash2,
  Play, MoreVertical, Lock, Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import ExerciseItem from '@/components/workout/ExerciseItem';
import AddExerciseModal from '@/components/workout/AddExerciseModal';
import EditWorkoutModal from '@/components/workout/EditWorkoutModal';

export default function WorkoutDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const workoutId = urlParams.get('id');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [exercises, setExercises] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const user = await base44.auth.me();
      setCurrentUser(user);
    };
    loadUser();
  }, []);

  const { data: workout, isLoading } = useQuery({
    queryKey: ['workout', workoutId],
    queryFn: async () => {
      const workouts = await base44.entities.Workout.filter({ id: workoutId });
      return workouts[0];
    },
    enabled: !!workoutId
  });

  useEffect(() => {
    if (workout?.exercises) {
      setExercises(workout.exercises);
    }
  }, [workout]);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Workout.update(workoutId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout', workoutId] });
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Workout.delete(workoutId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      navigate(createPageUrl('Home'));
    }
  });

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(exercises);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);

    setExercises(items);
    updateMutation.mutate({ exercises: items });
  };

  const handleAddExercise = (exercise) => {
    const newExercises = [...exercises, exercise];
    setExercises(newExercises);
    updateMutation.mutate({ exercises: newExercises });
  };

  const handleUpdateExercise = (index, updatedExercise) => {
    const newExercises = [...exercises];
    newExercises[index] = updatedExercise;
    setExercises(newExercises);
    updateMutation.mutate({ exercises: newExercises });
  };

  const handleDeleteExercise = (index) => {
    const newExercises = exercises.filter((_, i) => i !== index);
    setExercises(newExercises);
    updateMutation.mutate({ exercises: newExercises });
  };

  const handleEditWorkout = (data) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Workout not found</h2>
          <Link to={createPageUrl('Home')}>
            <Button variant="outline">Go back</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = workout.created_by === currentUser?.email;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-10 backdrop-blur-xl bg-white/80 border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to={createPageUrl('Home')}>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: workout.color || '#6366f1' }}
                      />
                      <h1 className="text-xl font-bold text-slate-900">{workout.name}</h1>
                      {!isOwner && (
                        <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                          <Users className="w-3 h-3 mr-1" />
                          Community
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">{exercises.length} exercises</p>
                  </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Link to={createPageUrl(`ActiveWorkout?id=${workoutId}`)}>
                <Button className="bg-slate-900 hover:bg-slate-800 shadow-lg">
                  <Play className="w-4 h-4 mr-2" />
                  Start
                </Button>
              </Link>

              {isOwner ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <MoreVertical className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setShowEditModal(true)}>
                      <Settings className="w-4 h-4 mr-2" />
                      Edit Workout
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-red-600"
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Workout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button variant="ghost" size="icon" className="rounded-full" disabled>
                  <Lock className="w-5 h-5 text-slate-400" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {workout.description && (
          <p className="text-slate-600 mb-6">{workout.description}</p>
        )}

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="exercises">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-3"
              >
                <AnimatePresence>
                  {exercises.map((exercise, index) => (
                    <Draggable key={exercise.id} draggableId={exercise.id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                        >
                          <ExerciseItem
                            exercise={exercise}
                            index={index}
                            onUpdate={isOwner ? (updated) => handleUpdateExercise(index, updated) : null}
                            onDelete={isOwner ? () => handleDeleteExercise(index) : null}
                            dragHandleProps={isOwner ? provided.dragHandleProps : null}
                            workoutColor={workout.color}
                            readOnly={!isOwner}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                </AnimatePresence>
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {isOwner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6"
          >
            <Button
              variant="outline"
              className="w-full border-dashed border-2 h-14"
              onClick={() => setShowAddModal(true)}
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Exercise
            </Button>
          </motion.div>
        )}
      </main>

      <AddExerciseModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddExercise}
        defaultRest={workout.default_rest}
      />

      <EditWorkoutModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        workout={workout}
        onSave={handleEditWorkout}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{workout.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteMutation.mutate()}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}