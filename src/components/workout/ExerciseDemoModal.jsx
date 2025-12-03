import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Clock, Weight, Timer, Hash } from 'lucide-react';

// Common exercise demo GIFs - you can replace with your own
const EXERCISE_DEMOS = {
  // Chest
  'push-up': 'https://media.giphy.com/media/5t9IcXiBCyw60/giphy.gif',
  'push-ups': 'https://media.giphy.com/media/5t9IcXiBCyw60/giphy.gif',
  'pushup': 'https://media.giphy.com/media/5t9IcXiBCyw60/giphy.gif',
  'pushups': 'https://media.giphy.com/media/5t9IcXiBCyw60/giphy.gif',
  'bench press': 'https://media.giphy.com/media/EDj9DOzpgCMFO/giphy.gif',
  'chest press': 'https://media.giphy.com/media/EDj9DOzpgCMFO/giphy.gif',
  
  // Back
  'pull-up': 'https://media.giphy.com/media/3o6gDRECSyhSLsMXgA/giphy.gif',
  'pull-ups': 'https://media.giphy.com/media/3o6gDRECSyhSLsMXgA/giphy.gif',
  'pullup': 'https://media.giphy.com/media/3o6gDRECSyhSLsMXgA/giphy.gif',
  'pullups': 'https://media.giphy.com/media/3o6gDRECSyhSLsMXgA/giphy.gif',
  'lat pulldown': 'https://media.giphy.com/media/3o6gDRECSyhSLsMXgA/giphy.gif',
  'row': 'https://media.giphy.com/media/l0HlQoTnQkLInmdnq/giphy.gif',
  'rows': 'https://media.giphy.com/media/l0HlQoTnQkLInmdnq/giphy.gif',
  'bent over row': 'https://media.giphy.com/media/l0HlQoTnQkLInmdnq/giphy.gif',
  
  // Legs
  'squat': 'https://media.giphy.com/media/1qfKN8Dt0CRdCRxz9q/giphy.gif',
  'squats': 'https://media.giphy.com/media/1qfKN8Dt0CRdCRxz9q/giphy.gif',
  'lunge': 'https://media.giphy.com/media/l3q2Ip7FrmPE3CIXS/giphy.gif',
  'lunges': 'https://media.giphy.com/media/l3q2Ip7FrmPE3CIXS/giphy.gif',
  'deadlift': 'https://media.giphy.com/media/xT8qBeEqnpdMbIbtVS/giphy.gif',
  'leg press': 'https://media.giphy.com/media/l0HlQGPFttBSWWPE4/giphy.gif',
  
  // Core
  'plank': 'https://media.giphy.com/media/xT8qAZcty5f0BEm2lO/giphy.gif',
  'crunch': 'https://media.giphy.com/media/l3q2XhOEYPDlC4lfW/giphy.gif',
  'crunches': 'https://media.giphy.com/media/l3q2XhOEYPDlC4lfW/giphy.gif',
  'sit-up': 'https://media.giphy.com/media/l3q2XhOEYPDlC4lfW/giphy.gif',
  'sit-ups': 'https://media.giphy.com/media/l3q2XhOEYPDlC4lfW/giphy.gif',
  'situp': 'https://media.giphy.com/media/l3q2XhOEYPDlC4lfW/giphy.gif',
  'situps': 'https://media.giphy.com/media/l3q2XhOEYPDlC4lfW/giphy.gif',
  'mountain climber': 'https://media.giphy.com/media/l378p3tgDNkFk1xPW/giphy.gif',
  'mountain climbers': 'https://media.giphy.com/media/l378p3tgDNkFk1xPW/giphy.gif',
  
  // Arms
  'bicep curl': 'https://media.giphy.com/media/7YCC7VL1onX5m/giphy.gif',
  'bicep curls': 'https://media.giphy.com/media/7YCC7VL1onX5m/giphy.gif',
  'curl': 'https://media.giphy.com/media/7YCC7VL1onX5m/giphy.gif',
  'curls': 'https://media.giphy.com/media/7YCC7VL1onX5m/giphy.gif',
  'tricep dip': 'https://media.giphy.com/media/l0MYyv6UK0Bd4DE76/giphy.gif',
  'tricep dips': 'https://media.giphy.com/media/l0MYyv6UK0Bd4DE76/giphy.gif',
  'dip': 'https://media.giphy.com/media/l0MYyv6UK0Bd4DE76/giphy.gif',
  'dips': 'https://media.giphy.com/media/l0MYyv6UK0Bd4DE76/giphy.gif',
  
  // Shoulders
  'shoulder press': 'https://media.giphy.com/media/3ohc10VvaxTv9aWRRC/giphy.gif',
  'overhead press': 'https://media.giphy.com/media/3ohc10VvaxTv9aWRRC/giphy.gif',
  'lateral raise': 'https://media.giphy.com/media/26ufq8k6RuyKjRXgs/giphy.gif',
  'lateral raises': 'https://media.giphy.com/media/26ufq8k6RuyKjRXgs/giphy.gif',
  
  // Cardio
  'burpee': 'https://media.giphy.com/media/23hPPMRgPxbNBlPQe3/giphy.gif',
  'burpees': 'https://media.giphy.com/media/23hPPMRgPxbNBlPQe3/giphy.gif',
  'jumping jack': 'https://media.giphy.com/media/l0HlNcbVIbPVBSEYo/giphy.gif',
  'jumping jacks': 'https://media.giphy.com/media/l0HlNcbVIbPVBSEYo/giphy.gif',
  'high knees': 'https://media.giphy.com/media/l378p3tgDNkFk1xPW/giphy.gif',
  'jump rope': 'https://media.giphy.com/media/3oKIPavRPgJYaNI97W/giphy.gif',
};

