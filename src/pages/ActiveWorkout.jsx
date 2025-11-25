import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, Loader2, Check, SkipForward, 
  Clock, Weight, MessageSquare, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ActiveWorkout() {
  const urlParams = new URLSearchParams(window.location.search);
  const workoutId = urlParams.get('id');
  const navigate = useNavigate();
  
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [completedSets, setCompletedSets] = useState({});
  const [isResting, setIsResting] = useState(false);
  const [restTime, setRestTime] = useState(0);
  const [maxRestTime, setMaxRestTime] = useState(0);

  const { data: workout, isLoading } = useQuery({
    queryKey: ['workout', workoutId],
    queryFn: async () => {
      const workouts = await base44.entities.Workout.filter({ id: workoutId });
      return workouts[0];
    },
    enabled: !!workoutId
  });

  const exercises = workout?.exercises || [];
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
      // More sets to do, start rest
      const rest = currentExercise.rest || workout?.default_rest || 90;
      setMaxRestTime(rest);
      setRestTime(rest);
      setIsResting(true);
      setCurrentSet(currentSet + 1);
    } else {
      // All sets done for this exercise
      if (currentExerciseIndex < exercises.length - 1) {
        // Move to next exercise
        setCurrentExerciseIndex(currentExerciseIndex + 1);
        setCurrentSet(1);
        const nextExercise = exercises[currentExerciseIndex + 1];
        const rest = nextExercise?.rest || workout?.default_rest || 90;
        setMaxRestTime(rest);
        setRestTime(rest);
        setIsResting(true);
      } else {
        // Workout complete!
        navigate(createPageUrl(`WorkoutDetail?id=${workoutId}`));
      }
    }
  }, [currentExercise, currentSet, completedSets, currentExerciseIndex, exercises, navigate, workoutId, workout]);

  const handleSkipRest = () => {
    setIsResting(false);
    setRestTime(0);
  };

  const handleExerciseClick = (index) => {
    setCurrentExerciseIndex(index);
    setCurrentSet(1);
    setIsResting(false);
    setRestTime(0);
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
            className="sticky top-[85px] z-10 px-4 py-3"
          >
            <div 
              className={`max-w-2xl mx-auto rounded-2xl p-4 transition-colors duration-300 ${
                isLastTenSeconds 
                  ? 'bg-red-600 animate-pulse' 
                  : 'bg-slate-800 border border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative w-14 h-14">
                    <svg className="w-full h-full transform -rotate-90">
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
                      <span className={`text-lg font-bold font-mono ${isLastTenSeconds ? 'text-white' : ''}`}>
                        {restTime}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <p className={`text-sm ${isLastTenSeconds ? 'text-red-100' : 'text-slate-400'}`}>
                      Rest Time
                    </p>
                    <p className="text-white font-medium">
                      Next: {currentExercise.name} - Set {currentSet}
                    </p>
                  </div>
                </div>
                
                <Button
                  size="sm"
                  variant={isLastTenSeconds ? "secondary" : "outline"}
                  className={isLastTenSeconds 
                    ? "bg-white text-red-600 hover:bg-red-50" 
                    : "border-slate-600 text-white hover:bg-slate-700"
                  }
                  onClick={handleSkipRest}
                >
                  <SkipForward className="w-4 h-4 mr-1" />
                  Skip
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
            
            return (
              <motion.div
                key={exercise.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card 
                  className={`relative overflow-hidden transition-all duration-300 cursor-pointer ${
                    isActive 
                      ? 'bg-slate-800 border-2 border-white ring-4 ring-white/20' 
                      : isComplete
                      ? 'bg-slate-800/50 border-slate-700 opacity-60'
                      : 'bg-slate-800/80 border-slate-700 hover:border-slate-600'
                  }`}
                  onClick={() => handleExerciseClick(index)}
                >
                  {/* Color indicator */}
                  <div 
                    className="absolute left-0 top-0 bottom-0 w-1"
                    style={{ backgroundColor: isComplete ? '#22c55e' : (workout.color || '#6366f1') }}
                  />
                  
                  <div className="p-4 pl-5">
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