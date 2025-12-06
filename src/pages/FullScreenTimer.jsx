import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { X, Play, Pause, SkipForward, Volume2, VolumeX } from 'lucide-react';

export default function FullScreenTimer() {
  const urlParams = new URLSearchParams(window.location.search);
  const workoutId = urlParams.get('id');
  const exerciseIndex = parseInt(urlParams.get('exerciseIndex') || '0');
  const startSet = parseInt(urlParams.get('set') || '1');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [currentSet, setCurrentSet] = useState(startSet);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isResting, setIsResting] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [completedSets, setCompletedSets] = useState(startSet - 1);
  const [initialized, setInitialized] = useState(false);

  const { data: workout } = useQuery({
    queryKey: ['workout', workoutId],
    queryFn: async () => {
      const workouts = await base44.entities.Workout.filter({ id: workoutId });
      return workouts[0];
    },
    enabled: !!workoutId
  });

  const exercise = workout?.exercises?.[exerciseIndex];
  const totalSets = exercise?.sets || 0;
  const workDuration = exercise?.duration_seconds || 30;
  const restDuration = exercise?.rest || 15;

  // Initialize timer - only once when exercise loads
  useEffect(() => {
    if (exercise && !initialized) {
      setTimeLeft(workDuration);
      setInitialized(true);
    }
  }, [exercise, workDuration, initialized]);

  // Timer countdown
  useEffect(() => {
    let interval;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            playSound();
            return 0;
          }
          if (prev <= 4) playBeep();
          return prev - 1;
        });
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      handlePhaseComplete();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const playSound = () => {
    if (!soundEnabled) return;
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSh+zfHeijYIGGS56eaYSgwOVKzn77dlHA4+mNr0yHMpBS1+zvLaizUIGGe76+mgUQ0MUKXh8bllHAg7k9jzzn4tBSh+zfHeizUIGWe76+mjUw0NUaXh8bllHAk7lNjy0H4tBSh+zfHeizQIGGa56+mjUw0NUKTg8btlHAk7lNjy0H4tBSh+zfHeizUIGGa66+mjUw0NUKTh8bllHAk7lNjy0H4tBSh+zfHei');
    audio.play().catch(() => {});
  };

  const playBeep = () => {
    if (!soundEnabled) return;
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF');
    audio.play().catch(() => {});
  };

  const handlePhaseComplete = () => {
    if (isResting) {
      // Rest complete, start next work phase
      setIsResting(false);
      setTimeLeft(workDuration);
      setIsActive(true);
    } else {
      // Work phase complete - mark current set as done
      const newCompletedSets = completedSets + 1;
      setCompletedSets(newCompletedSets);
      
      if (currentSet < totalSets) {
        // More sets to go - start rest
        setIsResting(true);
        setTimeLeft(restDuration);
        setCurrentSet(currentSet + 1);
        setIsActive(true);
      } else {
        // Last set complete
        handleExerciseComplete();
      }
    }
  };

  const handleExerciseComplete = () => {
    // Navigate back to active workout
    navigate(createPageUrl(`ActiveWorkout?id=${workoutId}`));
  };

  const handleSkip = () => {
    if (isResting) {
      setTimeLeft(0);
      setIsActive(true);
    } else {
      handlePhaseComplete();
    }
  };

  if (!exercise) {
    return (
      <div className="h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <p>Loading exercise...</p>
        </div>
      </div>
    );
  }

  const progress = isResting 
    ? ((restDuration - timeLeft) / restDuration) * 100
    : ((workDuration - timeLeft) / workDuration) * 100;

  const phaseColor = isResting 
    ? 'from-red-500 to-red-600' 
    : 'from-blue-500 via-purple-500 to-indigo-600';

  const bgColor = isResting ? 'bg-red-500' : 'bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600';

  return (
    <div className={`h-screen ${bgColor} relative overflow-hidden`}>
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute inset-0 opacity-30"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        </motion.div>
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Header */}
        <div className="p-6 flex items-center justify-between">
          <Link to={createPageUrl(`ActiveWorkout?id=${workoutId}`)}>
            <Button variant="ghost" size="icon" className="rounded-full bg-white/20 hover:bg-white/30 text-white">
              <X className="w-6 h-6" />
            </Button>
          </Link>
          
          <div className="text-center">
            <p className="text-white/80 text-sm font-medium">
              Set {currentSet} of {totalSets}
            </p>
          </div>

          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="rounded-full bg-white/20 hover:bg-white/30 text-white"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </Button>
        </div>

        {/* Main timer area */}
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={isResting ? 'rest' : 'work'}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="text-center"
            >
              <motion.h1 
                className="text-white/90 text-3xl font-bold mb-4"
                animate={{ scale: timeLeft <= 3 ? [1, 1.1, 1] : 1 }}
                transition={{ duration: 0.5, repeat: timeLeft <= 3 ? Infinity : 0 }}
              >
                {exercise.name}
              </motion.h1>
              
              <motion.p 
                className="text-white text-7xl md:text-9xl font-bold mb-6"
                animate={{ 
                  scale: timeLeft <= 3 ? [1, 1.15, 1] : 1,
                  color: timeLeft <= 3 ? ['#ffffff', '#ffff00', '#ffffff'] : '#ffffff'
                }}
                transition={{ duration: 0.6, repeat: timeLeft <= 3 ? Infinity : 0 }}
              >
                {timeLeft}
              </motion.p>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-white/70 text-2xl font-semibold uppercase tracking-wider"
              >
                {isResting ? 'Rest' : 'Work'}
              </motion.div>
            </motion.div>
          </AnimatePresence>

          {/* Progress ring */}
          <div className="mt-12 relative">
            <svg className="transform -rotate-90" width="200" height="200">
              <circle
                cx="100"
                cy="100"
                r="90"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="12"
                fill="none"
              />
              <motion.circle
                cx="100"
                cy="100"
                r="90"
                stroke="white"
                strokeWidth="12"
                fill="none"
                strokeLinecap="round"
                initial={{ strokeDasharray: 565.48, strokeDashoffset: 565.48 }}
                animate={{ strokeDashoffset: 565.48 - (565.48 * progress / 100) }}
                transition={{ duration: 0.5 }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-white text-lg font-semibold">
                {Math.round(progress)}%
              </p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="p-6 flex items-center justify-center gap-4">
          <Button
            size="lg"
            onClick={handleSkip}
            className="bg-white/20 hover:bg-white/30 text-white border-2 border-white/30"
          >
            <SkipForward className="w-5 h-5 mr-2" />
            Skip {isResting ? 'Rest' : 'Set'}
          </Button>

          <Button
            size="lg"
            onClick={() => setIsActive(!isActive)}
            className="bg-white text-slate-900 hover:bg-white/90 px-8 h-16 rounded-full shadow-2xl"
          >
            {isActive ? (
              <>
                <Pause className="w-6 h-6 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-6 h-6 mr-2" />
                {timeLeft === 0 ? 'Start' : 'Resume'}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}