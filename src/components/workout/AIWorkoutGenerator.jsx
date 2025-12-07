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

  const generateExercisesFallback = async (workoutContext) => {
    // Fallback: Generate exercises in a separate call with simpler schema
    const exercisePrompt = `Generate 6-8 exercises for a ${workoutContext.difficulty} ${workoutContext.category} workout.
Duration: ${workoutContext.duration} minutes
Equipment: ${workoutContext.equipment || 'Bodyweight and basic gym equipment'}
Focus: ${workoutContext.focus || 'Full body'}

Return a JSON array with exercises. Each exercise MUST have:
- name: string (exercise name)
- sets: number (3-4)
- exercise_type: "reps" or "time"
- reps: string (e.g. "10-12") - only if type is reps
- duration_seconds: number (20-60) - only if type is time
- rest: number (45-90 seconds)
- weight: number (kg, 0 for bodyweight)
- notes: string (brief form tip)

Example: [{"name": "Push-ups", "sets": 3, "exercise_type": "reps", "reps": "12-15", "rest": 60, "weight": 0, "notes": "Keep back straight"}]`;

    const exercisesResult = await base44.integrations.Core.InvokeLLM({
      prompt: exercisePrompt,
      response_json_schema: {
        type: 'object',
        properties: {
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
                exercise_type: { type: 'string' },
                duration_seconds: { type: 'number' },
                rest: { type: 'number' },
                weight: { type: 'number' },
                notes: { type: 'string' }
              }
            }
          }
        }
      }
    });

    return exercisesResult.exercises || [];
  };

  const handleGenerate = async () => {
    setGenerating(true);
    
    try {
      const inspirationText = inspirationWorkout 
        ? `\n\nUse this workout as inspiration:\n${JSON.stringify(inspirationWorkout, null, 2)}`
        : '';

      const userNotesSection = formData.userNotes 
        ? `\n\n⚠️ USER REQUIREMENTS:\n${formData.userNotes}\n`
        : '';

      // Step 1: Generate workout metadata and exercises together
      const prompt = `Generate a complete ${formData.difficulty} ${formData.category} workout plan.

Requirements:
- Goal: ${formData.goal || 'General fitness'}
- Duration: ${formData.duration} minutes
- Equipment: ${formData.equipment || 'Standard gym equipment'}
- Focus: ${formData.focus || 'Full body'}
${userNotesSection}${inspirationText}

Create a workout with:
1. Workout metadata (name, description, rest times, tips)
2. 6-10 exercises with complete details

For each exercise include:
- name: Exercise name
- sets: 3-4 sets
- exercise_type: "reps" or "time"
- reps: Rep range (e.g., "10-12") if reps-based
- duration_seconds: Duration if time-based
- rest: Rest time in seconds (45-90)
- weight: Weight in kg (0 for bodyweight)
- notes: Form cues`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          required: ['name', 'exercises'],
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            default_rest: { type: 'number' },
            rest_between_exercises: { type: 'number' },
            tips: { type: 'string' },
            exercises: {
              type: 'array',
              minItems: 5,
              items: {
                type: 'object',
                required: ['name', 'sets', 'exercise_type'],
                properties: {
                  name: { type: 'string' },
                  sets: { type: 'number' },
                  reps: { type: 'string' },
                  exercise_type: { type: 'string' },
                  duration_seconds: { type: 'number' },
                  rest: { type: 'number' },
                  weight: { type: 'number' },
                  notes: { type: 'string' }
                }
              }
            }
          }
        }
      });

      // Validate exercises
      let exercises = result.exercises || [];
      
      // If insufficient exercises, use fallback
      if (exercises.length < 5) {
        console.warn('Insufficient exercises from main call, using fallback...');
        exercises = await generateExercisesFallback({
          difficulty: formData.difficulty,
          category: formData.category,
          duration: formData.duration,
          equipment: formData.equipment,
          focus: formData.focus
        });
      }

      // Validate again
      if (!exercises || exercises.length < 5) {
        throw new Error('Failed to generate exercises. Please try again.');
      }

      // Process and enrich exercises
      const processedExercises = await Promise.all(
        exercises.slice(0, 10).map(async (ex, idx) => {
          let demo_video = '';
          
          // Try to find YouTube video
          try {
            const videoSearch = await base44.integrations.Core.InvokeLLM({
              prompt: `Find the best YouTube demonstration video for: "${ex.name}". Return only the YouTube URL.`,
              add_context_from_internet: true
            });
            if (videoSearch && videoSearch.includes('youtube.com')) {
              demo_video = videoSearch.trim().split('\n')[0];
            }
          } catch (err) {
            console.warn(`Video search failed for ${ex.name}`);
          }

          return {
            id: `ex_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 9)}`,
            name: ex.name,
            sets: ex.sets || 3,
            exercise_type: ex.exercise_type || 'reps',
            reps: ex.exercise_type === 'reps' ? (ex.reps || '10-12') : undefined,
            duration_seconds: ex.exercise_type === 'time' ? (ex.duration_seconds || 30) : undefined,
            rest: ex.rest || 60,
            weight: ex.weight || 0,
            notes: ex.notes || '',
            demo_video
          };
        })
      );

      const workoutData = {
        name: result.name || `${formData.category.charAt(0).toUpperCase() + formData.category.slice(1)} Workout`,
        description: result.description || `A ${formData.difficulty} ${formData.category} workout`,
        default_rest: result.default_rest || 60,
        rest_between_exercises: result.rest_between_exercises || 90,
        tips: result.tips || 'Focus on form and breathing',
        category: formData.category,
        difficulty: formData.difficulty,
        duration_minutes: formData.duration,
        exercises: processedExercises,
        color: getColorForCategory(formData.category),
        is_public: false
      };

      // Final check
      if (!workoutData.exercises || workoutData.exercises.length < 5) {
        throw new Error('Workout validation failed');
      }

      onGenerate(workoutData);
      onClose();
      
    } catch (error) {
      console.error('Workout generation failed:', error);
      alert(`Failed to generate workout: ${error.message}. Please try again.`);
    } finally {
      setGenerating(false);
    }
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