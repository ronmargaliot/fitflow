import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, Loader2, Check, SkipForward, 
  Pause, Play, RotateCcw, Clock, Weight, ChevronLeft, ChevronRight
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
  const [isPaused, setIsPaused] = useState(false);

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
    if (isResting && restTime > 0 && !isPaused) {
      interval = setInterval(() => {
        setRestTime((prev) => prev - 1);
      }, 1000);
    } else if (restTime === 0 && isResting) {
      setIsResting(false);
    }
    return () => clearInterval(interval);
  }, [isResting, restTime, isPaused]);

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
      setIsResting(true);
      setRestTime(currentExercise.rest || 90);
      setCurrentSet(currentSet + 1);
    } else {
      // All sets done for this exercise
      if (currentExerciseIndex < exercises.length - 1) {
        // Move to next exercise
        setCurrentExerciseIndex(currentExerciseIndex + 1);
        setCurrentSet(1);
        setIsResting(true);
        setRestTime(exercises[currentExerciseIndex + 1]?.rest || 90);
      } else {
        // Workout complete!
        navigate(createPageUrl(`WorkoutDetail?id=${workoutId}`));
      }
    }
  }, [currentExercise, currentSet, completedSets, currentExerciseIndex, exercises, navigate, workoutId]);

  const handleSkipRest = () => {
    setIsResting(false);
    setRestTime(0);
  };

  const handlePrevExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(currentExerciseIndex - 1);
      setCurrentSet(1);
      setIsResting(false);
    }
  };

  const handleNextExercise = () => {
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      setCurrentSet(1);
      setIsResting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

  const completedSetsForExercise = completedSets[currentExercise.id]?.length || 0;

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur border-b border-slate-800">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to={createPageUrl(`WorkoutDetail?id=${workoutId}`)}>
              <Button variant="ghost" size="icon" className="rounded-full text-white hover:bg-slate-800">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            
            <div className="text-center">
              <p className="text-sm text-slate-400">{workout.name}</p>
              <p className="text-xs text-slate-500">{completedTotal} / {totalSets} sets</p>
            </div>
            
            <div className="w-10" />
          </div>
          
          <Progress value={progress} className="mt-3 h-1 bg-slate-800" />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {isResting ? (
            <motion.div
              key="rest"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center"
            >
              <p className="text-slate-400 uppercase tracking-wider text-sm mb-4">Rest Time</p>
              
              <div className="relative w-48 h-48 mx-auto mb-8">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-slate-800"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    className="text-white"
                    style={{
                      strokeDasharray: 553,
                      strokeDashoffset: 553 - (553 * (restTime / (currentExercise.rest || 90)))
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-5xl font-bold font-mono">{formatTime(restTime)}</span>
                </div>
              </div>

              <p className="text-slate-400 mb-2">Next up:</p>
              <p className="text-xl font-semibold mb-8">
                {currentExercise.name} - Set {currentSet}
              </p>

              <div className="flex justify-center gap-4">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-slate-700 text-white hover:bg-slate-800"
                  onClick={() => setIsPaused(!isPaused)}
                >
                  {isPaused ? <Play className="w-5 h-5 mr-2" /> : <Pause className="w-5 h-5 mr-2" />}
                  {isPaused ? 'Resume' : 'Pause'}
                </Button>
                
                <Button
                  size="lg"
                  className="bg-white text-slate-900 hover:bg-slate-100"
                  onClick={handleSkipRest}
                >
                  <SkipForward className="w-5 h-5 mr-2" />
                  Skip Rest
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="exercise"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              {/* Exercise Navigation */}
              <div className="flex items-center justify-between mb-6">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-slate-400 hover:text-white hover:bg-slate-800"
                  onClick={handlePrevExercise}
                  disabled={currentExerciseIndex === 0}
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
                
                <span className="text-sm text-slate-400">
                  Exercise {currentExerciseIndex + 1} of {exercises.length}
                </span>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-slate-400 hover:text-white hover:bg-slate-800"
                  onClick={handleNextExercise}
                  disabled={currentExerciseIndex === exercises.length - 1}
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>
              </div>

              {/* Current Exercise */}
              <Card className="bg-slate-800 border-slate-700 p-6 mb-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {currentExercise.name}
                  </h2>
                  
                  <div className="flex justify-center gap-3 mb-6">
                    <Badge className="bg-white text-slate-900 text-lg px-4 py-1">
                      {currentExercise.sets} × {currentExercise.reps}
                    </Badge>
                    
                    {currentExercise.rest && (
                      <Badge variant="outline" className="text-slate-300 border-slate-600 text-lg px-4 py-1">
                        <Clock className="w-4 h-4 mr-1" />
                        {currentExercise.rest}s
                      </Badge>
                    )}
                    
                    {currentExercise.weight > 0 && (
                      <Badge variant="outline" className="text-slate-300 border-slate-600 text-lg px-4 py-1">
                        <Weight className="w-4 h-4 mr-1" />
                        {currentExercise.weight}kg
                      </Badge>
                    )}
                  </div>
                  
                  {currentExercise.notes && (
                    <p className="text-slate-400 mb-6">💡 {currentExercise.notes}</p>
                  )}

                  {/* Set Indicators */}
                  <div className="flex justify-center gap-2 mb-8">
                    {Array.from({ length: currentExercise.sets }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold transition-all ${
                          completedSetsForExercise > i
                            ? 'bg-green-500 text-white'
                            : currentSet === i + 1
                            ? 'bg-white text-slate-900 ring-4 ring-white/30'
                            : 'bg-slate-700 text-slate-400'
                        }`}
                      >
                        {completedSetsForExercise > i ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          i + 1
                        )}
                      </div>
                    ))}
                  </div>

                  <p className="text-slate-400 mb-4">
                    Set {currentSet} of {currentExercise.sets}
                  </p>
                </div>
              </Card>

              {/* Complete Set Button */}
              <Button
                size="lg"
                className="w-full h-16 text-xl bg-white text-slate-900 hover:bg-slate-100 shadow-xl"
                onClick={handleCompleteSet}
              >
                <Check className="w-6 h-6 mr-2" />
                Complete Set
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}