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

  // Hardcoded fallback exercises by category
  const getHardcodedFallback = (category, difficulty) => {
    const fallbacks = {
      strength: [
        { name: 'Push-ups', sets: 3, exercise_type: 'reps', reps: '10-12', rest: 60, weight: 0, notes: 'Keep body straight' },
        { name: 'Squats', sets: 4, exercise_type: 'reps', reps: '12-15', rest: 60, weight: 0, notes: 'Chest up, knees tracking toes' },
        { name: 'Plank', sets: 3, exercise_type: 'time', duration_seconds: 30, rest: 60, weight: 0, notes: 'Hold straight line' },
        { name: 'Lunges', sets: 3, exercise_type: 'reps', reps: '10', rest: 60, weight: 0, notes: 'Alternate legs' },
        { name: 'Dumbbell Rows', sets: 3, exercise_type: 'reps', reps: '12', rest: 60, weight: 10, notes: 'Pull elbow back' },
        { name: 'Shoulder Press', sets: 3, exercise_type: 'reps', reps: '10', rest: 60, weight: 8, notes: 'Control the weight' }
      ],
      cardio: [
        { name: 'Jumping Jacks', sets: 3, exercise_type: 'time', duration_seconds: 45, rest: 30, weight: 0, notes: 'Keep steady rhythm' },
        { name: 'High Knees', sets: 3, exercise_type: 'time', duration_seconds: 30, rest: 30, weight: 0, notes: 'Drive knees high' },
        { name: 'Burpees', sets: 3, exercise_type: 'reps', reps: '10', rest: 45, weight: 0, notes: 'Full range of motion' },
        { name: 'Mountain Climbers', sets: 3, exercise_type: 'time', duration_seconds: 30, rest: 30, weight: 0, notes: 'Keep hips low' },
        { name: 'Jump Rope', sets: 3, exercise_type: 'time', duration_seconds: 60, rest: 30, weight: 0, notes: 'Stay light on feet' }
      ],
      calisthenics: [
        { name: 'Pull-ups', sets: 3, exercise_type: 'reps', reps: '8', rest: 90, weight: 0, notes: 'Full range of motion' },
        { name: 'Dips', sets: 3, exercise_type: 'reps', reps: '10', rest: 60, weight: 0, notes: 'Chest slightly forward' },
        { name: 'Pike Push-ups', sets: 3, exercise_type: 'reps', reps: '12', rest: 60, weight: 0, notes: 'Hips high' },
        { name: 'Hanging Leg Raises', sets: 3, exercise_type: 'reps', reps: '10', rest: 60, weight: 0, notes: 'Control the descent' },
        { name: 'Pistol Squats', sets: 3, exercise_type: 'reps', reps: '6', rest: 90, weight: 0, notes: 'Use support if needed' }
      ]
    };
    
    return fallbacks[category] || fallbacks.strength;
  };

  // Step 1: Generate exercises only (focused call)
  const generateExercises = async (context) => {
    const prompt = `You are a workout generation engine. Your ONLY job is to return a list of exercises.

CRITICAL RULES:
1. ALWAYS return at least 6 exercises
2. NEVER return an empty array
3. Output valid JSON ONLY - no markdown, no explanations

Generate 6-8 exercises for:
- Category: ${context.category}
- Difficulty: ${context.difficulty}
- Duration: ${context.duration} minutes
- Equipment: ${context.equipment || 'standard gym equipment'}
- Focus: ${context.focus || 'full body'}
${context.userNotes ? `- Special requirements: ${context.userNotes}` : ''}

Return ONLY this JSON structure:
[
  {
    "name": "Exercise Name",
    "sets": 3,
    "exercise_type": "reps",
    "reps": "10-12",
    "rest": 60,
    "weight": 0,
    "notes": "Brief form tip"
  }
]

For time-based exercises use:
{
  "name": "Exercise Name",
  "sets": 3,
  "exercise_type": "time",
  "duration_seconds": 30,
  "rest": 60,
  "weight": 0,
  "notes": "Brief form tip"
}`;

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'array',
          minItems: 6,
          items: {
            type: 'object',
            required: ['name', 'sets', 'exercise_type'],
            properties: {
              name: { type: 'string', minLength: 3 },
              sets: { type: 'number', minimum: 1 },
              exercise_type: { type: 'string', enum: ['reps', 'time'] },
              reps: { type: 'string' },
              duration_seconds: { type: 'number' },
              rest: { type: 'number', minimum: 0 },
              weight: { type: 'number', minimum: 0 },
              notes: { type: 'string' }
            }
          }
        }
      });

      if (Array.isArray(result) && result.length >= 6) {
        return result;
      }
      return null;
    } catch (err) {
      console.warn('Exercise generation failed:', err);
      return null;
    }
  };

  // Step 2: Validate and normalize exercises
  const normalizeExercises = (rawExercises) => {
    if (!rawExercises || !Array.isArray(rawExercises)) return [];
    
    return rawExercises
      .filter(ex => ex.name && ex.name.trim().length > 0)
      .map(ex => ({
        name: ex.name.trim(),
        sets: Math.max(1, ex.sets || 3),
        exercise_type: ex.exercise_type === 'time' ? 'time' : 'reps',
        reps: ex.exercise_type === 'reps' ? (ex.reps || '10') : undefined,
        duration_seconds: ex.exercise_type === 'time' ? (ex.duration_seconds || 30) : undefined,
        rest: Math.max(0, ex.rest || 60),
        weight: Math.max(0, ex.weight || 0),
        notes: (ex.notes || '').trim()
      }));
  };

  // Step 3: Enrich with video demos
  const enrichWithVideos = async (exercises) => {
    return Promise.all(
      exercises.map(async (ex, idx) => {
        let demo_video = '';
        try {
          const videoResult = await base44.integrations.Core.InvokeLLM({
            prompt: `Find YouTube URL for: "${ex.name}". Return ONLY the URL.`,
            add_context_from_internet: true
          });
          if (videoResult && videoResult.includes('youtube.com')) {
            demo_video = videoResult.trim().split('\n')[0];
          }
        } catch (err) {
          console.warn(`Video search failed for ${ex.name}`);
        }

        return {
          ...ex,
          id: `ex_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 9)}`,
          demo_video
        };
      })
    );
  };

  const handleGenerate = async () => {
    setGenerating(true);
    
    try {
      const context = {
        category: formData.category,
        difficulty: formData.difficulty,
        duration: formData.duration,
        equipment: formData.equipment,
        focus: formData.focus,
        userNotes: formData.userNotes
      };

      // Try 3 times to generate exercises
      let rawExercises = null;
      for (let attempt = 1; attempt <= 3; attempt++) {
        console.log(`Generation attempt ${attempt}/3...`);
        rawExercises = await generateExercises(context);
        if (rawExercises && rawExercises.length >= 6) break;
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Normalize whatever we got
      let exercises = normalizeExercises(rawExercises);

      // If still insufficient, use hardcoded fallback
      if (exercises.length < 6) {
        console.warn('Using hardcoded fallback exercises');
        exercises = getHardcodedFallback(context.category, context.difficulty);
      }

      // Enrich with videos (non-blocking, best effort)
      const enrichedExercises = await enrichWithVideos(exercises.slice(0, 10));

      // Generate metadata
      const workoutData = {
        name: `${formData.goal ? formData.goal + ' - ' : ''}${formData.category.charAt(0).toUpperCase() + formData.category.slice(1)} Workout`,
        description: `A ${formData.difficulty} ${formData.category} workout${formData.goal ? ' focused on ' + formData.goal : ''}`,
        default_rest: 60,
        rest_between_exercises: 90,
        tips: 'Focus on proper form and controlled movements. Breathe consistently throughout each exercise.',
        category: formData.category,
        difficulty: formData.difficulty,
        duration_minutes: formData.duration,
        exercises: enrichedExercises,
        color: getColorForCategory(formData.category),
        is_public: false
      };

      // FINAL GUARANTEE: Must have exercises
      if (!workoutData.exercises || workoutData.exercises.length === 0) {
        throw new Error('CRITICAL: No exercises generated. This should never happen.');
      }

      onGenerate(workoutData);
      onClose();
      
    } catch (error) {
      console.error('Workout generation failed:', error);
      alert('Failed to generate workout. Please try again.');
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