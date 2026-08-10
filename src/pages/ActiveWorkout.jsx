import React, { useState, useEffect, useCallback, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, Loader2, Check, SkipForward, 
  Clock, Weight, MessageSquare, Pencil, X, Save,
  Timer, Flag, Play, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
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
import UndoToast from '@/components/workout/UndoToast';
import ActiveExerciseTimer from '@/components/workout/ActiveExerciseTimer';
import ExerciseDemoModal from '@/components/workout/ExerciseDemoModal';
import FullScreenTimerModal from '@/components/workout/FullScreenTimerModal';

export default function ActiveWorkout() {
  const urlParams = new URLSearchParams(window.location.search);
  const workoutId = urlParams.get('id');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [currentSubExerciseIndex, setCurrentSubExerciseIndex] = useState(0);
  const [completedSets, setCompletedSets] = useState({});
  const [isResting, setIsResting] = useState(false);
  const [restTime, setRestTime] = useState(0);
  const [maxRestTime, setMaxRestTime] = useState(0);
  const [isExerciseRest, setIsExerciseRest] = useState(false);
  const [restEndsAt, setRestEndsAt] = useState(null);
  const [editingExerciseId, setEditingExerciseId] = useState(null);
  const [editData, setEditData] = useState(null);
  const [localExercises, setLocalExercises] = useState([]);
  
  const [startTime, setStartTime] = useState(() => new Date());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [isRestoringState, setIsRestoringState] = useState(true);
  const [activeStateId, setActiveStateId] = useState(null);
  const activeStateIdRef = useRef(null);
  activeStateIdRef.current = activeStateId;
  
  // Undo state
  const [undoState, setUndoState] = useState(null);
  const [showUndo, setShowUndo] = useState(false);
  
  // Time-based exercise state
  const [isTimerActive, setIsTimerActive] = useState(false);
  
  // Demo modal state
  const [demoExercise, setDemoExercise] = useState(null);
  
  // Full screen timer modal state
  const [showTimerModal, setShowTimerModal] = useState(false);
  
  // Navigation blocker (back button)
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);

  useEffect(() => {
    // Small delay to avoid interfering with React Router's initial navigation
    const timer = setTimeout(() => {
      window.history.pushState(null, '', window.location.href);
    }, 100);

    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
      setShowLeaveDialog(true);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Ref to track latest state for beforeunload flush
  const stateRef = useRef({});
  stateRef.current = {
    started_at: startTime.toISOString(),
    current_exercise_index: currentExerciseIndex,
    current_set: currentSet,
    current_sub_exercise_index: currentSubExerciseIndex,
    completed_sets: completedSets,
    local_exercises: localExercises,
    is_resting: isResting,
    rest_ends_at: restEndsAt ? restEndsAt.toISOString() : null,
    max_rest_time: maxRestTime,
    is_exercise_rest: isExerciseRest
  };

  // Save state on browser refresh/close + warn user
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!isRestoringState && workoutId) {
        saveWorkoutState(stateRef.current);
      }
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
    };
  }, [activeStateId, isRestoringState]);

  const { data: workout, isLoading: workoutLoading } = useQuery({
    queryKey: ['workout', workoutId],
    queryFn: async () => {
      const workouts = await base44.entities.Workout.filter({ id: workoutId });
      return workouts[0];
    },
    enabled: !!workoutId
  });

  // Check for existing active state
  const { data: existingState, isLoading: stateLoading } = useQuery({
    queryKey: ['activeState', workoutId],
    queryFn: async () => {
      const user = await base44.auth.me();
      const states = await base44.entities.ActiveWorkoutState.filter({ 
        workout_id: workoutId,
        created_by_id: user.id 
      });
      return states[0] || null;
    },
    enabled: !!workoutId
  });

  // Restore state or initialize
  useEffect(() => {
    if (stateLoading || workoutLoading) return;
    
    if (existingState) {
      // Restore from saved state
      setStartTime(new Date(existingState.started_at));
      setCurrentExerciseIndex(existingState.current_exercise_index || 0);
      setCurrentSet(existingState.current_set || 1);
      setCurrentSubExerciseIndex(existingState.current_sub_exercise_index || 0);
      setCompletedSets(existingState.completed_sets || {});
      setLocalExercises(existingState.local_exercises || workout?.exercises || []);
      setActiveStateId(existingState.id);

      // Restore rest timer state
      if (existingState.is_resting && existingState.rest_ends_at) {
        const endsAt = new Date(existingState.rest_ends_at);
        const remaining = Math.max(0, Math.ceil((endsAt - new Date()) / 1000));
        if (remaining > 0) {
          setIsResting(true);
          setRestEndsAt(endsAt);
          setRestTime(remaining);
          setMaxRestTime(existingState.max_rest_time || remaining);
          setIsExerciseRest(existingState.is_exercise_rest || false);
        }
      }
    } else if (workout?.exercises) {
      setLocalExercises(workout.exercises);
    }
    setIsRestoringState(false);
  }, [existingState, workout, stateLoading, workoutLoading]);

  // Calculate elapsed time based on start time
  useEffect(() => {
    if (isRestoringState) return;
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((new Date() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime, isRestoringState]);

  const saveWorkoutState = useCallback(async (stateData) => {
    const id = activeStateIdRef.current;
    if (id) {
      return base44.entities.ActiveWorkoutState.update(id, stateData);
    } else {
      const created = await base44.entities.ActiveWorkoutState.create({
        workout_id: workoutId,
        ...stateData
      });
      setActiveStateId(created.id);
      activeStateIdRef.current = created.id;
      return created;
    }
  }, [workoutId]);

  const deleteStateMutation = useMutation({
    mutationFn: async () => {
      if (activeStateId) {
        await base44.entities.ActiveWorkoutState.delete(activeStateId);
      }
    }
  });

  // Save state periodically and on changes
  useEffect(() => {
    if (isRestoringState || !workoutId) return;
    
    const saveState = () => {
      saveWorkoutState({
        started_at: startTime.toISOString(),
        current_exercise_index: currentExerciseIndex,
        current_set: currentSet,
        current_sub_exercise_index: currentSubExerciseIndex,
        completed_sets: completedSets,
        local_exercises: localExercises,
        is_resting: isResting,
        rest_ends_at: restEndsAt ? restEndsAt.toISOString() : null,
        max_rest_time: maxRestTime,
        is_exercise_rest: isExerciseRest
      });
    };

    // Debounce saves
    const timeout = setTimeout(saveState, 500);
    return () => clearTimeout(timeout);
  }, [currentExerciseIndex, currentSet, currentSubExerciseIndex, completedSets, localExercises, isResting, restEndsAt, maxRestTime, isExerciseRest, isRestoringState]);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Workout.update(workoutId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout', workoutId] });
    }
  });

  const createSessionMutation = useMutation({
    mutationFn: (data) => base44.entities.WorkoutSession.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    }
  });

  const exercises = localExercises;
  const currentExercise = exercises[currentExerciseIndex];
  const isSuperset = currentExercise?.exercise_type === 'superset';
  const currentSubExercise = isSuperset && currentExercise?.superset_exercises?.[currentSubExerciseIndex];
  
  const totalSets = exercises.reduce((acc, ex) => acc + (ex.sets || 0), 0);
  const completedTotal = Object.values(completedSets).reduce((acc, sets) => acc + sets.length, 0);
  const progress = totalSets > 0 ? (completedTotal / totalSets) * 100 : 0;

  // Rest timer - based on end timestamp for persistence across refreshes
  useEffect(() => {
    if (!isResting || !restEndsAt) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((restEndsAt - new Date()) / 1000));
      setRestTime(remaining);
      if (remaining === 0) {
        setIsResting(false);
        setIsExerciseRest(false);
        setRestEndsAt(null);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isResting, restEndsAt]);

  const formatElapsedTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateSessionStats = useCallback(() => {
    let totalVolume = 0;
    let totalReps = 0;
    const exercisesCompleted = [];

    exercises.forEach(ex => {
      const setsCompleted = completedSets[ex.id]?.length || 0;
      const repsPerSet = parseInt(ex.reps) || 0;
      const weight = ex.weight || 0;
      
      totalReps += setsCompleted * repsPerSet;
      totalVolume += setsCompleted * repsPerSet * weight;
      
      if (setsCompleted > 0) {
        exercisesCompleted.push({
          name: ex.name,
          sets_completed: setsCompleted,
          total_sets: ex.sets,
          reps: ex.reps,
          weight: ex.weight || 0
        });
      }
    });

    return { totalVolume, totalReps, exercisesCompleted };
  }, [exercises, completedSets]);

  const handleFinishWorkout = async () => {
    // If we're on the last set of the last exercise, complete it first
    const isOnLastExercise = currentExerciseIndex === exercises.length - 1;
    const isOnLastSet = currentSet === currentExercise?.sets;
    const isSuperset = currentExercise?.exercise_type === 'superset';
    const isOnLastSubExercise = !isSuperset || currentSubExerciseIndex === (currentExercise?.superset_exercises?.length || 1) - 1;
    
    let finalCompletedSets = { ...completedSets };
    
    if (isOnLastExercise && isOnLastSet && isOnLastSubExercise && currentExercise) {
      const exerciseId = currentExercise.id;
      if (!finalCompletedSets[exerciseId]) {
        finalCompletedSets[exerciseId] = [];
      }
      // Only add the last set if it's not already counted
      if (!finalCompletedSets[exerciseId].includes(currentSet)) {
        finalCompletedSets[exerciseId] = [...finalCompletedSets[exerciseId], currentSet];
      }
    }
    
    // Recalculate stats with the final completed sets
    let totalVolume = 0;
    let totalReps = 0;
    const exercisesCompleted = [];

    exercises.forEach(ex => {
      const setsCompleted = finalCompletedSets[ex.id]?.length || 0;
      const repsPerSet = parseInt(ex.reps) || 0;
      const weight = ex.weight || 0;
      
      totalReps += setsCompleted * repsPerSet;
      totalVolume += setsCompleted * repsPerSet * weight;
      
      if (setsCompleted > 0) {
        exercisesCompleted.push({
          name: ex.name,
          sets_completed: setsCompleted,
          total_sets: ex.sets,
          reps: ex.reps,
          weight: ex.weight || 0
        });
      }
    });
    
    const finalCompletedTotal = Object.values(finalCompletedSets).reduce((acc, sets) => acc + sets.length, 0);
    const finishedAt = new Date();
    
    await createSessionMutation.mutateAsync({
      workout_id: workoutId,
      workout_name: workout.name,
      started_at: startTime.toISOString(),
      finished_at: finishedAt.toISOString(),
      duration_seconds: elapsedTime,
      completed_sets: finalCompletedTotal,
      total_sets: totalSets,
      total_volume: totalVolume,
      total_reps: totalReps,
      exercises_completed: exercisesCompleted,
      is_complete: finalCompletedTotal >= totalSets
    });

    // Clear the active state
    await deleteStateMutation.mutateAsync();
    queryClient.invalidateQueries({ queryKey: ['activeState'] });

    navigate(createPageUrl(`WorkoutDetail?id=${workoutId}`));
  };

  const handleCompleteSet = useCallback(() => {
    if (!currentExercise) return;
    
    const exerciseId = currentExercise.id;
    const isSuperset = currentExercise.exercise_type === 'superset';
    
    // For supersets, handle sub-exercise progression
    if (isSuperset) {
      const totalSubExercises = currentExercise.superset_exercises?.length || 0;
      
      // If not the last sub-exercise in the superset, move to next sub-exercise
      if (currentSubExerciseIndex < totalSubExercises - 1) {
        setCurrentSubExerciseIndex(currentSubExerciseIndex + 1);
        return;
      }
      
      // Last sub-exercise completed, mark the set as complete
      setCurrentSubExerciseIndex(0);
    }
    
    // Save state for undo — deep copy arrays so push() below doesn't mutate the snapshot
    const undoCompletedSets = {};
    Object.keys(completedSets).forEach(k => {
      undoCompletedSets[k] = [...completedSets[k]];
    });
    setUndoState({
      completedSets: undoCompletedSets,
      currentSet,
      currentExerciseIndex,
      currentSubExerciseIndex,
      exerciseId,
      setNumber: currentSet
    });
    setShowUndo(true);
    
    const newCompletedSets = { ...completedSets };
    
    if (!newCompletedSets[exerciseId]) {
      newCompletedSets[exerciseId] = [];
    }
    newCompletedSets[exerciseId] = [...newCompletedSets[exerciseId], currentSet];
    setCompletedSets(newCompletedSets);

    if (currentSet < currentExercise.sets) {
      const rest = currentExercise.rest || workout?.default_rest || 90;
      const endsAt = new Date(Date.now() + rest * 1000);
      setMaxRestTime(rest);
      setRestTime(rest);
      setRestEndsAt(endsAt);
      setIsResting(true);
      setIsExerciseRest(false);
      setCurrentSet(currentSet + 1);
    } else {
      if (currentExerciseIndex < exercises.length - 1) {
        setCurrentExerciseIndex(currentExerciseIndex + 1);
        setCurrentSet(1);
        setCurrentSubExerciseIndex(0);
        const rest = currentExercise.rest_after_exercise || 120;
        const endsAt = new Date(Date.now() + rest * 1000);
        setMaxRestTime(rest);
        setRestTime(rest);
        setRestEndsAt(endsAt);
        setIsResting(true);
        setIsExerciseRest(true);
      } else {
        setShowFinishDialog(true);
      }
    }
  }, [currentExercise, currentSet, completedSets, currentExerciseIndex, currentSubExerciseIndex, exercises, workout]);

  const handleUndo = useCallback(() => {
    if (!undoState) return;
    
    setCompletedSets(undoState.completedSets);
    setCurrentSet(undoState.currentSet);
    setCurrentExerciseIndex(undoState.currentExerciseIndex);
    setCurrentSubExerciseIndex(undoState.currentSubExerciseIndex || 0);
    setIsResting(false);
    setRestTime(0);
    setRestEndsAt(null);
    setIsExerciseRest(false);
    setShowUndo(false);
    setUndoState(null);
  }, [undoState]);

  const handleTimerComplete = useCallback(() => {
    setIsTimerActive(false);
    handleCompleteSet();
  }, [handleCompleteSet]);

  const handleSkipRest = () => {
    setIsResting(false);
    setRestTime(0);
    setRestEndsAt(null);
    setIsExerciseRest(false);
  };

  const handleExerciseClick = (index) => {
    if (editingExerciseId) return;
    setCurrentExerciseIndex(index);
    setCurrentSubExerciseIndex(0);
    const completedCount = completedSets[exercises[index]?.id]?.length || 0;
    setCurrentSet(Math.min(completedCount + 1, exercises[index]?.sets || 1));
    // Don't reset timer when switching exercises - let it continue
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

  const getCompletedSetsCount = (exerciseId) => {
    return completedSets[exerciseId]?.length || 0;
  };

  const isExerciseComplete = (exercise) => {
    return getCompletedSetsCount(exercise.id) >= exercise.sets;
  };

  const isLoading = workoutLoading || stateLoading || isRestoringState;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-white mx-auto mb-2" />
          <p className="text-slate-400 text-sm">Loading workout...</p>
        </div>
      </div>
    );
  }

  if (!workout || exercises.length === 0) {
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
    <div className="min-h-screen bg-slate-900 text-white pb-40">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur border-b border-slate-800">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link to={createPageUrl(`WorkoutDetail?id=${workoutId}`)}>
              <Button variant="ghost" size="icon" className="rounded-full text-white hover:bg-slate-800">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            
            <div className="text-center flex-1">
              <p className="text-sm text-slate-400">{workout.name}</p>
              <div className="flex items-center justify-center gap-2 mt-1">
                <Badge className="bg-green-600 text-white">
                  <Timer className="w-3 h-3 mr-1" />
                  {formatElapsedTime(elapsedTime)}
                </Badge>
                <Badge variant="outline" className="border-slate-600 text-slate-400">
                  {completedTotal}/{totalSets} sets
                </Badge>
              </div>
            </div>
            
            <Button 
              variant="ghost" 
              size="sm"
              className="text-red-400 hover:text-red-300 hover:bg-red-900/30"
              onClick={() => setShowFinishDialog(true)}
            >
              <Flag className="w-4 h-4 mr-1" />
              Finish
            </Button>
          </div>
          
          <Progress value={progress} className="mt-3 h-1.5 bg-slate-800" />
        </div>
      </header>

      {/* Rest Timer - Floating */}
      <AnimatePresence>
        {isResting && currentExercise && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="sticky top-[100px] z-10 px-4 pt-3"
          >
            <div 
              className={`max-w-2xl mx-auto rounded-2xl p-4 transition-colors duration-300 ${
                isLastTenSeconds 
                  ? 'bg-red-600' 
                  : 'bg-slate-800 border border-slate-700'
              } ${isLastTenSeconds ? 'animate-pulse' : ''}`}
            >
              <div className="flex items-center gap-3">
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
                
                <div className="flex-1 min-w-0">
                  <p className={`text-xs ${isLastTenSeconds ? 'text-red-100' : 'text-slate-400'}`}>
                    {isExerciseRest ? 'Rest Between Exercises' : 'Rest Between Sets'}
                  </p>
                  <p className="text-white text-sm font-medium truncate">
                    Next: {isSuperset && currentSubExercise ? currentSubExercise.name : currentExercise.name} - Set {currentSet}
                  </p>
                </div>
                
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
                  <div 
                    className="absolute left-0 top-0 bottom-0 w-1"
                    style={{ backgroundColor: isComplete ? '#22c55e' : (workout.color || '#6366f1') }}
                  />
                  
                  <div className="p-4 pl-5">
                    {isEditing ? (
                      <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-500 text-white">
                            #{index + 1}
                          </span>
                          {editData.exercise_type !== 'superset' && (
                            <Input
                              value={editData.name}
                              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                              className="bg-slate-600 border-slate-500 text-white h-8"
                              placeholder="Exercise name"
                            />
                          )}
                        </div>

                        {/* Superset editing */}
                        {editData.exercise_type === 'superset' ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-xs text-slate-400">Superset Exercises</label>
                            </div>
                            {(editData.superset_exercises || []).map((subEx, subIdx) => (
                              <div key={subEx.id} className="bg-slate-800 border border-slate-600 rounded p-2 space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-slate-400">#{subIdx + 1}</span>
                                  <Input
                                    value={subEx.name}
                                    onChange={(e) => {
                                      const newSubs = [...editData.superset_exercises];
                                      newSubs[subIdx] = { ...subEx, name: e.target.value };
                                      setEditData({ ...editData, superset_exercises: newSubs });
                                    }}
                                    className="bg-slate-700 border-slate-500 text-white h-7 text-sm flex-1"
                                    placeholder="Exercise name"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <Button
                                    type="button" size="sm"
                                    className={`h-7 text-xs ${subEx.exercise_type !== 'time' ? 'bg-slate-500 text-white' : 'bg-slate-700 text-slate-300'}`}
                                    onClick={(e) => { e.stopPropagation(); const newSubs = [...editData.superset_exercises]; newSubs[subIdx] = { ...subEx, exercise_type: 'reps' }; setEditData({ ...editData, superset_exercises: newSubs }); }}
                                  >Reps</Button>
                                  <Button
                                    type="button" size="sm"
                                    className={`h-7 text-xs ${subEx.exercise_type === 'time' ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-300'}`}
                                    onClick={(e) => { e.stopPropagation(); const newSubs = [...editData.superset_exercises]; newSubs[subIdx] = { ...subEx, exercise_type: 'time' }; setEditData({ ...editData, superset_exercises: newSubs }); }}
                                  >Time</Button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  {subEx.exercise_type === 'time' ? (
                                    <div>
                                      <label className="text-xs text-slate-400">Duration (s)</label>
                                      <Input type="number" value={subEx.duration_seconds || 30}
                                        onChange={(e) => { const newSubs = [...editData.superset_exercises]; newSubs[subIdx] = { ...subEx, duration_seconds: parseInt(e.target.value) || 30 }; setEditData({ ...editData, superset_exercises: newSubs }); }}
                                        className="bg-slate-700 border-slate-500 text-white h-7" />
                                    </div>
                                  ) : (
                                    <div>
                                      <label className="text-xs text-slate-400">Reps</label>
                                      <Input value={subEx.reps || ''}
                                        onChange={(e) => { const newSubs = [...editData.superset_exercises]; newSubs[subIdx] = { ...subEx, reps: e.target.value }; setEditData({ ...editData, superset_exercises: newSubs }); }}
                                        className="bg-slate-700 border-slate-500 text-white h-7" />
                                    </div>
                                  )}
                                  <div>
                                    <label className="text-xs text-slate-400">Weight (kg)</label>
                                    <Input type="number" value={subEx.weight || ''}
                                      onChange={(e) => { const newSubs = [...editData.superset_exercises]; newSubs[subIdx] = { ...subEx, weight: parseFloat(e.target.value) || 0 }; setEditData({ ...editData, superset_exercises: newSubs }); }}
                                      className="bg-slate-700 border-slate-500 text-white h-7" />
                                  </div>
                                </div>
                                <div>
                                  <label className="text-xs text-slate-400">Notes</label>
                                  <Input value={subEx.notes || ''} placeholder="Optional notes"
                                    onChange={(e) => { const newSubs = [...editData.superset_exercises]; newSubs[subIdx] = { ...subEx, notes: e.target.value }; setEditData({ ...editData, superset_exercises: newSubs }); }}
                                    className="bg-slate-700 border-slate-500 text-white h-7" />
                                </div>
                                <div>
                                  <label className="text-xs text-slate-400">YouTube Video URL</label>
                                  <Input value={subEx.demo_video || ''} placeholder="https://youtube.com/..."
                                    onChange={(e) => { const newSubs = [...editData.superset_exercises]; newSubs[subIdx] = { ...subEx, demo_video: e.target.value }; setEditData({ ...editData, superset_exercises: newSubs }); }}
                                    className="bg-slate-700 border-slate-500 text-white h-7" />
                                </div>
                              </div>
                            ))}
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-xs text-slate-400 block mb-1">Sets (superset)</label>
                                <Input type="number" value={editData.sets}
                                  onChange={(e) => setEditData({ ...editData, sets: parseInt(e.target.value) || 0 })}
                                  className="bg-slate-600 border-slate-500 text-white h-8" />
                              </div>
                              <div>
                                <label className="text-xs text-slate-400 block mb-1">Rest (s)</label>
                                <Input type="number" value={editData.rest || ''}
                                  onChange={(e) => setEditData({ ...editData, rest: parseInt(e.target.value) || 0 })}
                                  className="bg-slate-600 border-slate-500 text-white h-8" />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            {/* Exercise Type Toggle - only if no sets completed */}
                            {getCompletedSetsCount(editData.id) === 0 && (
                              <div className="grid grid-cols-2 gap-2">
                                <Button
                                  type="button" variant={editData.exercise_type !== 'time' ? 'default' : 'outline'} size="sm"
                                  className={`flex items-center justify-center gap-2 ${editData.exercise_type !== 'time' ? 'bg-slate-500 text-white hover:bg-slate-400' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                                  onClick={(e) => { e.stopPropagation(); setEditData({ ...editData, exercise_type: 'reps' }); }}
                                >Rep-based</Button>
                                <Button
                                  type="button" variant={editData.exercise_type === 'time' ? 'default' : 'outline'} size="sm"
                                  className={`flex items-center justify-center gap-2 ${editData.exercise_type === 'time' ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                                  onClick={(e) => { e.stopPropagation(); setEditData({ ...editData, exercise_type: 'time' }); }}
                                >Time-based</Button>
                              </div>
                            )}
                            
                            <div className="grid grid-cols-4 gap-2">
                              <div>
                                <label className="text-xs text-slate-400 block mb-1">Sets</label>
                                <Input type="number" value={editData.sets}
                                  onChange={(e) => setEditData({ ...editData, sets: parseInt(e.target.value) || 0 })}
                                  className="bg-slate-600 border-slate-500 text-white h-8" />
                              </div>
                              {editData.exercise_type === 'time' ? (
                                <div>
                                  <label className="text-xs text-slate-400 block mb-1">Duration (s)</label>
                                  <Input type="number" value={editData.duration_seconds || 30}
                                    onChange={(e) => setEditData({ ...editData, duration_seconds: parseInt(e.target.value) || 30 })}
                                    className="bg-slate-600 border-slate-500 text-white h-8" />
                                </div>
                              ) : (
                                <div>
                                  <label className="text-xs text-slate-400 block mb-1">Reps</label>
                                  <Input value={editData.reps}
                                    onChange={(e) => setEditData({ ...editData, reps: e.target.value })}
                                    className="bg-slate-600 border-slate-500 text-white h-8" />
                                </div>
                              )}
                              <div>
                                <label className="text-xs text-slate-400 block mb-1">Rest (s)</label>
                                <Input type="number" value={editData.rest || ''}
                                  onChange={(e) => setEditData({ ...editData, rest: parseInt(e.target.value) || 0 })}
                                  className="bg-slate-600 border-slate-500 text-white h-8" />
                              </div>
                              <div>
                                <label className="text-xs text-slate-400 block mb-1">Weight</label>
                                <Input type="number" value={editData.weight || ''}
                                  onChange={(e) => setEditData({ ...editData, weight: parseFloat(e.target.value) || 0 })}
                                  className="bg-slate-600 border-slate-500 text-white h-8" />
                              </div>
                            </div>
                            
                            <div>
                              <label className="text-xs text-slate-400 block mb-1">Notes</label>
                              <Input value={editData.notes || ''}
                                onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                                className="bg-slate-600 border-slate-500 text-white h-8"
                                placeholder="Optional notes" />
                            </div>
                          </>
                        )}
                        
                        <div className="flex justify-end gap-2 pt-2">
                          <Button
                            size="sm" variant="ghost"
                            className="text-slate-300 hover:text-white hover:bg-slate-600"
                            onClick={handleCancelEdit}
                          >
                            <X className="w-4 h-4 mr-1" />Cancel
                          </Button>
                          <Button
                            size="sm"
                            className="bg-blue-500 hover:bg-blue-600 text-white"
                            onClick={handleSaveEdit}
                          >
                            <Save className="w-4 h-4 mr-1" />Save
                          </Button>
                        </div>
                      </div>
                    ) : (
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
                            {exercise.exercise_type === 'superset' ? (
                              <div className="flex flex-wrap gap-1">
                                <Badge className={`${isActive ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                                  <Layers className="w-3 h-3 mr-1" />
                                  {exercise.sets} sets
                                </Badge>
                                {(exercise.superset_exercises || []).map((subEx, subIdx) => (
                                  <button
                                    key={subIdx}
                                    onClick={(e) => { e.stopPropagation(); setDemoExercise(subEx); }}
                                    className="flex items-center gap-1 group/sub"
                                  >
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${isActive ? 'bg-white/20 group-hover/sub:bg-white/30' : 'bg-slate-600 group-hover/sub:bg-slate-500'}`}>
                                      <Play className="w-2.5 h-2.5 text-white" />
                                    </div>
                                    <Badge variant="outline" className={`text-xs ${
                                      isActive && currentSubExerciseIndex === subIdx
                                        ? 'border-white text-white'
                                        : 'border-slate-600 text-slate-400'
                                    }`}>
                                      {subEx.name}: {subEx.exercise_type === 'time' ? `${subEx.duration_seconds}s` : `${subEx.reps} reps`}
                                    </Badge>
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDemoExercise(exercise);
                                }}
                                className="flex items-center gap-1.5 group/demo"
                              >
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                                  isActive 
                                    ? 'bg-white/20 group-hover/demo:bg-white/30' 
                                    : 'bg-slate-600 group-hover/demo:bg-slate-500'
                                }`}>
                                  <Play className="w-3 h-3 text-white" />
                                </div>
                                <Badge className={`${
                                  isActive ? 'bg-white text-slate-900' : 'bg-slate-700 text-white'
                                }`}>
                                  {exercise.sets} × {exercise.exercise_type === 'time' ? `${exercise.duration_seconds || 30}s` : exercise.reps}
                                </Badge>
                              </button>
                            )}
                            
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
      {currentExercise && (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur border-t border-slate-800 p-4 z-20">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1">
                <p className="text-sm text-slate-400">Current Exercise</p>
                {isSuperset && currentSubExercise ? (
                  <div>
                    <p className="text-white font-semibold flex items-center gap-1">
                      <Layers className="w-4 h-4 text-purple-400" />
                      {currentSubExercise.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      Exercise {currentSubExerciseIndex + 1} of {currentExercise.superset_exercises?.length}
                    </p>
                  </div>
                ) : (
                  <p className="text-white font-semibold">{currentExercise.name}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-400">Set</p>
                <p className="text-white font-semibold">{currentSet} of {currentExercise.sets}</p>
              </div>
            </div>
            
            {currentSet === currentExercise.sets && currentExerciseIndex === exercises.length - 1 && (!isSuperset || currentSubExerciseIndex === (currentExercise.superset_exercises?.length || 1) - 1) ? (
              <Button
                size="lg"
                className="w-full h-14 text-lg bg-green-600 text-white hover:bg-green-700 shadow-xl"
                onClick={() => setShowFinishDialog(true)}
                disabled={isResting}
              >
                <Flag className="w-5 h-5 mr-2" />
                Finish Workout
              </Button>
            ) : isSuperset && currentSubExercise ? (
              currentSubExercise.exercise_type === 'time' ? (
                <Button
                  size="lg"
                  className="w-full h-14 text-lg bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-600 text-white hover:opacity-90 shadow-xl"
                  onClick={() => setShowTimerModal(true)}
                >
                  <Play className="w-5 h-5 mr-2" />
                  Start Timer ({currentSubExercise.duration_seconds}s)
                </Button>
              ) : (
                <Button
                  size="lg"
                  className="w-full h-14 text-lg bg-purple-600 text-white hover:bg-purple-700 shadow-xl"
                  onClick={handleCompleteSet}
                  disabled={isResting}
                >
                  <Check className="w-5 h-5 mr-2" />
                  Complete ({currentSubExercise.reps} reps)
                </Button>
              )
            ) : currentExercise.exercise_type === 'time' ? (
              <Button
                size="lg"
                className="w-full h-14 text-lg bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 text-white hover:opacity-90 shadow-xl"
                onClick={() => setShowTimerModal(true)}
              >
                <Play className="w-5 h-5 mr-2" />
                Start Timer
              </Button>
            ) : (
              <Button
                size="lg"
                className="w-full h-14 text-lg bg-white text-slate-900 hover:bg-slate-100 shadow-xl"
                onClick={handleCompleteSet}
                disabled={isResting}
              >
                <Check className="w-5 h-5 mr-2" />
                Complete Set {currentSet}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Exercise Demo Modal */}
      <ExerciseDemoModal
        open={!!demoExercise}
        onClose={() => setDemoExercise(null)}
        exercise={demoExercise}
      />

      {/* Full Screen Timer Modal */}
      <FullScreenTimerModal
        open={showTimerModal}
        exercise={isSuperset && currentSubExercise ? currentSubExercise : currentExercise}
        currentSet={currentSet}
        totalSets={currentExercise?.sets || 0}
        workout={workout}
        onComplete={handleCompleteSet}
        onClose={() => setShowTimerModal(false)}
      />

      {/* Undo Toast */}
      <UndoToast
        show={showUndo}
        message={`Set ${undoState?.setNumber} completed`}
        onUndo={handleUndo}
        onDismiss={() => {
          setShowUndo(false);
          setUndoState(null);
        }}
      />

      {/* Leave Workout Warning Dialog */}
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent className="bg-slate-800 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Leave workout?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Your workout is still in progress. What would you like to do?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
            <AlertDialogCancel className="bg-slate-700 text-white border-slate-600 hover:bg-slate-600 sm:mr-auto"
              onClick={() => setShowLeaveDialog(false)}
            >
              Stay
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-slate-600 hover:bg-slate-500"
              onClick={() => {
                setShowLeaveDialog(false);
                navigate(createPageUrl(`WorkoutDetail?id=${workoutId}`));
              }}
            >
              Save & Leave
            </AlertDialogAction>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={async () => {
                setShowLeaveDialog(false);
                await deleteStateMutation.mutateAsync();
                navigate(createPageUrl(`WorkoutDetail?id=${workoutId}`));
              }}
            >
              Cancel Workout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Finish Workout Dialog */}
      <AlertDialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
        <AlertDialogContent className="bg-slate-800 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Finish Workout?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              You've completed {completedTotal} of {totalSets} sets in {formatElapsedTime(elapsedTime)}.
              {completedTotal < totalSets && " Some sets are incomplete."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-700 text-white border-slate-600 hover:bg-slate-600">
              Continue Workout
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-green-600 hover:bg-green-700"
              onClick={handleFinishWorkout}
            >
              <Flag className="w-4 h-4 mr-2" />
              Finish Workout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}