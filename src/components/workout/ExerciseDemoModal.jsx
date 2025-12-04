import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Clock, Weight, Timer, Hash, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function ExerciseDemoModal({ open, onClose, exercise }) {
  const [generatedImage, setGeneratedImage] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open && exercise && !exercise.demo_image && !generatedImage) {
      generateDemoImage();
    }
  }, [open, exercise?.id, exercise?.demo_image]);

  const generateDemoImage = async () => {
    if (!exercise) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const result = await base44.integrations.Core.GenerateImage({
        prompt: `Professional fitness instruction illustration showing how to do a ${exercise.name} exercise. Clean, simple step-by-step demonstration with a fit person in athletic wear performing the exercise with proper form. White or light gym background. Educational fitness poster style. Show the movement clearly.`
      });
      
      if (result?.url) {
        setGeneratedImage(result.url);
      }
    } catch (err) {
      console.error('Failed to generate image:', err);
      setError('Could not generate demo');
    } finally {
      setIsGenerating(false);
    }
  };
  
  if (!exercise) return null;
  
  const demoUrl = exercise.demo_image || generatedImage;
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
            {isGenerating ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">Generating demo...</p>
                </div>
              </div>
            ) : demoUrl ? (
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
                  <p className="text-sm">{error || 'No demo available'}</p>
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