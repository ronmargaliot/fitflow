import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Share2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function ShareButton({ workout, onShareComplete, variant = "default" }) {
  const [isSharing, setIsSharing] = useState(false);

  const generateShareContent = () => {
    const appUrl = window.location.origin;
    const workoutUrl = `${appUrl}/#/WorkoutDetail?id=${workout.id}`;
    
    // Text summary as fallback
    const exerciseList = workout.exercises
      ?.slice(0, 5)
      .map(ex => {
        if (ex.exercise_type === 'time') {
          return `• ${ex.name}: ${ex.sets} sets × ${ex.duration_seconds}s`;
        }
        return `• ${ex.name}: ${ex.sets} sets × ${ex.reps} reps`;
      })
      .join('\n') || '';
    
    const moreExercises = workout.exercises?.length > 5 
      ? `\n• ...and ${workout.exercises.length - 5} more exercises` 
      : '';

    const text = `Check out this ${workout.difficulty} ${workout.category} workout: "${workout.name}"

${workout.description || ''}

Duration: ${workout.duration_minutes || 'N/A'} min
Exercises:
${exerciseList}${moreExercises}

${workoutUrl}`;

    return {
      title: workout.name,
      text: text,
      url: workoutUrl
    };
  };

  const handleShare = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsSharing(true);
    
    try {
      const shareData = generateShareContent();

      // Check if native share is available
      if (navigator.share) {
        await navigator.share(shareData);
        
        // Increment share count
        await base44.entities.Workout.update(workout.id, {
          share_count: (workout.share_count || 0) + 1
        });
        
        if (onShareComplete) {
          onShareComplete();
        }
        
        toast.success('Shared successfully!');
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareData.text);
        toast.success('Link copied to clipboard!');
        
        // Still increment share count
        await base44.entities.Workout.update(workout.id, {
          share_count: (workout.share_count || 0) + 1
        });
        
        if (onShareComplete) {
          onShareComplete();
        }
      }
    } catch (err) {
      // User cancelled or error occurred
      if (err.name !== 'AbortError') {
        console.error('Share failed:', err);
        toast.error('Share failed');
      }
    } finally {
      setIsSharing(false);
    }
  };

  if (variant === "icon") {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleShare}
        disabled={isSharing}
        className="h-8 gap-1 px-2"
      >
        <Share2 className="w-4 h-4" />
        <span className="text-xs">{workout.share_count || 0}</span>
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleShare}
      disabled={isSharing}
      className="gap-2"
    >
      <Share2 className="w-4 h-4" />
      Share
      <span className="text-xs text-slate-500">({workout.share_count || 0})</span>
    </Button>
  );
}