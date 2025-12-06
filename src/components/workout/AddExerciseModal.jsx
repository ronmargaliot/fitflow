import React, { useState } from 'react';
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

import { Plus, Timer, Hash, Search } from 'lucide-react';
import ImageUpload from '@/components/common/ImageUpload';
import VideoSearchModal from './VideoSearchModal';

export default function AddExerciseModal({ open, onClose, onAdd, defaultRest }) {
  const [showVideoSearch, setShowVideoSearch] = useState(false);
  const [exercise, setExercise] = useState({
    name: '',
    exercise_type: 'reps',
    sets: 3,
    reps: '8',
    duration_seconds: 30,
    rest: defaultRest || 90,
    weight: 0,
    notes: '',
    demo_image: '',
    demo_video: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!exercise.name.trim()) return;
    
    onAdd({
      ...exercise,
      id: `custom_${Date.now()}`
    });
    
    setExercise({
      name: '',
      exercise_type: 'reps',
      sets: 3,
      reps: '8',
      duration_seconds: 30,
      rest: defaultRest || 90,
      weight: 0,
      notes: '',
      demo_image: '',
      demo_video: ''
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Add New Exercise</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Exercise Name</Label>
            <Input
              id="name"
              value={exercise.name}
              onChange={(e) => setExercise({ ...exercise, name: e.target.value })}
              placeholder="e.g., Pull-Ups"
              className="mt-1"
              autoFocus
            />
          </div>

          <div>
            <Label className="mb-2 block">Exercise Type</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={exercise.exercise_type === 'reps' ? 'default' : 'outline'}
                className={`flex items-center justify-center gap-2 ${
                  exercise.exercise_type === 'reps' 
                    ? 'bg-slate-900 text-white hover:bg-slate-800' 
                    : 'bg-white hover:bg-slate-50'
                }`}
                onClick={() => setExercise({ ...exercise, exercise_type: 'reps' })}
              >
                <Hash className="w-4 h-4" />
                Rep-based
              </Button>
              <Button
                type="button"
                variant={exercise.exercise_type === 'time' ? 'default' : 'outline'}
                className={`flex items-center justify-center gap-2 ${
                  exercise.exercise_type === 'time' 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-white hover:bg-slate-50'
                }`}
                onClick={() => setExercise({ ...exercise, exercise_type: 'time' })}
              >
                <Timer className="w-4 h-4" />
                Time-based
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="sets">Sets</Label>
              <Input
                id="sets"
                type="number"
                value={exercise.sets}
                onChange={(e) => setExercise({ ...exercise, sets: parseInt(e.target.value) || 0 })}
                className="mt-1"
              />
            </div>
            {exercise.exercise_type === 'reps' ? (
              <div>
                <Label htmlFor="reps">Reps</Label>
                <Input
                  id="reps"
                  value={exercise.reps}
                  onChange={(e) => setExercise({ ...exercise, reps: e.target.value })}
                  className="mt-1"
                  placeholder="8"
                />
              </div>
            ) : (
              <div>
                <Label htmlFor="duration">Duration (s)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={exercise.duration_seconds}
                  onChange={(e) => setExercise({ ...exercise, duration_seconds: parseInt(e.target.value) || 30 })}
                  className="mt-1"
                  placeholder="30"
                />
              </div>
            )}
            <div>
              <Label htmlFor="rest">Rest (s)</Label>
              <Input
                id="rest"
                type="number"
                value={exercise.rest}
                onChange={(e) => setExercise({ ...exercise, rest: parseInt(e.target.value) || 0 })}
                className="mt-1"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="weight">Weight (kg) - optional</Label>
            <Input
              id="weight"
              type="number"
              value={exercise.weight || ''}
              onChange={(e) => setExercise({ ...exercise, weight: parseFloat(e.target.value) || 0 })}
              className="mt-1"
              placeholder="0"
            />
          </div>
          
          <div>
            <Label htmlFor="notes">Notes - optional</Label>
            <Textarea
              id="notes"
              value={exercise.notes}
              onChange={(e) => setExercise({ ...exercise, notes: e.target.value })}
              className="mt-1"
              placeholder="Any additional notes..."
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="video">YouTube Video URL - optional</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="video"
                value={exercise.demo_video}
                onChange={(e) => setExercise({ ...exercise, demo_video: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=..."
              />
              <Button
                type="button"
                variant="outline"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowVideoSearch(true);
                }}
                disabled={!exercise.name}
              >
                <Search className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-slate-500 mt-1">Paste URL or search for a video</p>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-slate-900 hover:bg-slate-800">
              <Plus className="w-4 h-4 mr-2" />
              Add Exercise
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      
      {showVideoSearch && (
        <VideoSearchModal
          open={showVideoSearch}
          onClose={() => setShowVideoSearch(false)}
          onSelect={(url) => {
            setExercise({ ...exercise, demo_video: url });
            setShowVideoSearch(false);
          }}
          exerciseName={exercise.name}
        />
      )}
    </Dialog>
  );
}