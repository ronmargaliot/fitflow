import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ActiveExerciseTimer({ 
  duration, 
  onComplete, 
  isActive,
  onStart,
  onPause 
}) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    setTimeLeft(duration);
    setIsRunning(false);
  }, [duration]);

  useEffect(() => {
    if (!isRunning || !isActive) return;
    
    if (timeLeft <= 0) {
      setIsRunning(false);
      onComplete?.();
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, isActive, onComplete]);

  const handleStart = () => {
    setIsRunning(true);
    onStart?.();
  };

  const handlePause = () => {
    setIsRunning(false);
    onPause?.();
  };

  const handleReset = () => {
    setTimeLeft(duration);
    setIsRunning(false);
  };

  const progress = duration > 0 ? ((duration - timeLeft) / duration) * 100 : 0;
  const isLastTen = timeLeft <= 10 && timeLeft > 0;

  return (
    <motion.div 
      className={`rounded-2xl p-6 transition-colors duration-300 ${
        isRunning 
          ? isLastTen 
            ? 'bg-red-500' 
            : 'bg-green-500' 
          : 'bg-slate-700'
      }`}
      animate={isLastTen && isRunning ? { scale: [1, 1.02, 1] } : {}}
      transition={{ repeat: Infinity, duration: 0.5 }}
    >
      <div className="text-center">
        <p className="text-sm text-white/80 mb-2">
          {isRunning ? (isLastTen ? 'Almost done!' : 'Active Time') : 'Ready'}
        </p>
        
        <div className="relative w-32 h-32 mx-auto mb-4">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-white/20"
            />
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              className="text-white"
              style={{
                strokeDasharray: 351.86,
                strokeDashoffset: 351.86 - (351.86 * progress / 100),
                transition: 'stroke-dashoffset 0.3s'
              }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl font-bold font-mono text-white">
              {timeLeft}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3">
          {isRunning ? (
            <Button
              size="lg"
              className="bg-white/20 hover:bg-white/30 text-white"
              onClick={handlePause}
            >
              <Pause className="w-5 h-5 mr-2" />
              Pause
            </Button>
          ) : (
            <Button
              size="lg"
              className="bg-white text-slate-900 hover:bg-white/90"
              onClick={handleStart}
            >
              <Play className="w-5 h-5 mr-2" />
              {timeLeft < duration ? 'Resume' : 'Start'}
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="text-white hover:bg-white/20"
            onClick={handleReset}
          >
            <RotateCcw className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}