function findDemoUrl(exerciseName) {
  const normalized = exerciseName.toLowerCase().trim();
  
  // Direct match
  if (EXERCISE_DEMOS[normalized]) {
    return EXERCISE_DEMOS[normalized];
  }
  
  // Partial match
  for (const [key, url] of Object.entries(EXERCISE_DEMOS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return url;
    }
  }
  
  return null;
}

export default function ExerciseDemoModal({ open, onClose, exercise }) {
  if (!exercise) return null;
  
  const demoUrl = exercise.demo_image || exercise.demo_video || findDemoUrl(exercise.name);
  const isTimeBased = exercise.exercise_type === 'time';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            {exercise.name}
            {isTimeBased && (
              <Badge className="bg-green-600 text-white">
                <Timer className="w-3 h-3 mr-1" />
                Timed
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Demo Animation */}
          <div className="relative aspect-video bg-slate-100 rounded-lg overflow-hidden">
            {demoUrl ? (
              <img 
                src={demoUrl} 
                alt={`${exercise.name} demo`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                <div className="text-center p-4">
                  <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center mx-auto mb-3">
                    {isTimeBased ? <Timer className="w-8 h-8" /> : <Hash className="w-8 h-8" />}
                  </div>
                  <p className="text-sm">No demo available</p>
                  <p className="text-xs mt-1">You can add one when editing</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Exercise Details */}
          <div className="flex flex-wrap gap-2">
            <Badge className={`${isTimeBased ? 'bg-green-600' : 'bg-slate-900'} text-white`}>
              {exercise.sets} × {isTimeBased ? `${exercise.duration_seconds || 30}s` : exercise.reps}
            </Badge>
            
            {exercise.rest && (
              <Badge variant="outline">
                <Clock className="w-3 h-3 mr-1" />
                {exercise.rest}s rest
              </Badge>
            )}
            
            {exercise.weight > 0 && (
              <Badge variant="outline">
                <Weight className="w-3 h-3 mr-1" />
                {exercise.weight}kg
              </Badge>
            )}
          </div>
          
          {/* Notes/Instructions */}
          {exercise.notes && (
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-sm text-slate-600">{exercise.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}