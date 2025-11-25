import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, Loader2, Check, SkipForward, 
  Clock, Weight, MessageSquare, Pencil, X, Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ActiveWorkout() {
  const urlParams = new URLSearchParams(window.location.search);
  const workoutId = urlParams.get('id');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [completedSets, setCompletedSets] = useState({});
  const [isResting, setIsResting] = useState(false);
  const [restTime, setRestTime] = useState(0);
  const [maxRestTime, setMaxRestTime] = useState(0);
  const [isExerciseRest, setIsExerciseRest] = useState(false);
  const [editingExerciseId, setEditingExerciseId] = useState(null);
  const [editData, setEditData] = useState(null);
  const [localExercises, setLocalExercises] = useState([]);

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
      setLocalExercises(workout.exercises);
    }
  }, [workout]);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Workout.update(workoutId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout', workoutId] });
    }
  });

  const exercises = localExercises;
  const currentExercise = exercises[currentExerciseIndex];
  
  const totalSets = exercises.reduce((acc, ex) => acc + (ex.sets || 0), 0);
  const completedTotal = Object.values(completedSets).reduce((acc, sets) => acc + sets.length, 0);
  const progress = totalSets > 0 ? (completedTotal / totalSets) * 100 : 0;

  // Rest timer
  useEffect(() => {
    let interval;
    if (isResting && restTime > 0) {
      interval = setInterval(() => {
        setRestTime((prev) => prev - 1);
      }, 1000);
    } else if (restTime === 0 && isResting) {
      setIsResting(false);
      setIsExerciseRest(false);
    }
    return () => clearInterval(interval);
  }, [isResting, restTime]);

  const handleCompleteSet = useCallback(() => {
    const exerciseId = currentExercise.id;
    const newCompletedSets = { ...completedSets };
    
    if (!newCompletedSets[exerciseId]) {
      newCompletedSets[exerciseId] = [];
    }
    newCompletedSets[exerciseId].push(currentSet);
    setCompletedSets(newCompletedSets);

    if (currentSet < currentExercise.sets) {
      // More sets to do, start rest between sets
      const rest = currentExercise.rest || workout?.default_rest || 90;
      setMaxRestTime(rest);
      setRestTime(rest);
      setIsResting(true);
      setIsExerciseRest(false);
      setCurrentSet(currentSet + 1);
    } else {
      // All sets done for this exercise
      if (currentExerciseIndex < exercises.length - 1) {
        // Move to next exercise - use rest between exercises
        setCurrentExerciseIndex(currentExerciseIndex + 1);
        setCurrentSet(1);
        const rest = workout?.rest_between_exercises || 120;
        setMaxRestTime(rest);
        setRestTime(rest);
        setIsResting(true);
        setIsExerciseRest(true);
      } else {
        // Workout complete!
        navigate(createPageUrl(`WorkoutDetail?id=${workoutId}`));
      }
    }
  }, [currentExercise, currentSet, completedSets, currentExerciseIndex, exercises, navigate, workoutId, workout]);

  const handleSkipRest = () => {
    setIsResting(false);
    setRestTime(0);
    setIsExerciseRest(false);
  };

  const handleExerciseClick = (index) => {
    if (editingExerciseId) return;
    setCurrentExerciseIndex(index);
    setCurrentSet(1);
    setIsResting(false);
    setRestTime(0);
    setIsExerciseRest(false);
  };

  const handleStartEdit = (exercise, e) => {
    e.stopPropagation();
    setEditingExerciseId(exercise.id);
    setEditData({ ...exercise });
  };

  const handleSaveEdit = (e) => {
    e.stopPropagation();
    const newExercises = localExercises.map(ex => 
      ex.id === editingExerciseId ? editData : ex
    );
    setLocalExercises(newExercises);
    updateMutation.mutate({ exercises: newExercises });
    setEditingExerciseId(null);
    setEditData(null);
  };

  const handleCancelEdit = (e) => {
    e.stopPropagation();
    setEditingExerciseId(null);
    setEditData(null);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCompletedSetsCount = (exerciseId) => {
    return completedSets[exerciseId]?.length || 0;
  };

  const isExerciseComplete = (exercise) => {
    return getCompletedSetsCount(exercise.id) >= exercise.sets;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  if (!workout || !currentExercise) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-xl font-semibold mb-2">Workout not found</h2>
          <Link to={createPageUrl('Home')}>
            <Button variant="outline">Go back</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isLastTenSeconds = restTime <= 10 && restTime > 0;

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-32">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur border-b border-slate-800">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to={createPageUrl(`WorkoutDetail?id=${workoutId}`)}>
              <Button variant="ghost" size="icon" className="rounded-full text-white hover:bg-slate-800">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            
            <div className="text-center">
              <p className="text-sm text-slate-400">{workout.name}</p>
              <p className="text-xs text-slate-500">{completedTotal} / {totalSets} sets completed</p>
            </div>
            
            <div className="w-10" />
          </div>
          
          <Progress value={progress} className="mt-3 h-1.5 bg-slate-800" />
        </div>
      </header>

      {/* Rest Timer - Floating */}
      <AnimatePresence>
        {isResting && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="sticky top-[85px] z-10 px-4 pt-3"
          >
            <div 
              className={`max-w-2xl mx-auto rounded-2xl p-4 transition-colors duration-300 ${
                isLastTenSeconds 
                  ? 'bg-red-600' 
                  : 'bg-slate-800 border border-slate-700'
              } ${isLastTenSeconds ? 'animate-pulse' : ''}`}
            >
              <div className="flex items-center gap-3">
                {/* Timer circle */}
                <div className="relative w-14 h-14 flex-shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 56 56">
                    <circle
                      cx="28"
                      cy="28"
                      r="24"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      className={isLastTenSeconds ? "text-red-400" : "text-slate-700"}
                    />
                    <circle
                      cx="28"
                      cy="28"
                      r="24"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      strokeLinecap="round"
                      className="text-white"
                      style={{
                        strokeDasharray: 150.8,
                        strokeDashoffset: 150.8 - (150.8 * (restTime / maxRestTime))
                      }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-base font-bold font-mono text-white">
                      {restTime}
                    </span>
                  </div>
                </div>
                
                {/* Text content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-xs ${isLastTenSeconds ? 'text-red-100' : 'text-slate-400'}`}>
                    {isExerciseRest ? 'Rest Between Exercises' : 'Rest Between Sets'}
                  </p>
                  <p className="text-white text-sm font-medium truncate">
                    Next: {currentExercise.name} - Set {currentSet}
                  </p>
                </div>
                
                {/* Skip button */}
                <Button
                  size="sm"
                  className={isLastTenSeconds 
                    ? "bg-white text-red-600 hover:bg-red-50 flex-shrink-0" 
                    : "bg-slate-700 text-white hover:bg-slate-600 flex-shrink-0"
                  }
                  onClick={handleSkipRest}
                >
                  <SkipForward className="w-4 h-4 sm:mr-1" />
                  <span className="hidden sm:inline">Skip</span>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exercise List */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="space-y-3">
          {exercises.map((exercise, index) => {
            const isActive = index === currentExerciseIndex;
            const isComplete = isExerciseComplete(exercise);
            const completedCount = getCompletedSetsCount(exercise.id);
            const isEditing = editingExerciseId === exercise.id;
            
            return (
              <motion.div
                key={exercise.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card 
                  className={`relative overflow-hidden transition-all duration-300 ${
                    isEditing
                      ? 'bg-slate-700 border-2 border-blue-500'
                      : isActive 
                      ? 'bg-slate-800 border-2 border-white ring-4 ring-white/20 cursor-pointer' 
                      : isComplete
                      ? 'bg-slate-800/50 border-slate-700 opacity-60 cursor-pointer'
                      : 'bg-slate-800/80 border-slate-700 hover:border-slate-600 cursor-pointer'
                  }`}
                  onClick={() => !isEditing && handleExerciseClick(index)}
                >
                  {/* Color indicator */}
                  <div 
                    className="absolute left-0 top-0 bottom-0 w-1"
                    style={{ backgroundColor: isComplete ? '#22c55e' : (workout.color || '#6366f1') }}
                  />
                  
                  <div className="p-4 pl-5">
                    {isEditing ? (
                      // Edit Mode
                      <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-500 text-white">
                            #{index + 1}
                          </span>
                          <Input
                            value={editData.name}
                            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                            className="bg-slate-600 border-slate-500 text-white h-8"
                            placeholder="Exercise name"
                          />
                        </div>
                        
                        <div className="grid grid-cols-4 gap-2">
                          <div>
                            <label className="text-xs text-slate-400 block mb-1">Sets</label>
                            <Input
                              type="number"
                              value={editData.sets}
                              onChange={(e) => setEditData({ ...editData, sets: parseInt(e.target.value) || 0 })}
                              className="bg-slate-600 border-slate-500 text-white h-8"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-400 block mb-1">Reps</label>
                            <Input
                              value={editData.reps}
                              onChange={(e) => setEditData({ ...editData, reps: e.target.value })}
                              className="bg-slate-600 border-slate-500 text-white h-8"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-400 block mb-1">Rest (s)</label>
                            <Input
                              type="number"
                              value={editData.rest || ''}
                              onChange={(e) => setEditData({ ...editData, rest: parseInt(e.target.value) || 0 })}
                              className="bg-slate-600 border-slate-500 text-white h-8"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-400 block mb-1">Weight</label>
                            <Input
                              type="number"
                              value={editData.weight || ''}
                              onChange={(e) => setEditData({ ...editData, weight: parseFloat(e.target.value) || 0 })}
                              className="bg-slate-600 border-slate-500 text-white h-8"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-xs text-slate-400 block mb-1">Notes</label>
                          <Input
                            value={editData.notes || ''}
                            onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                            className="bg-slate-600 border-slate-500 text-white h-8"
                            placeholder="Optional notes"
                          />
                        </div>
                        
                        <div className="flex justify-end gap-2 pt-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-slate-300 hover:text-white hover:bg-slate-600"
                            onClick={handleCancelEdit}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            className="bg-blue-500 hover:bg-blue-600 text-white"
                            onClick={handleSaveEdit}
                          >
                            <Save className="w-4 h-4 mr-1" />
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                              isActive ? 'bg-white text-slate-900' : 'bg-slate-700 text-slate-400'
                            }`}>
                              #{index + 1}
                            </span>
                            <h4 className={`font-semibold truncate ${
                              isComplete ? 'text-slate-400 line-through' : 'text-white'
                            }`}>
                              {exercise.name}
                            </h4>
                            {isComplete && (
                              <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                            )}
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className={`${
                              isActive ? 'bg-white text-slate-900' : 'bg-slate-700 text-white'
                            }`}>
                              {exercise.sets} × {exercise.reps}
                            </Badge>
                            
                            {exercise.rest && (
                              <Badge variant="outline" className="text-slate-400 border-slate-600">
                                <Clock className="w-3 h-3 mr-1" />
                                {exercise.rest}s
                              </Badge>
                            )}
                            
                            {exercise.weight > 0 && (
                              <Badge variant="outline" className="text-slate-400 border-slate-600">
                                <Weight className="w-3 h-3 mr-1" />
                                {exercise.weight}kg
                              </Badge>
                            )}
                            
                            {/* Edit button */}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-slate-400 hover:text-white hover:bg-slate-700"
                              onClick={(e) => handleStartEdit(exercise, e)}
                            >
                              <Pencil className="w-3 h-3" />
                            </Button>
                          </div>
                          
                          {exercise.notes && (
                            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" />
                              {exercise.notes}
                            </p>
                          )}
                        </div>
                        
                        {/* Set indicators */}
                        <div className="flex gap-1.5 flex-shrink-0">
                          {Array.from({ length: exercise.sets }).map((_, i) => (
                            <div
                              key={i}
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                                completedCount > i
                                  ? 'bg-green-500 text-white'
                                  : isActive && currentSet === i + 1
                                  ? 'bg-white text-slate-900 ring-2 ring-white/50'
                                  : 'bg-slate-700 text-slate-400'
                              }`}
                            >
                              {completedCount > i ? (
                                <Check className="w-4 h-4" />
                              ) : (
                                i + 1
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </main>

      {/* Sticky Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur border-t border-slate-800 p-4 z-20">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-slate-400">Current Exercise</p>
              <p className="text-white font-semibold">{currentExercise.name}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-400">Set</p>
              <p className="text-white font-semibold">{currentSet} of {currentExercise.sets}</p>
            </div>
          </div>
          
          <Button
            size="lg"
            className="w-full h-14 text-lg bg-white text-slate-900 hover:bg-slate-100 shadow-xl"
            onClick={handleCompleteSet}
            disabled={isResting}
          >
            <Check className="w-5 h-5 mr-2" />
            Complete Set {currentSet}
          </Button>
        </div>
      </div>
    </div>
  );
}