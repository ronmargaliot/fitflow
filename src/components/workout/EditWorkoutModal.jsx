import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Check, X, Sparkles, Upload } from 'lucide-react';
import { CATEGORIES, BODY_AREAS, DIFFICULTIES } from './WorkoutFilters';
import ImageUpload from '@/components/common/ImageUpload';
import AIWorkoutGenerator from './AIWorkoutGenerator';
import TextImageWorkoutGenerator from './TextImageWorkoutGenerator';

const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', 
  '#f59e0b', '#10b981', '#06b6d4', '#3b82f6'
];

export default function EditWorkoutModal({ open, onClose, workout, onSave }) {
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [showTextImageGenerator, setShowTextImageGenerator] = useState(false);
  const [data, setData] = useState({
    name: '',
    description: '',
    default_rest: 90,
    rest_between_exercises: 120,
    color: '#6366f1',
    category: 'strength',
    body_areas: [],
    difficulty: 'intermediate',
    duration_minutes: 45,
    cover_image: ''
  });

  useEffect(() => {
    if (workout) {
      setData({
        name: workout.name || '',
        description: workout.description || '',
        default_rest: workout.default_rest || 90,
        rest_between_exercises: workout.rest_between_exercises || 120,
        color: workout.color || '#6366f1',
        category: workout.category || 'strength',
        body_areas: workout.body_areas || [],
        difficulty: workout.difficulty || 'intermediate',
        duration_minutes: workout.duration_minutes || 45,
        cover_image: workout.cover_image || ''
      });
    } else {
      setData({
        name: '',
        description: '',
        default_rest: 90,
        rest_between_exercises: 120,
        color: '#6366f1',
        category: 'strength',
        body_areas: [],
        difficulty: 'intermediate',
        duration_minutes: 45,
        cover_image: ''
      });
    }
  }, [workout, open]);

  const toggleBodyArea = (area) => {
    setData(prev => ({
      ...prev,
      body_areas: prev.body_areas.includes(area)
        ? prev.body_areas.filter(a => a !== area)
        : [...prev.body_areas, area]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!data.name.trim()) return;
    
    // If editing and default_rest changed, update all exercises that don't have custom rest
    if (workout && workout.exercises && data.default_rest !== workout.default_rest) {
      const updatedExercises = workout.exercises.map(ex => {
        // Only update if the exercise was using the old default rest
        if (!ex.rest || ex.rest === workout.default_rest) {
          return { ...ex, rest: data.default_rest };
        }
        return ex;
      });
      onSave({ ...data, exercises: updatedExercises });
    } else {
      onSave(data);
    }
    onClose();
  };

  const handleAIGenerate = (aiWorkoutData) => {
    onSave(aiWorkoutData);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">
              {workout ? 'Edit Workout' : 'Create New Workout'}
            </DialogTitle>
            {!workout && (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    onClose();
                    setShowTextImageGenerator(true);
                  }}
                  className="border-blue-200 text-blue-600 hover:bg-blue-50"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Import
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    onClose();
                    setShowAIGenerator(true);
                  }}
                  className="border-purple-200 text-purple-600 hover:bg-purple-50"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI Generate
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Workout Name</Label>
            <Input
              id="name"
              value={data.name}
              onChange={(e) => setData({ ...data, name: e.target.value })}
              placeholder="e.g., Pull Day"
              className="mt-1"
              autoFocus
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={data.description}
              onChange={(e) => setData({ ...data, description: e.target.value })}
              className="mt-1"
              placeholder="Describe your workout..."
              rows={2}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Category</Label>
              <Select value={data.category} onValueChange={(v) => setData({ ...data, category: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Difficulty</Label>
              <Select value={data.difficulty} onValueChange={(v) => setData({ ...data, difficulty: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTIES.map((diff) => (
                    <SelectItem key={diff.value} value={diff.value}>{diff.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Body Areas</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {BODY_AREAS.map((area) => (
                <Badge
                  key={area.value}
                  variant={data.body_areas.includes(area.value) ? "default" : "outline"}
                  className={`cursor-pointer transition-colors ${
                    data.body_areas.includes(area.value) 
                      ? 'bg-slate-900 hover:bg-slate-800' 
                      : 'hover:bg-slate-100'
                  }`}
                  onClick={() => toggleBodyArea(area.value)}
                >
                  {area.label}
                  {data.body_areas.includes(area.value) && (
                    <X className="w-3 h-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="duration">Duration (min)</Label>
              <Input
                id="duration"
                type="number"
                value={data.duration_minutes}
                onChange={(e) => setData({ ...data, duration_minutes: parseInt(e.target.value) || 45 })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="rest">Rest/Sets (s)</Label>
              <Input
                id="rest"
                type="number"
                value={data.default_rest}
                onChange={(e) => setData({ ...data, default_rest: parseInt(e.target.value) || 90 })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="rest_exercises">Rest/Exercises (s)</Label>
              <Input
                id="rest_exercises"
                type="number"
                value={data.rest_between_exercises}
                onChange={(e) => setData({ ...data, rest_between_exercises: parseInt(e.target.value) || 120 })}
                className="mt-1"
              />
            </div>
          </div>
          
          <div>
            <Label>Cover Image</Label>
            <ImageUpload
              value={data.cover_image}
              onChange={(url) => setData({ ...data, cover_image: url })}
              className="mt-2 h-32"
              placeholder="Upload cover image"
            />
          </div>

          <div>
            <Label>Theme Color</Label>
            <div className="flex gap-2 mt-2">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setData({ ...data, color })}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                  style={{ backgroundColor: color }}
                >
                  {data.color === color && (
                    <Check className="w-4 h-4 text-white" />
                  )}
                </button>
              ))}
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-slate-900 hover:bg-slate-800">
              {workout ? 'Save Changes' : 'Create Workout'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      </Dialog>

      <AIWorkoutGenerator
        open={showAIGenerator}
        onClose={() => setShowAIGenerator(false)}
        onGenerate={handleAIGenerate}
      />

      <TextImageWorkoutGenerator
        open={showTextImageGenerator}
        onClose={() => setShowTextImageGenerator(false)}
        onGenerate={handleAIGenerate}
      />
    </>
  );
}