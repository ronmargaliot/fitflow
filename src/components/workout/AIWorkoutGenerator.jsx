import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const categories = ['strength', 'cardio', 'hiit', 'yoga', 'stretching', 'calisthenics', 'crossfit', 'other'];
const difficulties = ['beginner', 'intermediate', 'advanced'];
const durations = [15, 30, 45, 60, 90, 120];

export default function AIWorkoutGenerator({ open, onClose, onGenerate, inspirationWorkout = null }) {
  const [generating, setGenerating] = useState(false);
  const [formData, setFormData] = useState({
    goal: '',
    duration: 30,
    difficulty: 'intermediate',
    category: 'strength',
    equipment: '',
    focus: '',
    userNotes: ''
  });

  const handleGenerate = async () => {
    setGenerating(true);
    
    const maxRetries = 3;
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const inspirationText = inspirationWorkout 
          ? `\n\nUse this workout as inspiration (don't copy it exactly, but use similar structure/intensity/style):\n${JSON.stringify(inspirationWorkout, null, 2)}`
          : '';

        const userNotesSection = formData.userNotes 
          ? `\n\n⚠️ IMPORTANT USER REQUIREMENTS (PRIORITIZE THESE):\n${formData.userNotes}\n`
          : '';

        const prompt = `🎯 CRITICAL REQUIREMENT: You MUST generate a complete workout with AT LEAST 6 exercises. The exercises array cannot be empty.

Generate a detailed workout plan with the following requirements:
- Goal: ${formData.goal || 'General fitness'}
- Duration: ${formData.duration} minutes
- Difficulty: ${formData.difficulty}
- Category: ${formData.category}
- Equipment: ${formData.equipment || 'No specific equipment required'}
- Focus areas: ${formData.focus || 'Full body'}
${userNotesSection}${inspirationText}

⚠️ MANDATORY: Create a complete workout with 6-10 exercises. For EACH exercise you MUST provide ALL of these fields:
- name: Exercise name (e.g., "Push-ups", "Barbell Squats")
- sets: Number of sets (3-4)
- reps: Reps per set (e.g., "10-12" or "15")
- exercise_type: Either "reps" or "time"
- duration_seconds: If time-based, duration in seconds (default 30)
- rest: Rest between sets in seconds (45-90)
- weight: Suggested weight in kg (0 if bodyweight)
- notes: Brief form tips (e.g., "Keep back straight")

Also provide workout metadata:
- name: Workout name (creative and motivating)
- description: Brief description
- default_rest: Default rest between sets (60-90 seconds)
- rest_between_exercises: Rest between exercises (90-120 seconds)
- tips: General tips for the workout

⚠️ VALIDATION: The exercises array MUST contain at least 6 complete exercise objects. Do not return an empty array.`;

        const result = await base44.integrations.Core.InvokeLLM({
          prompt,
          response_json_schema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              default_rest: { type: 'number' },
              rest_between_exercises: { type: 'number' },
              tips: { type: 'string' },
              exercises: {
                type: 'array',
                minItems: 6,
                items: {
                  type: 'object',
                  required: ['name', 'sets', 'exercise_type'],
                  properties: {
                    name: { type: 'string' },
                    sets: { type: 'number' },
                    reps: { type: 'string' },
                    exercise_type: { type: 'string', enum: ['reps', 'time'] },
                    duration_seconds: { type: 'number' },
                    rest: { type: 'number' },
                    weight: { type: 'number' },
                    notes: { type: 'string' }
                  }
                }
              }
            },
            required: ['name', 'exercises']
          }
        });

        // Strict validation
        if (!result.exercises || !Array.isArray(result.exercises)) {
          throw new Error('Invalid response: exercises must be an array');
        }
        
        if (result.exercises.length < 3) {
          throw new Error(`Insufficient exercises: got ${result.exercises.length}, need at least 3`);
        }

        // Validate each exercise has required fields
        const validExercises = result.exercises.filter(ex => 
          ex.name && ex.name.trim().length > 0 && 
          ex.sets && ex.sets > 0
        );

        if (validExercises.length < 3) {
          throw new Error(`Not enough valid exercises: got ${validExercises.length}, need at least 3`);
        }

        // Generate YouTube search for each exercise
        const exercisesWithVideos = await Promise.all(
          validExercises.map(async (ex, idx) => {
            let demo_video = '';
            try {
              const searchResult = await base44.integrations.Core.InvokeLLM({
                prompt: `Find a YouTube video URL for demonstrating the exercise: "${ex.name}". Return ONLY the full YouTube URL (https://www.youtube.com/watch?v=...).`,
                add_context_from_internet: true
              });
              if (searchResult && typeof searchResult === 'string' && searchResult.includes('youtube.com')) {
                demo_video = searchResult.trim();
              }
            } catch (err) {
              console.warn(`Failed to find video for ${ex.name}:`, err);
            }

            return {
              ...ex,
              id: `ex_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 9)}`,
              exercise_type: ex.exercise_type || 'reps',
              sets: ex.sets || 3,
              reps: ex.reps || '10',
              rest: ex.rest || 60,
              weight: ex.weight || 0,
              notes: ex.notes || '',
              duration_seconds: ex.exercise_type === 'time' ? (ex.duration_seconds || 30) : undefined,
              demo_video
            };
          })
        );

        const workoutData = {
          name: result.name || 'Custom Workout',
          description: result.description || '',
          default_rest: result.default_rest || 60,
          rest_between_exercises: result.rest_between_exercises || 90,
          tips: result.tips || '',
          category: formData.category,
          difficulty: formData.difficulty,
          duration_minutes: formData.duration,
          exercises: exercisesWithVideos,
          color: getColorForCategory(formData.category),
          is_public: false
        };

        // Final validation before success
        if (workoutData.exercises.length < 3) {
          throw new Error('Workout validation failed: insufficient exercises');
        }

        onGenerate(workoutData);
        onClose();
        return; // Success!
        
      } catch (error) {
        console.error(`Attempt ${attempt}/${maxRetries} failed:`, error);
        lastError = error;
        
        if (attempt < maxRetries) {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
        }
      }
    }
    
    // All retries failed
    setGenerating(false);
    alert(`Failed to generate workout after ${maxRetries} attempts. ${lastError?.message || 'Please try again with different parameters.'}`);
  };

  const getColorForCategory = (category) => {
    const colors = {
      strength: '#ef4444',
      cardio: '#3b82f6',
      hiit: '#f59e0b',
      yoga: '#8b5cf6',
      stretching: '#10b981',
      calisthenics: '#ec4899',
      crossfit: '#f97316',
      other: '#6366f1'
    };
    return colors[category] || '#6366f1';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            {inspirationWorkout ? 'Generate Inspired Workout' : 'AI Workout Generator'}
          </DialogTitle>
          <DialogDescription>
            {inspirationWorkout 
              ? `Creating a new workout inspired by "${inspirationWorkout.name}"`
              : 'Let AI create a personalized workout for you'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>Fitness Goal</Label>
            <Input
              placeholder="e.g., Build muscle, lose weight, improve endurance"
              value={formData.goal}
              onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Duration (minutes)</Label>
              <Select value={formData.duration.toString()} onValueChange={(v) => setFormData({ ...formData, duration: parseInt(v) })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {durations.map(d => (
                    <SelectItem key={d} value={d.toString()}>{d} min</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Difficulty</Label>
              <Select value={formData.difficulty} onValueChange={(v) => setFormData({ ...formData, difficulty: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {difficulties.map(d => (
                    <SelectItem key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Category</Label>
            <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map(c => (
                  <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Available Equipment</Label>
            <Input
              placeholder="e.g., Dumbbells, resistance bands, pull-up bar"
              value={formData.equipment}
              onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
            />
          </div>

          <div>
            <Label>Focus Areas</Label>
            <Input
              placeholder="e.g., Upper body, legs, core"
              value={formData.focus}
              onChange={(e) => setFormData({ ...formData, focus: e.target.value })}
            />
          </div>

          <div>
            <Label className="text-base font-semibold">Special Instructions / Requirements</Label>
            <p className="text-xs text-slate-500 mb-2">
              {inspirationWorkout 
                ? 'Any specific changes from the inspiration workout? The AI will prioritize these instructions.'
                : 'Any specific requirements or preferences? The AI will prioritize these instructions.'}
            </p>
            <Textarea
              placeholder="e.g., No jumping exercises, focus on mobility, include specific movements, etc."
              value={formData.userNotes}
              onChange={(e) => setFormData({ ...formData, userNotes: e.target.value })}
              rows={4}
              className="resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={generating}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={generating} className="bg-purple-600 hover:bg-purple-700">
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Workout
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}