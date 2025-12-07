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

  // STEP 1: Generate workout using structured schema
  const generateWorkoutStructure = async (userInput) => {
    const prompt = `You are a workout generation engine for a fitness app.
Your only job is to generate structured workouts and never return an empty workout.

Global rules (always follow):
- Always output valid JSON only, no prose, no markdown
- The JSON must always include at least one exercise
- Never return an empty exercises array
- Do not invent new JSON fields

User requirements:
- Goal: ${userInput.goal || 'General fitness'}
- Category: ${userInput.category}
- Difficulty: ${userInput.difficulty}
- Duration: ${userInput.duration} minutes
- Equipment: ${userInput.equipment || 'Standard gym equipment'}
- Focus: ${userInput.focus || 'Full body'}
${userInput.userNotes ? `- Special requirements: ${userInput.userNotes}` : ''}

Generate a workout with 6-10 exercises. Return JSON in this EXACT structure:

{
  "workout_metadata": {
    "title": "Workout Name",
    "goal": "${userInput.goal || 'fitness'}",
    "experience_level": "${userInput.difficulty}",
    "session_duration_minutes": ${userInput.duration},
    "training_split_hint": "${userInput.focus || 'full body'}"
  },
  "exercises": [
    {
      "exercise_name": "Exercise Name",
      "primary_muscle_group": "chest|back|legs|arms|shoulders|core",
      "secondary_muscle_groups": ["muscle group"],
      "equipment": "equipment name",
      "is_bodyweight": true,
      "order_index": 1,
      "sets": [
        {
          "set_index": 1,
          "reps": 10,
          "load_type": "bodyweight",
          "target_load_value": null,
          "rest_seconds": 60,
          "notes": "form cue"
        }
      ],
      "notes": "exercise notes"
    }
  ]
}

Constraints:
- exercises must have length ≥ 6
- Each exercise must have at least one set in sets
- order_index and set_index must be 1-based and sequential
- Use clear exercise names (e.g., "Barbell Bench Press")`;

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          required: ['workout_metadata', 'exercises'],
          properties: {
            workout_metadata: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                goal: { type: 'string' },
                experience_level: { type: 'string' },
                session_duration_minutes: { type: 'number' },
                training_split_hint: { type: 'string' }
              }
            },
            exercises: {
              type: 'array',
              minItems: 6,
              items: {
                type: 'object',
                required: ['exercise_name', 'sets'],
                properties: {
                  exercise_name: { type: 'string' },
                  primary_muscle_group: { type: 'string' },
                  secondary_muscle_groups: { type: 'array', items: { type: 'string' } },
                  equipment: { type: 'string' },
                  is_bodyweight: { type: 'boolean' },
                  order_index: { type: 'number' },
                  sets: {
                    type: 'array',
                    minItems: 1,
                    items: {
                      type: 'object',
                      properties: {
                        set_index: { type: 'number' },
                        reps: { type: 'number' },
                        load_type: { type: 'string' },
                        target_load_value: { type: ['number', 'null'] },
                        rest_seconds: { type: 'number' },
                        notes: { type: 'string' }
                      }
                    }
                  },
                  notes: { type: 'string' }
                }
              }
            }
          }
        }
      });

      return result;
    } catch (err) {
      console.error('Step 1 failed:', err);
      return null;
    }
  };

  // STEP 2: Validate and normalize the workout
  const normalizeWorkout = async (rawWorkout) => {
    const prompt = `You are now given a raw workout JSON. Your job is to validate, clean, and normalize this JSON.

Raw workout:
${JSON.stringify(rawWorkout)}

Validate structure:
- Ensure exercises is an array with length ≥ 1
- Each exercise must have exercise_name, sets array
- Each set must have set_index, reps, rest_seconds

Repair issues:
- If order_index or set_index missing, recalculate sequentially
- If rest_seconds missing, default to 60
- If reps missing, default to 10

If no valid exercises remain after repair, create ONE fallback:
{
  "exercise_name": "Bodyweight Squat",
  "primary_muscle_group": "legs",
  "equipment": "bodyweight",
  "is_bodyweight": true,
  "order_index": 1,
  "sets": [
    {"set_index": 1, "reps": 10, "load_type": "bodyweight", "target_load_value": null, "rest_seconds": 60, "notes": ""}
  ],
  "notes": ""
}

Return the normalized workout with the same structure. Output only JSON.`;

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          required: ['workout_metadata', 'exercises'],
          properties: {
            workout_metadata: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                goal: { type: 'string' },
                experience_level: { type: 'string' },
                session_duration_minutes: { type: 'number' }
              }
            },
            exercises: {
              type: 'array',
              minItems: 1,
              items: {
                type: 'object',
                required: ['exercise_name', 'sets'],
                properties: {
                  exercise_name: { type: 'string' },
                  primary_muscle_group: { type: 'string' },
                  equipment: { type: 'string' },
                  is_bodyweight: { type: 'boolean' },
                  order_index: { type: 'number' },
                  sets: {
                    type: 'array',
                    minItems: 1,
                    items: {
                      type: 'object',
                      properties: {
                        set_index: { type: 'number' },
                        reps: { type: 'number' },
                        load_type: { type: 'string' },
                        target_load_value: { type: ['number', 'null'] },
                        rest_seconds: { type: 'number' }
                      }
                    }
                  },
                  notes: { type: 'string' }
                }
              }
            }
          }
        }
      });

      return result;
    } catch (err) {
      console.error('Step 2 failed:', err);
      return rawWorkout; // Return original if normalization fails
    }
  };

  // STEP 3: Transform to app format
  const transformToAppFormat = (normalizedWorkout, userInput) => {
    const exercises = normalizedWorkout.exercises.map((ex, idx) => {
      // Determine exercise type based on load_type
      const firstSet = ex.sets[0];
      const isTimeBased = firstSet?.load_type === 'time';
      
      return {
        id: `ex_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 9)}`,
        name: ex.exercise_name,
        sets: ex.sets.length,
        exercise_type: isTimeBased ? 'time' : 'reps',
        reps: !isTimeBased ? String(firstSet?.reps || 10) : undefined,
        duration_seconds: isTimeBased ? (firstSet?.reps || 30) : undefined,
        rest: firstSet?.rest_seconds || 60,
        weight: firstSet?.target_load_value || 0,
        notes: ex.notes || '',
        demo_video: ''
      };
    });

    return {
      name: normalizedWorkout.workout_metadata.title,
      description: `A ${userInput.difficulty} ${userInput.category} workout${userInput.goal ? ' focused on ' + userInput.goal : ''}`,
      default_rest: 60,
      rest_between_exercises: 90,
      tips: 'Focus on proper form and controlled movements.',
      category: userInput.category,
      difficulty: userInput.difficulty,
      duration_minutes: userInput.duration,
      exercises: exercises,
      color: getColorForCategory(userInput.category),
      is_public: false
    };
  };

  // HARDCODED EMERGENCY FALLBACK
  const getEmergencyFallback = (userInput) => {
    const fallbackExercises = {
      strength: [
        { name: 'Push-ups', sets: 3, reps: '12', rest: 60, weight: 0, notes: 'Keep core tight' },
        { name: 'Bodyweight Squats', sets: 4, reps: '15', rest: 60, weight: 0, notes: 'Chest up' },
        { name: 'Plank', sets: 3, duration_seconds: 45, rest: 60, weight: 0, notes: 'Hold straight' },
        { name: 'Lunges', sets: 3, reps: '10 each leg', rest: 60, weight: 0, notes: 'Knee at 90°' },
        { name: 'Dips', sets: 3, reps: '10', rest: 90, weight: 0, notes: 'Full range' },
        { name: 'Mountain Climbers', sets: 3, duration_seconds: 30, rest: 60, weight: 0, notes: 'Keep hips low' }
      ],
      calisthenics: [
        { name: 'Pull-ups', sets: 3, reps: '6-8', rest: 90, weight: 0, notes: 'Full ROM' },
        { name: 'Dips', sets: 3, reps: '10', rest: 90, weight: 0, notes: 'Lean forward' },
        { name: 'Pike Push-ups', sets: 3, reps: '12', rest: 60, weight: 0, notes: 'Hips high' },
        { name: 'Hanging Leg Raises', sets: 3, reps: '10', rest: 60, weight: 0, notes: 'Control descent' },
        { name: 'Handstand Hold', sets: 3, duration_seconds: 20, rest: 90, weight: 0, notes: 'Against wall' },
        { name: 'L-Sit', sets: 3, duration_seconds: 15, rest: 60, weight: 0, notes: 'Legs straight' }
      ],
      cardio: [
        { name: 'Jumping Jacks', sets: 3, duration_seconds: 45, rest: 30, weight: 0, notes: 'Steady pace' },
        { name: 'High Knees', sets: 3, duration_seconds: 30, rest: 30, weight: 0, notes: 'Drive knees up' },
        { name: 'Burpees', sets: 3, reps: '10', rest: 45, weight: 0, notes: 'Full ROM' },
        { name: 'Mountain Climbers', sets: 3, duration_seconds: 40, rest: 30, weight: 0, notes: 'Fast pace' },
        { name: 'Jump Squats', sets: 3, reps: '12', rest: 45, weight: 0, notes: 'Land softly' },
        { name: 'Skater Hops', sets: 3, reps: '15 each side', rest: 45, weight: 0, notes: 'Lateral power' }
      ]
    };

    const exercises = (fallbackExercises[userInput.category] || fallbackExercises.strength).map((ex, idx) => ({
      id: `ex_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 9)}`,
      name: ex.name,
      sets: ex.sets,
      exercise_type: ex.duration_seconds ? 'time' : 'reps',
      reps: ex.reps,
      duration_seconds: ex.duration_seconds,
      rest: ex.rest,
      weight: ex.weight,
      notes: ex.notes,
      demo_video: ''
    }));

    return {
      name: `${userInput.category.charAt(0).toUpperCase() + userInput.category.slice(1)} Workout`,
      description: `A ${userInput.difficulty} ${userInput.category} workout`,
      default_rest: 60,
      rest_between_exercises: 90,
      tips: 'Focus on form and controlled movements.',
      category: userInput.category,
      difficulty: userInput.difficulty,
      duration_minutes: userInput.duration,
      exercises: exercises,
      color: getColorForCategory(userInput.category),
      is_public: false
    };
  };

  const handleGenerate = async () => {
    setGenerating(true);
    
    try {
      const userInput = {
        goal: formData.goal,
        category: formData.category,
        difficulty: formData.difficulty,
        duration: formData.duration,
        equipment: formData.equipment,
        focus: formData.focus,
        userNotes: formData.userNotes
      };

      console.log('🎯 Starting workout generation with:', userInput);

      // STEP 1: Generate structured workout
      console.log('📝 Step 1: Generating workout structure...');
      let rawWorkout = await generateWorkoutStructure(userInput);
      console.log('✅ Step 1 result:', rawWorkout);
      
      if (!rawWorkout || !rawWorkout.exercises || rawWorkout.exercises.length === 0) {
        console.error('❌ Step 1 failed - no exercises generated, using emergency fallback');
        const fallbackWorkout = getEmergencyFallback(userInput);
        onGenerate(fallbackWorkout);
        onClose();
        return;
      }

      // STEP 2: Normalize and validate
      console.log('🔧 Step 2: Normalizing workout...');
      const normalizedWorkout = await normalizeWorkout(rawWorkout);
      console.log('✅ Step 2 result:', normalizedWorkout);
      
      if (!normalizedWorkout.exercises || normalizedWorkout.exercises.length === 0) {
        console.error('❌ Step 2 failed - no exercises after normalization, using emergency fallback');
        const fallbackWorkout = getEmergencyFallback(userInput);
        onGenerate(fallbackWorkout);
        onClose();
        return;
      }

      // STEP 3: Transform to app format
      console.log('🔄 Step 3: Transforming to app format...');
      const workoutData = transformToAppFormat(normalizedWorkout, userInput);
      console.log('✅ Step 3 result exercises count:', workoutData.exercises.length);

      // FINAL CHECK
      if (!workoutData.exercises || workoutData.exercises.length === 0) {
        console.error('❌ CRITICAL: Transform failed, using emergency fallback');
        const fallbackWorkout = getEmergencyFallback(userInput);
        onGenerate(fallbackWorkout);
        onClose();
        return;
      }

      // STEP 4: Enrich with videos (best effort, non-blocking)
      console.log('🎥 Step 4: Adding video demos...');
      try {
        for (let i = 0; i < Math.min(3, workoutData.exercises.length); i++) {
          try {
            const videoResult = await base44.integrations.Core.InvokeLLM({
              prompt: `Find YouTube URL for: "${workoutData.exercises[i].name}". Return ONLY the URL.`,
              add_context_from_internet: true
            });
            if (videoResult && videoResult.includes('youtube.com')) {
              workoutData.exercises[i].demo_video = videoResult.trim().split('\n')[0];
            }
          } catch (err) {
            console.warn(`Video failed for exercise ${i}`);
          }
        }
      } catch (err) {
        console.warn('Video enrichment skipped');
      }

      console.log('✅ SUCCESS: Generated workout with', workoutData.exercises.length, 'exercises');
      onGenerate(workoutData);
      onClose();
      
    } catch (error) {
      console.error('❌ FATAL ERROR:', error);
      const userInput = {
        goal: formData.goal,
        category: formData.category,
        difficulty: formData.difficulty,
        duration: formData.duration,
        equipment: formData.equipment,
        focus: formData.focus,
        userNotes: formData.userNotes
      };
      const fallbackWorkout = getEmergencyFallback(userInput);
      onGenerate(fallbackWorkout);
      onClose();
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