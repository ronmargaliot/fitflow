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
    style: ''
  });

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const inspirationText = inspirationWorkout 
        ? `\n\nUse this workout as inspiration (don't copy it exactly, but use similar structure/intensity/style):\n${JSON.stringify(inspirationWorkout, null, 2)}`
        : '';

      const prompt = `Generate a detailed workout plan with the following requirements:
- Goal: ${formData.goal || 'General fitness'}
- Duration: ${formData.duration} minutes
- Difficulty: ${formData.difficulty}
- Category: ${formData.category}
- Equipment: ${formData.equipment || 'No specific equipment required'}
- Focus areas: ${formData.focus || 'Full body'}
- Style/Vibe: ${formData.style || 'Balanced and effective'}
${inspirationText}

Please create a complete workout with 6-10 exercises. For each exercise provide:
- name: Exercise name
- sets: Number of sets (usually 3-4)
- reps: Reps per set (e.g., "10-12" or "15")
- exercise_type: "reps" or "time"
- duration_seconds: If time-based, duration in seconds
- rest: Rest between sets in seconds (usually 45-90)
- weight: Suggested weight in kg (0 if bodyweight)
- notes: Brief form tips

Also provide:
- name: Workout name (creative and motivating)
- description: Brief description
- default_rest: Default rest between sets (60-90 seconds)
- rest_between_exercises: Rest between exercises (90-120 seconds)
- tips: General tips for the workout

Make it challenging but achievable for the specified difficulty level.`;

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
              items: {
                type: 'object',
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

      // Validate and process exercises
      if (!result.exercises || !Array.isArray(result.exercises) || result.exercises.length === 0) {
        throw new Error('No exercises were generated. Please try again.');
      }

      const workoutData = {
        ...result,
        category: formData.category,
        difficulty: formData.difficulty,
        duration_minutes: formData.duration,
        exercises: result.exercises.map((ex, idx) => ({
          ...ex,
          id: `ex_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 9)}`,
          exercise_type: ex.exercise_type || 'reps',
          sets: ex.sets || 3,
          reps: ex.reps || '10',
          rest: ex.rest || 60,
          weight: ex.weight || 0,
          notes: ex.notes || ''
        })),
        color: getColorForCategory(formData.category),
        is_public: false
      };

      onGenerate(workoutData);
      onClose();
    } catch (error) {
      console.error('Failed to generate workout:', error);
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

          {inspirationWorkout && (
            <div>
              <Label>Style / Additional Instructions</Label>
              <Textarea
                placeholder="How should this differ from the inspiration workout? Any specific requests?"
                value={formData.style}
                onChange={(e) => setFormData({ ...formData, style: e.target.value })}
                rows={3}
              />
            </div>
          )}
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